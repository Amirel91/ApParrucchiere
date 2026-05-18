import { db, ensureDbSchema } from './db'
import {
  getDayOfWeekRome,
  getMinutesFromMidnightRome,
  formatDateRome,
  createInRome,
  addDays,
} from './timezone'

export interface SlotResult {
  date: string          // "YYYY-MM-DD"
  slots: string[]       // ["09:00", "09:15", ...]
  availability: 'high' | 'medium' | 'low' | 'none' // for calendar coloring
}

interface ResourceWithRanges {
  id: string
  name: string
  bookedRanges: { start: number; end: number }[]
}

/**
 * Smart slot algorithm (Multi-Resource):
 *
 * Given a date and a total duration (in minutes), find all time slots
 * where there's at least ONE active resource (chair/collaborator) that is
 * completely free for the entire duration.
 *
 * The slot is VALID if ANY resource has no overlapping bookings/blocks.
 * This enables parallel scheduling across multiple chairs.
 *
 * Falls back to single-resource behavior if no resources exist (backward compat).
 *
 * Returns slots in 15-minute intervals aligned to :00, :15, :30, :45
 */
export async function getAvailableSlots(
  dateStr: string,
  totalDurationMinutes: number,
  configId?: string
): Promise<SlotResult> {
  await ensureDbSchema()
  const dayOfWeek = getDayOfWeekRome(dateStr) // 1=Mon ... 7=Sun (Europe/Rome)

  // Get working hours for this day
  const config = await db.businessConfig.findFirst({
    where: configId ? { id: configId } : undefined,
    include: { workingHours: true, closedDates: true },
  })

  if (!config) {
    return { date: dateStr, slots: [], availability: 'none' }
  }

  // Check if this date is explicitly closed
  const isClosedDate = config.closedDates.some(cd => cd.date === dateStr)
  if (isClosedDate) {
    return { date: dateStr, slots: [], availability: 'none' }
  }

  const wh = config.workingHours.find(w => w.dayOfWeek === dayOfWeek)

  if (!wh || wh.closed) {
    return { date: dateStr, slots: [], availability: 'none' }
  }

  const [openH, openM] = wh.openTime.split(':').map(Number)
  const [closeH, closeM] = wh.closeTime.split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  // Parse lunch break
  let lunchStart = -1
  let lunchEnd = -1
  if (config.lunchBreakEnabled && config.lunchBreakStart && config.lunchBreakEnd) {
    const [lsH, lsM] = config.lunchBreakStart.split(':').map(Number)
    const [leH, leM] = config.lunchBreakEnd.split(':').map(Number)
    lunchStart = lsH * 60 + lsM
    lunchEnd = leH * 60 + leM
  }

  // Get active resources for this config
  const resources = await db.resource.findMany({
    where: { configId: config.id, active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })

  // Get ALL bookings for this date (across all resources) — UTC bounds from Rome day
  const dayStart = createInRome(dateStr, '00:00')
  const dayEnd = createInRome(dateStr, '23:59')
  const bookings = await db.booking.findMany({
    where: {
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ['confirmed', 'pending', 'blocked'] },
      configId: config.id,
    },
    select: {
      startTime: true,
      endTime: true,
      resourceId: true,
    },
  })

  // Build per-resource booked ranges
  const resourceRanges: ResourceWithRanges[] = resources.map(r => ({
    id: r.id,
    name: r.name,
    bookedRanges: [],
  }))

  // Also track "unassigned" bookings (legacy bookings with no resourceId)
  const unassignedRanges: { start: number; end: number }[] = []

  for (const b of bookings) {
    // Extract hours/minutes in Europe/Rome, not server UTC
    const range = {
      start: getMinutesFromMidnightRome(new Date(b.startTime)),
      end: getMinutesFromMidnightRome(new Date(b.endTime)),
    }

    if (b.resourceId) {
      const resource = resourceRanges.find(r => r.id === b.resourceId)
      if (resource) {
        resource.bookedRanges.push(range)
      } else {
        // Resource was deactivated or deleted — treat as unassigned
        unassignedRanges.push(range)
      }
    } else {
      // Legacy booking without resource — blocks ALL resources
      unassignedRanges.push(range)
    }
  }

  // Find all possible start times (every 15 min)
  const STEP = 15
  const availableSlots: string[] = []

  for (let t = openMinutes; t + totalDurationMinutes <= closeMinutes; t += STEP) {
    const slotEnd = t + totalDurationMinutes

    // Check if this slot overlaps with lunch break
    if (lunchStart >= 0 && lunchEnd >= 0) {
      if (t < lunchEnd && slotEnd > lunchStart) {
        continue // Slot overlaps with lunch break, skip it
      }
    }

    // Check if this slot is free on at least ONE resource
    let hasFreeResource = false

    for (const resource of resourceRanges) {
      // Check against unassigned (legacy) bookings — block all resources
      let blockedByUnassigned = false
      for (const range of unassignedRanges) {
        if (t < range.end && slotEnd > range.start) {
          blockedByUnassigned = true
          break
        }
      }
      if (blockedByUnassigned) continue

      // Check against this resource's own bookings
      let isFree = true
      for (const range of resource.bookedRanges) {
        if (t < range.end && slotEnd > range.start) {
          isFree = false
          break
        }
      }

      if (isFree) {
        hasFreeResource = true
        break // Found at least one free resource, slot is valid
      }
    }

    if (hasFreeResource) {
      const h = Math.floor(t / 60)
      const m = t % 60
      availableSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }

  // Calculate availability percentage for color coding
  const totalPossibleSlots = Math.max(1, Math.floor((closeMinutes - openMinutes - totalDurationMinutes) / STEP) + 1)
  const usedSlots = totalPossibleSlots - availableSlots.length
  const usedRatio = usedSlots / totalPossibleSlots

  let availability: SlotResult['availability']
  if (availableSlots.length === 0) {
    availability = 'none'
  } else if (usedRatio > 0.6) {
    availability = 'low'
  } else if (usedRatio > 0.3) {
    availability = 'medium'
  } else {
    availability = 'high'
  }

  return { date: dateStr, slots: availableSlots, availability }
}

/**
 * Find a free resource for a specific slot.
 * Used when creating a booking to auto-assign the best resource.
 * Returns the resource ID or null if no resource is free.
 */
export async function findFreeResource(
  dateStr: string,
  time: string,
  totalDurationMinutes: number,
  configId: string
): Promise<string | null> {
  await ensureDbSchema()

  const [timeH, timeM] = time.split(':').map(Number)
  const slotStart = timeH * 60 + timeM
  const slotEnd = slotStart + totalDurationMinutes

  // Get active resources
  const resources = await db.resource.findMany({
    where: { configId, active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true },
  })

  if (resources.length === 0) return null

  // Get all bookings for this date — UTC bounds from Rome day
  const dayStart = createInRome(dateStr, '00:00')
  const dayEnd = createInRome(dateStr, '23:59')
  const bookings = await db.booking.findMany({
    where: {
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ['confirmed', 'pending', 'blocked'] },
      configId,
    },
    select: { startTime: true, endTime: true, resourceId: true },
  })

  // Check unassigned bookings (block all resources) — Rome hours
  const unassignedBlocked = bookings
    .filter(b => !b.resourceId)
    .some(b => {
      const bs = getMinutesFromMidnightRome(new Date(b.startTime))
      const be = getMinutesFromMidnightRome(new Date(b.endTime))
      return slotStart < be && slotEnd > bs
    })

  if (unassignedBlocked) return null

  // Find first resource with no overlap
  for (const resource of resources) {
    const hasOverlap = bookings
      .filter(b => b.resourceId === resource.id)
      .some(b => {
        const bs = getMinutesFromMidnightRome(new Date(b.startTime))
        const be = getMinutesFromMidnightRome(new Date(b.endTime))
        return slotStart < be && slotEnd > bs
      })

    if (!hasOverlap) return resource.id
  }

  return null // No resource is free
}

/**
 * OPTIMIZED: Batch availability for a date range.
 *
 * Instead of N individual getAvailableSlots() calls (each doing 3 DB queries),
 * this does only 3 DB queries total:
 *   1. Config + workingHours + closedDates
 *   2. Active resources
 *   3. All bookings in the date range
 *
 * Then computes availability for every day in memory.
 *
 * Returns a map: { "YYYY-MM-DD": availabilityLevel }
 */
export async function getBatchAvailability(
  startDate: string,
  endDate: string,
  totalDurationMinutes: number,
  configId?: string
): Promise<Record<string, SlotResult['availability']>> {
  await ensureDbSchema()

  // 1. Single query: config + working hours + closed dates
  const config = await db.businessConfig.findFirst({
    where: configId ? { id: configId } : undefined,
    include: { workingHours: true, closedDates: true },
  })

  if (!config) {
    // Return 'none' for all days (pure string iteration, no Date objects needed)
    const result: Record<string, SlotResult['availability']> = {}
    let cur = startDate
    const end = endDate
    while (cur <= end) {
      result[cur] = 'none'
      cur = addDays(cur, 1)
    }
    return result
  }

  // Build lookup sets
  const closedDateSet = new Set(config.closedDates.map(cd => cd.date))
  const workingHoursByDay = new Map<number, { openMinutes: number; closeMinutes: number }>()
  for (const wh of config.workingHours) {
    if (wh.closed) continue
    const [oH, oM] = wh.openTime.split(':').map(Number)
    const [cH, cM] = wh.closeTime.split(':').map(Number)
    workingHoursByDay.set(wh.dayOfWeek, { openMinutes: oH * 60 + oM, closeMinutes: cH * 60 + cM })
  }

  // Parse lunch break (shared across all days)
  let lunchStart = -1
  let lunchEnd = -1
  if (config.lunchBreakEnabled && config.lunchBreakStart && config.lunchBreakEnd) {
    const [lsH, lsM] = config.lunchBreakStart.split(':').map(Number)
    const [leH, leM] = config.lunchBreakEnd.split(':').map(Number)
    lunchStart = lsH * 60 + lsM
    lunchEnd = leH * 60 + leM
  }

  // 2. Active resources (single query)
  const resources = await db.resource.findMany({
    where: { configId: config.id, active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true },
  })

  // 3. ALL bookings in the date range (single query with composite index)
  // Use Rome-aware UTC boundaries
  const rangeStart = createInRome(startDate, '00:00')
  const rangeEnd = createInRome(endDate, '23:59')
  const allBookings = await db.booking.findMany({
    where: {
      startTime: { gte: rangeStart, lte: rangeEnd },
      status: { in: ['confirmed', 'pending', 'blocked'] },
      configId: config.id,
    },
    select: { startTime: true, endTime: true, resourceId: true },
  })

  // Group bookings by date string for fast lookup (Rome timezone)
  const bookingsByDate = new Map<string, typeof allBookings>()
  for (const b of allBookings) {
    const dateKey = formatDateRome(new Date(b.startTime))
    const existing = bookingsByDate.get(dateKey)
    if (existing) existing.push(b)
    else bookingsByDate.set(dateKey, [b])
  }

  // Compute availability for each day in range (pure string iteration)
  const STEP = 15
  const result: Record<string, SlotResult['availability']> = {}

  let cur = startDate
  const end = endDate

  while (cur <= end) {
    const dateStr = cur
    const dayOfWeek = getDayOfWeekRome(dateStr)

    // Closed?
    if (closedDateSet.has(dateStr)) {
      result[dateStr] = 'none'
      cur.setDate(cur.getDate() + 1)
      continue
    }

    // Working hours?
    const wh = workingHoursByDay.get(dayOfWeek)
    if (!wh) {
      result[dateStr] = 'none'
      cur.setDate(cur.getDate() + 1)
      continue
    }

    const { openMinutes, closeMinutes } = wh

    // Get bookings for this specific day
    const dayBookings = bookingsByDate.get(dateStr) || []

    // Build per-resource and unassigned ranges
    const resourceRanges = resources.map(r => ({
      id: r.id,
      bookedRanges: [] as { start: number; end: number }[],
    }))
    const unassignedRanges: { start: number; end: number }[] = []

    for (const b of dayBookings) {
      // Extract hours/minutes in Europe/Rome
      const bs = getMinutesFromMidnightRome(new Date(b.startTime))
      const be = getMinutesFromMidnightRome(new Date(b.endTime))
      const range = { start: bs, end: be }

      if (b.resourceId) {
        const res = resourceRanges.find(r => r.id === b.resourceId)
        if (res) res.bookedRanges.push(range)
        else unassignedRanges.push(range)
      } else {
        unassignedRanges.push(range)
      }
    }

    // Count available slots
    let availableCount = 0
    let totalPossible = 0

    for (let t = openMinutes; t + totalDurationMinutes <= closeMinutes; t += STEP) {
      totalPossible++
      const slotEnd = t + totalDurationMinutes

      // Lunch break check
      if (lunchStart >= 0 && lunchEnd >= 0 && t < lunchEnd && slotEnd > lunchStart) {
        continue
      }

      // Check if free on at least one resource
      let hasFree = false
      for (const resource of resourceRanges) {
        let blocked = false
        for (const range of unassignedRanges) {
          if (t < range.end && slotEnd > range.start) { blocked = true; break }
        }
        if (blocked) continue

        let isFree = true
        for (const range of resource.bookedRanges) {
          if (t < range.end && slotEnd > range.start) { isFree = false; break }
        }
        if (isFree) { hasFree = true; break }
      }
      if (hasFree) availableCount++
    }

    // Determine availability level
    totalPossible = Math.max(1, totalPossible)
    const usedRatio = 1 - (availableCount / totalPossible)

    if (availableCount === 0) {
      result[dateStr] = 'none'
    } else if (usedRatio > 0.6) {
      result[dateStr] = 'low'
    } else if (usedRatio > 0.3) {
      result[dateStr] = 'medium'
    } else {
      result[dateStr] = 'high'
    }

    cur = addDays(cur, 1)
  }

  return result
}

/**
 * Check if a specific slot is still available (for real-time validation)
 */
export async function isSlotAvailable(
  dateStr: string,
  time: string,
  totalDurationMinutes: number,
  configId?: string
): Promise<boolean> {
  const { slots } = await getAvailableSlots(dateStr, totalDurationMinutes, configId)
  return slots.includes(time)
}

/**
 * Check if a date is a closed date
 */
export async function isDateClosed(dateStr: string, configId?: string): Promise<boolean> {
  await ensureDbSchema()
  const config = await db.businessConfig.findFirst({
    where: configId ? { id: configId } : undefined,
    include: { closedDates: true },
  })
  if (!config) return false
  return config.closedDates.some(cd => cd.date === dateStr)
}
