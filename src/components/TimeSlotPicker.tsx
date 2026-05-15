'use client'

import { cn } from '@/lib/utils'

interface TimeSlotPickerProps {
  slots: string[]
  selectedTime: string | null
  onSelect: (time: string) => void
}

export function TimeSlotPicker({ slots, selectedTime, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot
        return (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className={cn(
              'py-3 px-4 rounded-full text-sm font-medium transition-all duration-200',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {slot}
          </button>
        )
      })}
    </div>
  )
}
