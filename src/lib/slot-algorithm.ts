import { db, ensureDbSchema } from './db'

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
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // 1=Mon ... 7=Sun

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

  // Get ALL bookings for this date (across all resources)
  const dayStart = new Date(dateStr + 'T00:00:00')
  const dayEnd = new Date(dateStr + 'T23:59:59')
  const bookings = await db.booking.findMany({
    where: {
      startTime: { gte: dayStart, lt: dayEnd },
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
    const start = new Date(b.startTime)
    const end = new Date(b.endTime)
    const range = {
      start: start.getHours() * 60 + start.getMinutes(),
      end: end.getHours() * 60 + end.getMinutes(),
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

  // Get all bookings for this date
  const dayStart = new Date(dateStr + 'T00:00:00')
  const dayEnd = new Date(dateStr + 'T23:59:59')
  const bookings = await db.booking.findMany({
    where: {
      startTime: { gte: dayStart, lt: dayEnd },
      status: { in: ['confirmed', 'pending', 'blocked'] },
      configId,
    },
    select: { startTime: true, endTime: true, resourceId: true },
  })

  // Check unassigned bookings (block all resources)
  const unassignedBlocked = bookings
    .filter(b => !b.resourceId)
    .some(b => {
      const bs = b.startTime.getHours() * 60 + b.startTime.getMinutes()
      const be = b.endTime.getHours() * 60 + b.endTime.getMinutes()
      return slotStart < be && slotEnd > bs
    })

  if (unassignedBlocked) return null

  // Find first resource with no overlap
  for (const resource of resources) {
    const hasOverlap = bookings
      .filter(b => b.resourceId === resource.id)
      .some(b => {
        const bs = b.startTime.getHours() * 60 + b.startTime.getMinutes()
        const be = b.endTime.getHours() * 60 + b.endTime.getMinutes()
        return slotStart < be && slotEnd > bs
      })

    if (!hasOverlap) return resource.id
  }

  return null // No resource is free
}

/**
 * Get availability for a range of dates (for calendar color coding)
 */
export async function getDaysAvailability(
  startDate: string,
  endDate: string,
  totalDurationMinutes: number,
  configId?: string
): Promise<SlotResult[]> {
  const results: SlotResult[] = []
  const current = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const result = await getAvailableSlots(dateStr, totalDurationMinutes, configId)
    results.push(result)
    current.setDate(current.getDate() + 1)
  }

  return results
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
