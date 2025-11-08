'use client'

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'
import { Input } from '@/components/ui/input'

interface VerificationCodeInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
}

export function VerificationCodeInput({
  length = 6,
  onComplete,
  disabled = false,
}: VerificationCodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value

    setCode(newCode)

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if complete
    if (newCode.every((digit) => digit !== '')) {
      onComplete(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').trim()

    // Only process if it's a valid code (all digits, correct length)
    if (!/^\d+$/.test(pastedData) || pastedData.length !== length) return

    const newCode = pastedData.split('')
    setCode(newCode)

    // Focus last input
    inputRefs.current[length - 1]?.focus()

    // Trigger completion
    onComplete(pastedData)
  }

  return (
    <div className="flex gap-2 justify-center">
      {code.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-2xl font-mono"
          autoFocus={index === 0}
        />
      ))}
    </div>
  )
}
