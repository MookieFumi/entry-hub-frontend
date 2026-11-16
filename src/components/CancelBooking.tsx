import { Dialog } from '@base-ui/react/dialog'
import { useState } from 'react'
import { ApiError, ruleMessage } from '@/api/errors'
import {
  useCancelBooking,
  useOfficeZone,
  type Booking,
  type CancelScope,
  type CancelSeriesResponse,
} from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toasts'
import { formatOfficeDateTime } from '@/lib/dates'
import { useT } from '@/i18n'

export function CancelBooking({ booking }: { booking: Booking }) {
  const t = useT()
  const tz = useOfficeZone()
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<CancelScope>('occurrence')
  const [kept, setKept] = useState<CancelSeriesResponse['kept']>([])
  const cancel = useCancelBooking()
  const { notify } = useToast()
  if (
    (booking.status !== 'Confirmed' && booking.status !== 'Pending') ||
    new Date(booking.startAt) <= new Date()
  )
    return null
  const inSeries = Boolean(booking.seriesId)

  async function confirm() {
    try {
      const result = await cancel.mutateAsync({
        id: booking.id,
        scope: inSeries ? scope : 'occurrence',
      })
      setOpen(false)
      if (result) {
        notify('success', t('cancel.seriesDone', { count: result.cancelled.length }))
        if (result.kept.length > 0) setKept(result.kept)
      } else notify('success', t('cancel.done'))
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : t('cancel.failed'))
      setOpen(false)
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t('cancel.button')}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t('cancel.title')}
        confirmLabel={t('cancel.confirm')}
        destructive
        busy={cancel.isPending}
        onConfirm={() => void confirm()}
      >
        <p>{t('cancel.body', { title: booking.title })}</p>
        {inSeries && (
          <fieldset className="mt-3 flex flex-col gap-2">
            <legend className="mb-1 font-medium text-gray-700">{t('cancel.scopeLabel')}</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`scope-${booking.id}`}
                checked={scope === 'occurrence'}
                onChange={() => setScope('occurrence')}
              />
              {t('cancel.scopeOne')}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={`scope-${booking.id}`}
                checked={scope === 'series'}
                onChange={() => setScope('series')}
              />
              {t('cancel.scopeSeries')}
            </label>
          </fieldset>
        )}
      </ConfirmDialog>
      <Dialog.Root open={kept.length > 0} onOpenChange={(o) => !o && setKept([])}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-gray-900/50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {t('cancel.keptTitle')}
            </Dialog.Title>
            <Dialog.Description render={<div />} className="mt-2 text-sm text-gray-600">
              <p>{t('cancel.keptIntro')}</p>
              <ul className="mt-2 list-disc pl-5">
                {kept.map((k) => (
                  <li key={k.bookingId}>
                    {formatOfficeDateTime(k.startAt, tz)} · {ruleMessage(k.violation)}
                  </li>
                ))}
              </ul>
            </Dialog.Description>
            <div className="mt-6 flex justify-end">
              <Dialog.Close render={<Button variant="secondary" />}>
                {t('cancel.close')}
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
