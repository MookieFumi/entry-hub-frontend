import { Dialog } from '@base-ui/react/dialog'
import { useState } from 'react'
import { ApiError } from '@/api/errors'
import { useApproveBooking, useMe, useRejectBooking, type Booking } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { TextAreaField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toasts'
import { useT } from '@/i18n'

const MAX_REASON = 500

/** Approve or reject a pending booking. Only shown to Facilities. */
export function DecideBooking({ booking }: { booking: Booking }) {
  const t = useT()
  const me = useMe()
  const approve = useApproveBooking()
  const reject = useRejectBooking()
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  if (me.data?.role !== 'Facilities' || booking.status !== 'Pending') return null

  const tooLong = reason.length > MAX_REASON
  const failure = (err: unknown) =>
    err instanceof ApiError
      ? err.kind === 'conflict'
        ? t('decide.alreadyDecided')
        : err.message
      : t('decide.failed')

  async function onApprove() {
    try {
      await approve.mutateAsync(booking.id)
      notify('success', t('decide.approved'))
    } catch (err) {
      notify('error', failure(err))
    }
  }

  async function onReject() {
    if (tooLong) return
    try {
      await reject.mutateAsync({ id: booking.id, reason: reason.trim() || null })
      notify('success', t('decide.rejected'))
      setOpen(false)
      setReason('')
    } catch (err) {
      notify('error', failure(err))
      setOpen(false)
    }
  }

  return (
    <>
      <Button disabled={approve.isPending} onClick={() => void onApprove()}>
        {t('decide.approve')}
      </Button>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t('decide.reject')}
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-gray-900/50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {t('decide.rejectTitle')}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              {t('decide.rejectIntro')}
            </Dialog.Description>
            <div className="mt-4">
              <TextAreaField
                label={t('decide.reason')}
                hint={t('decide.reasonHint')}
                error={tooLong ? t('decide.reasonHint') : undefined}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close render={<Button variant="secondary" />}>
                {t('common.back')}
              </Dialog.Close>
              <Button
                variant="destructive"
                disabled={reject.isPending || tooLong}
                onClick={() => void onReject()}
              >
                {reject.isPending ? t('common.processing') : t('decide.reject')}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
