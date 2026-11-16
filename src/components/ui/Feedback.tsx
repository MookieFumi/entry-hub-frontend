import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import { Button } from './Button'

type AlertTone = 'info' | 'error' | 'warning' | 'success'
const alertTones: Record<AlertTone, { box: string; dot: string }> = {
  info: { box: 'border-brand-200 bg-brand-50 text-brand-900', dot: 'bg-brand-500' },
  error: { box: 'border-error-300 bg-error-50 text-error-700', dot: 'bg-error-500' },
  warning: { box: 'border-warning-500/40 bg-warning-50 text-warning-700', dot: 'bg-warning-500' },
  success: { box: 'border-success-500/40 bg-success-50 text-success-700', dot: 'bg-success-500' },
}

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: AlertTone
  title?: string
  children?: ReactNode
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl border p-4 text-sm ${alertTones[tone].box}`}
    >
      <span
        aria-hidden="true"
        className={`mt-1 size-2.5 shrink-0 rounded-full ${alertTones[tone].dot}`}
      />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
      </div>
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  const t = useT()
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-gray-600">
      <span
        className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600"
        aria-hidden
      />
      {label ?? t('common.loadingLabel')}…
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

/** An empty planner: a few ruled cells with nothing stuck on them yet. */
function EmptyPlanner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 88 40" className="h-10 w-22 text-gray-300">
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="86" height="38" rx="5" />
        <path d="M18.2 1v38M35.4 1v38M52.6 1v38M69.8 1v38M1 13h86" />
      </g>
      <circle cx="44" cy="26" r="4.5" className="fill-mine-400" />
    </svg>
  )
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center">
      <EmptyPlanner />
      <h3 className="mt-2 text-base font-semibold text-gray-900">{title}</h3>
      {children && <p className="max-w-md text-sm text-gray-600">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT()
  return (
    <Alert tone="error" title={t('common.loadFailed')}>
      <p>{t('common.loadFailedHint')}</p>
      <p className="mt-1 text-sm opacity-85">{t('common.serverDetail', { detail: message })}</p>
      {onRetry && (
        <div className="mt-3">
          <Button variant="secondary" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </div>
      )}
    </Alert>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}>{children}</div>
  )
}

/** Heading of a block inside a page. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display mb-4 text-lg text-gray-900">{children}</h2>
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="font-display text-3xl leading-tight text-gray-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-[65ch] text-gray-600">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
