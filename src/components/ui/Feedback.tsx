import type { ReactNode } from 'react'
import { Button } from './Button'

type AlertTone = 'info' | 'error' | 'warning' | 'success'
const alertTones: Record<AlertTone, string> = {
  info: 'border-brand-200 bg-brand-25 text-brand-900',
  error: 'border-error-300 bg-error-50 text-error-700',
  warning: 'border-warning-700/30 bg-warning-50 text-warning-700',
  success: 'border-success-700/30 bg-success-50 text-success-700',
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
      className={`rounded-xl border p-4 text-sm ${alertTones[tone]}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  )
}

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-gray-500">
      <span
        className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600"
        aria-hidden
      />
      {label}…
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
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
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 p-10 text-center">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {children && <p className="max-w-md text-sm text-gray-500">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert tone="error" title="No se pudo cargar">
      <p>{message}</p>
      {onRetry && (
        <div className="mt-3">
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )}
    </Alert>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-xs ${className}`}>
      {children}
    </div>
  )
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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-gray-600">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
