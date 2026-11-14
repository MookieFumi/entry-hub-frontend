import { useState } from 'react'
import { useCancelBooking, type Booking } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toasts'

export function CancelBooking({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false)
  const cancel = useCancelBooking()
  const { notify } = useToast()
  if (booking.status !== 'Confirmed' || new Date(booking.startAt) <= new Date()) return null

  async function confirm() {
    try {
      await cancel.mutateAsync(booking.id)
      notify('success', 'Reserva cancelada.')
      setOpen(false)
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : 'No se pudo cancelar.')
      setOpen(false)
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Cancelar
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="¿Cancelar la reserva?"
        confirmLabel="Cancelar reserva"
        destructive
        busy={cancel.isPending}
        onConfirm={() => void confirm()}
      >
        <p>«{booking.title}» dejará de estar reservada y la franja quedará libre.</p>
      </ConfirmDialog>
    </>
  )
}
