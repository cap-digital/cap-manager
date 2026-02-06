'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { maskDateInput, isValidDateString, formatDateInput, parseDateInput } from '@/lib/utils'

interface DateInputProps {
  value: string // yyyy-mm-dd or empty
  onChange: (value: string) => void // emits yyyy-mm-dd or empty
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateInput({ value, onChange, placeholder = 'dd/mm/aaaa', className, disabled }: DateInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() => formatDateInput(value))

  // Sync display when external value changes (e.g. form reset, edit load)
  React.useEffect(() => {
    const formatted = formatDateInput(value)
    setDisplayValue(prev => {
      // Only update if the resolved date changed (avoid overwriting partial input)
      if (isValidDateString(prev) && parseDateInput(prev) === value) return prev
      if (!value && !prev) return prev
      return formatted
    })
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDateInput(e.target.value)
    setDisplayValue(masked)

    if (isValidDateString(masked)) {
      onChange(parseDateInput(masked))
    } else if (masked === '') {
      onChange('')
    }
  }

  const handleBlur = () => {
    if (displayValue && !isValidDateString(displayValue)) {
      setDisplayValue('')
      onChange('')
    }
  }

  return (
    <Input
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      disabled={disabled}
      maxLength={10}
    />
  )
}
