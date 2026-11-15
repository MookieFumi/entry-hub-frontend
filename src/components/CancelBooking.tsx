import { useState } from 'react'
import { useCancelBooking, type Booking } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toasts'
import { useT } from '@/i18n'

export function CancelBooking({ booking }: { booking: Booking }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const cancel = useCancelBooking()
  const { notify } = useToast()
  if (booking.status !== 'Confirmed' || new Date(booking.startAt) <= new Date()) return null

  async function confirm() {
    try {
      await cancel.mutateAsync(booking.id)
      notify('success', t('cancel.done'))
      setOpen(false)
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
      </ConfirmDialog>
    </>
  )
}
