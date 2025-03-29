'use client'

import { useState } from 'react'

interface ChipOption {
  label: string
  value: string
}

interface ChipSelectProps {
  label: string
  options: ChipOption[]
  value: string
  onChange: (value: string) => void
}

export function ChipSelect({ label, options, value, onChange }: ChipSelectProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-text">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              value === option.value
                ? 'bg-primary text-white'
                : 'bg-background hover:bg-card text-textMuted border border-border'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
} 