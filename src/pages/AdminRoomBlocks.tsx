import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '@/api/errors'
import {
  useCreateBlock,
  useDeleteBlock,
  useOfficeZone,
  useRoom,
  useRoomBlocks,
  type RoomBlock,
} from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TextField } from '@/components/ui/Field'
import { Alert, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'
import { formatOfficeDateTime } from '@/lib/dates'
import { zonedToUtc } from '@/lib/tz'
import { useT } from '@/i18n'

/** `yyyy-MM-ddTHH:mm` from a datetime-local input, read in the office time zone. */
function toUtc(value: string, timeZone: string) {
  const [date = '', time = '00:00'] = value.split('T')
  return zonedToUtc(date, time, timeZone)
}

/** Facilities block a room for a time range (cleaning, repairs) and lift the blocks. */
export function AdminRoomBlocks() {
  const t = useT()
  const tz = useOfficeZone()
  const { notify } = useToast()
  const { id = '' } = useParams()
  const room = useRoom(id)
  const blocks = useRoomBlocks(id)
  const create = useCreateBlock(id)
  const remove = useDeleteBlock(id)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [conflict, setConflict] = useState<string[] | null>(null)
  const [lifting, setLifting] = useState<RoomBlock | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setConflict(null)
    const next: Record<string, string> = {}
    if (!start) next.startAt = t('blocks.startRequired')
    if (!end) next.endAt = t('blocks.endRequired')
    if (start && end && toUtc(end, tz) <= toUtc(start, tz)) next.endAt = t('blocks.endAfterStart')
    if (reason.length > 200) next.reason = t('blocks.reasonTooLong')
    setErrors(next)
    if (Object.keys(next).length > 0) return
    try {
      await create.mutateAsync({
        startAt: toUtc(start, tz).toISOString(),
        endAt: toUtc(end, tz).toISOString(),
        reason: reason.trim() || null,
      })
      notify('success', t('blocks.added'))
      setStart('')
      setEnd('')
      setReason('')
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'conflict') setConflict(err.bookingIds)
      else if (err instanceof ApiError && err.kind === 'validation') {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.fieldErrors))
          mapped[k.charAt(0).toLowerCase() + k.slice(1)] = v.join(' ')
        setErrors(Object.keys(mapped).length ? mapped : { endAt: err.message })
      } else notify('error', err instanceof Error ? err.message : t('common.unexpected'))
    }
  }

  async function lift(block: RoomBlock) {
    try {
      await remove.mutateAsync(block.id)
      notify('success', t('blocks.lifted'))
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : t('blocks.liftFailed'))
    }
    setLifting(null)
  }

  const missing = (room.error instanceof ApiError && room.error.kind === 'not-found') || false
  if (missing) return <EmptyState title={t('blocks.roomNotFound')} />

  return (
    <>
      <PageHeader
        title={t('blocks.title', { room: room.data?.name ?? '…' })}
        description={t('blocks.description')}
      />
      <p className="mb-4 text-sm">
        <Link to="/admin/rooms" className="text-brand-700 underline">
          {t('blocks.back')}
        </Link>
      </p>
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <TextField
              label={t('blocks.start')}
              type="datetime-local"
              value={start}
              error={errors.startAt}
              onChange={(e) => setStart(e.target.value)}
            />
            <TextField
              label={t('blocks.end')}
              type="datetime-local"
              value={end}
              error={errors.endAt}
              onChange={(e) => setEnd(e.target.value)}
            />
            <TextField
              label={t('blocks.reason')}
              value={reason}
              maxLength={200}
              error={errors.reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {conflict && (
              <Alert tone="error">
                <p>{t('blocks.conflict')}</p>
                {conflict.length > 0 && (
                  <ul className="mt-2 list-disc pl-5">
                    {conflict.map((b) => (
                      <li key={b}>
                        <Link to={`/bookings/${b}`} className="underline">
                          {t('blocks.conflictBooking', { id: b.slice(0, 8) })}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Alert>
            )}
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t('blocks.adding') : t('blocks.add')}
            </Button>
          </form>
        </Card>
        <div>
          {blocks.isPending && <Skeleton className="h-40" />}
          {blocks.error && (
            <ErrorState message={blocks.error.message} onRetry={() => void blocks.refetch()} />
          )}
          {blocks.data && blocks.data.length === 0 && (
            <EmptyState title={t('blocks.noneTitle')}>{t('blocks.noneHint')}</EmptyState>
          )}
          {blocks.data && blocks.data.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      {t('blocks.colRange')}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {t('blocks.colReason')}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">{t('admin.rooms.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...blocks.data]
                    .sort((a, b) => a.startAt.localeCompare(b.startAt))
                    .map((b) => (
                      <tr key={b.id} className="border-t border-gray-200">
                        <th scope="row" className="px-4 py-3 font-medium text-gray-900">
                          {formatOfficeDateTime(b.startAt, tz)} –{' '}
                          {formatOfficeDateTime(b.endAt, tz)}
                        </th>
                        <td className="px-4 py-3">{b.reason || t('blocks.noReason')}</td>
                        <td className="flex justify-end px-4 py-3">
                          <Button variant="secondary" onClick={() => setLifting(b)}>
                            {t('blocks.lift')}
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
        open={lifting !== null}
        onOpenChange={(o) => !o && setLifting(null)}
        title={t('blocks.liftTitle')}
        confirmLabel={t('blocks.lift')}
        busy={remove.isPending}
        onConfirm={() => lifting && void lift(lifting)}
      >
        <p>{t('blocks.liftBody')}</p>
      </ConfirmDialog>
    </>
  )
}
