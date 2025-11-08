/**
 * Shared ErrorMessage component
 * Task: T010
 * Displays validation errors with consistent styling
 */

import { cn } from '@/lib/utils'
import { AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ErrorType = 'error' | 'warning' | 'info'

interface ErrorMessageProps {
  message: string
  type?: ErrorType
  className?: string
}

export function ErrorMessage({
  message,
  type = 'error',
  className
}: ErrorMessageProps) {
  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const styles = {
    error: 'text-destructive',
    warning: 'text-orange-600',
    info: 'text-blue-600'
  }

  const Icon = icons[type]

  return (
    <div className={cn('flex items-start gap-2 text-sm', styles[type], className)}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}
