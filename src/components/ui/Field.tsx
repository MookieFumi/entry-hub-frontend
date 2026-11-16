import { useId, type ComponentProps, type ReactNode } from 'react'

const control =
  'block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-xs ' +
  'placeholder:text-gray-400 focus-visible:border-brand-300 focus-visible:outline-2 focus-visible:outline-brand-600 ' +
  'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 aria-[invalid=true]:border-error-300'

type FieldShellProps = {
  label: string
  hint?: string
  error?: string
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
}

/** Label, hint and error tied to the control through `aria-describedby`. */
function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-error-700">
          {error}
        </p>
      )}
    </div>
  )
}

type CommonProps = { label: string; hint?: string; error?: string }

export function TextField({
  label,
  hint,
  error,
  className = '',
  ...props
}: CommonProps & Omit<ComponentProps<'input'>, 'id'>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={`${control} ${className}`}
          {...props}
        />
      )}
    </FieldShell>
  )
}

export function SelectField({
  label,
  hint,
  error,
  children,
  className = '',
  ...props
}: CommonProps & Omit<ComponentProps<'select'>, 'id'>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={`${control} ${className}`}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldShell>
  )
}

export function TextAreaField({
  label,
  hint,
  error,
  className = '',
  ...props
}: CommonProps & Omit<ComponentProps<'textarea'>, 'id'>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={`${control} ${className}`}
          {...props}
        />
      )}
    </FieldShell>
  )
}
