import type { ReactNode } from 'react'

type Tone = 'gray' | 'success' | 'warning' | 'error' | 'brand'

const tones: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  brand: 'bg-brand-50 text-brand-700',
}

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
