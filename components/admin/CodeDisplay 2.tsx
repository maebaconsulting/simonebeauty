/**
 * CodeDisplay Component
 * Feature: 018-international-market-segmentation
 *
 * Displays unique codes (client or contractor) with copy-to-clipboard functionality
 * and color-coding based on code type.
 */

'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeDisplayProps {
  code: string;
  type?: 'client' | 'contractor';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * Component to display unique codes with copy functionality
 *
 * @example
 * ```tsx
 * <CodeDisplay code="CLI-000001" type="client" />
 * <CodeDisplay code="CTR-000042" type="contractor" size="lg" />
 * ```
 */
export function CodeDisplay({
  code,
  type,
  size = 'md',
  showIcon = true,
  className,
}: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Auto-detect type from code format if not provided
  const detectedType =
    type || (code.startsWith('CLI-') ? 'client' : 'contractor');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Color classes based on type
  const colorClasses = {
    client:
      'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 focus:ring-blue-500',
    contractor:
      'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 focus:ring-purple-500',
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2 font-mono font-medium rounded-md border transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizeClasses[size],
        colorClasses[detectedType],
        className
      )}
      title={`Copier le code ${detectedType === 'client' ? 'client' : 'prestataire'}`}
      type="button"
    >
      <span>{code}</span>
      {showIcon && (
        <span className="opacity-60">
          {copied ? (
            <Check className={iconSizeClasses[size]} />
          ) : (
            <Copy className={iconSizeClasses[size]} />
          )}
        </span>
      )}
    </button>
  );
}

/**
 * Compact variant for use in tables
 */
export function CodeBadge({
  code,
  type,
  className,
}: {
  code: string;
  type?: 'client' | 'contractor';
  className?: string;
}) {
  return (
    <CodeDisplay
      code={code}
      type={type}
      size="sm"
      showIcon={false}
      className={className}
    />
  );
}

/**
 * Large variant for detail pages
 */
export function CodeHeader({
  code,
  type,
  label,
  className,
}: {
  code: string;
  type?: 'client' | 'contractor';
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
      )}
      <CodeDisplay code={code} type={type} size="lg" />
    </div>
  );
}
