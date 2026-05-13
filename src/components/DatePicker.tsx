'use client'

import { cn, formatDateShort, formatDayName } from '@/lib/utils'

interface DatePickerProps {
  selectedDate: Date | null
  onSelect: (date: Date) => void
  days: Date[]
}

export function DatePicker({ selectedDate, onSelect, days }: DatePickerProps) {
  const isSameDay = (a: Date | null, b: Date) => {
    if (!a) return false
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    )
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const isSelected = isSameDay(selectedDate, day)
        const dayName = formatDayName(day).charAt(0).toUpperCase() + formatDayName(day).slice(1, 3)
        const dayNum = day.getDate()
        const monthDay = formatDateShort(day)

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelect(day)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all duration-200',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-secondary'
            )}
          >
            <span className={cn(
              'text-[10px] font-medium uppercase',
              isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {dayName}
            </span>
            <span className={cn('text-lg font-semibold leading-none')}>
              {dayNum}
            </span>
            <span className={cn(
              'text-[10px]',
              isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {monthDay.split(' ')[1]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
