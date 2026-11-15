import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/errors'
import {
  useCreateHoliday,
  useDeleteHoliday,
  useSiteHolidays,
  useSites,
  type SiteHoliday,
} from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SelectField, TextField } from '@/components/ui/Field'
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'
import { useT } from '@/i18n'

/** Facilities manage the days a site is closed; bookings on those days are refused by the API. */
export function AdminClosedDays() {
  const t = useT()
  const { notify } = useToast()
  const sites = useSites(false)
  const [chosen, setChosen] = useState('')
  const siteId = chosen || sites.data?.[0]?.id || ''
  const holidays = useSiteHolidays(siteId || undefined)
  const create = useCreateHoliday(siteId)
  const remove = useDeleteHoliday(siteId)
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [reopening, setReopening] = useState<SiteHoliday | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!date) next.date = t('closed.dateRequired')
    if (name.length > 100) next.name = t('closed.nameTooLong')
    setErrors(next)
    if (Object.keys(next).length > 0) return
    try {
      await create.mutateAsync({ date, name: name.trim() || null })
      notify('success', t('closed.added'))
      setDate('')
      setName('')
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'conflict') {
        setErrors({ date: t('closed.duplicate') })
      } else if (err instanceof ApiError && err.kind === 'validation') {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.fieldErrors))
          mapped[k.charAt(0).toLowerCase() + k.slice(1)] = v.join(' ')
        setErrors(Object.keys(mapped).length ? mapped : { date: err.message })
      } else {
        notify('error', err instanceof Error ? err.message : t('common.unexpected'))
      }
    }
  }

  async function reopen(holiday: SiteHoliday) {
    try {
      await remove.mutateAsync(holiday.id)
      notify('success', t('closed.removed'))
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : t('closed.removeFailed'))
    }
    setReopening(null)
  }

  if (sites.isPending) return <Skeleton className="h-40" />
  if (sites.error)
    return <ErrorState message={sites.error.message} onRetry={() => void sites.refetch()} />
  if (sites.data.length === 0) return <EmptyState title={t('closed.noSites')} />

  const sorted = [...(holidays.data ?? [])].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <PageHeader title={t('closed.title')} description={t('closed.description')} />
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <SelectField
              label={t('closed.site')}
              value={siteId}
              onChange={(e) => setChosen(e.target.value)}
            >
              {sites.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
            <TextField
              label={t('closed.date')}
              type="date"
              value={date}
              error={errors.date}
              onChange={(e) => setDate(e.target.value)}
            />
            <TextField
              label={t('closed.name')}
              value={name}
              maxLength={100}
              error={errors.name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t('closed.adding') : t('closed.add')}
            </Button>
          </form>
        </Card>
        <div>
          {holidays.isPending && <Skeleton className="h-40" />}
          {holidays.error && (
            <ErrorState message={holidays.error.message} onRetry={() => void holidays.refetch()} />
          )}
          {holidays.data && sorted.length === 0 && (
            <EmptyState title={t('closed.noneTitle')}>{t('closed.noneHint')}</EmptyState>
          )}
          {sorted.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      {t('closed.colDate')}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t('closed.colName')}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">{t('closed.colActions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((h) => (
                    <tr key={h.id} className="border-t border-gray-200">
                      <th scope="row" className="px-4 py-3 font-medium text-gray-900">
                        {h.date}
                      </th>
                      <td className="px-4 py-3">{h.name || t('closed.unnamed')}</td>
                      <td className="flex justify-end px-4 py-3">
                        <Button variant="secondary" onClick={() => setReopening(h)}>
                          {t('closed.reopen')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={reopening !== null}
        onOpenChange={(o) => !o && setReopening(null)}
        title={t('closed.reopenTitle', { date: reopening?.date ?? '' })}
        confirmLabel={t('closed.reopen')}
        busy={remove.isPending}
        onConfirm={() => reopening && void reopen(reopening)}
      >
        <p>{t('closed.reopenBody')}</p>
      </ConfirmDialog>
    </>
  )
}
