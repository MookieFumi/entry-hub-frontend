import type { ReactNode } from 'react'

type Tone = 'gray' | 'success' | 'warning' | 'error' | 'brand' | 'mine'

/** A sticker: a coloured dot that carries the state, on a tinted label. */
const tones: Record<Tone, { label: string; dot: string }> = {
  gray: { label: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  success: { label: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
  warning: { label: 'bg-warning-50 text-warning-700', dot: 'bg-warning-500' },
  error: { label: 'bg-error-50 text-error-700', dot: 'bg-error-500' },
  brand: { label: 'bg-brand-50 text-brand-800', dot: 'bg-brand-500' },
  mine: { label: 'bg-mine-400 text-brand-950', dot: 'bg-brand-950' },
}

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2 text-xs font-semibold whitespace-nowrap ${tones[tone].label}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${tones[tone].dot}`} />
      {children}
    </span>
  )
}
