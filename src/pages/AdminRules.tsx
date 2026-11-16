import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/errors'
import { useRules, useUpdateRules, type UpdateRulesRequest } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Alert, Card, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'
import { useT, type MessageKey } from '@/i18n'

type Key = keyof UpdateRulesRequest

const FIELDS: { key: Key; min: number; max: number; hint?: MessageKey }[] = [
  { key: 'minDurationMinutes', min: 1, max: 1440 },
  { key: 'maxDurationMinutes', min: 1, max: 1440 },
  { key: 'slotMinutes', min: 1, max: 60, hint: 'adminRules.slotMinutesHint' },
  { key: 'minLeadTimeMinutes', min: 0, max: 10080 },
  { key: 'maxAdvanceDays', min: 1, max: 730 },
  { key: 'cancellationNoticeMinutes', min: 0, max: 10080 },
  { key: 'maxActiveBookings', min: 1, max: 1000, hint: 'adminRules.maxActiveBookingsHint' },
  { key: 'autoReleaseMinutes', min: 0, max: 240, hint: 'adminRules.autoReleaseHint' },
]

/** Facilities read and change the booking rules of the tenant. They apply to new bookings. */
export function AdminRules() {
  const t = useT()
  const rules = useRules()
  const update = useUpdateRules()
  const { notify } = useToast()
  const [edited, setEdited] = useState<Partial<Record<Key, string>>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  if (rules.isPending) return <Skeleton className="h-40" />
  if (rules.error)
    return <ErrorState message={rules.error.message} onRetry={() => void rules.refetch()} />
  const current = rules.data
  const value = (key: Key) =>
    edited[key] ?? (current[key] === null || current[key] === undefined ? '' : String(current[key]))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next: Record<string, string> = {}
    const body: Partial<Record<Key, number>> = {}
    for (const f of FIELDS) {
      const n = Number(value(f.key))
      if (value(f.key).trim() === '' || !Number.isInteger(n) || n < f.min || n > f.max)
        next[f.key] = t('adminRules.range', { min: f.min, max: f.max })
      else body[f.key] = n
    }
    if (!next.maxDurationMinutes && !next.minDurationMinutes) {
      if (body.maxDurationMinutes! < body.minDurationMinutes!)
        next.maxDurationMinutes = t('adminRules.order')
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return
    try {
      await update.mutateAsync(body as UpdateRulesRequest)
      setEdited({})
      notify('success', t('adminRules.saved'))
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'validation') {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.fieldErrors))
          mapped[k.charAt(0).toLowerCase() + k.slice(1)] = v.join(' ')
        setErrors(mapped)
        setFormError(Object.keys(mapped).length ? null : err.message)
      } else setFormError(err instanceof Error ? err.message : t('adminRules.failed'))
    }
  }

  return (
    <>
      <PageHeader title={t('adminRules.title')} description={t('adminRules.description')} />
      <Card>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          {FIELDS.map((f) => (
            <TextField
              key={f.key}
              label={t(`adminRules.${f.key}` as MessageKey)}
              type="number"
              min={f.min}
              max={f.max}
              value={value(f.key)}
              hint={f.hint ? t(f.hint) : undefined}
              error={errors[f.key]}
              onChange={(e) => setEdited({ ...edited, [f.key]: e.target.value })}
            />
          ))}
          {formError && (
            <div className="sm:col-span-2">
              <Alert tone="error">{formError}</Alert>
            </div>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
