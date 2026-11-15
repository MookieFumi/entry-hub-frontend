import { Link, useParams } from 'react-router'
import { useBooking, useOfficeZone, useRoom } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { RescheduleForm } from '@/components/RescheduleForm'
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { formatOfficeDateTime, formatOfficeTime } from '@/lib/dates'

export function Reschedule() {
  const { id = '' } = useParams()
  const tz = useOfficeZone()
  const booking = useBooking(id)
  const room = useRoom(booking.data?.roomId ?? '')

  if (booking.isPending) return <Skeleton className="h-40" />
  if (booking.error instanceof ApiError && ['forbidden', 'not-found'].includes(booking.error.kind))
    return (
      <EmptyState
        title="No se puede reprogramar esta reserva"
        action={
          <Link className="text-brand-700 underline" to="/bookings">
            Mis reservas
          </Link>
        }
      >
        No existe o no tienes permiso para modificarla.
      </EmptyState>
    )
  if (booking.error)
    return <ErrorState message={booking.error.message} onRetry={() => void booking.refetch()} />
  const b = booking.data
  const editable = b.status === 'Confirmed' && new Date(b.startAt) > new Date()

  return (
    <>
      <PageHeader
        title="Reprogramar reserva"
        description={`${b.title} · ${room.data?.name ?? ''}`.replace(/ · $/, '')}
      />
      {!editable ? (
        <EmptyState
          title="Esta reserva ya no se puede reprogramar"
          action={
            <Link className="text-brand-700 underline" to={`/bookings/${b.id}`}>
              Volver a la reserva
            </Link>
          }
        >
          Solo se pueden reprogramar reservas confirmadas que aún no han empezado.
        </EmptyState>
      ) : (
        <Card className="flex max-w-xl flex-col gap-4">
          <p className="text-sm text-gray-600">
            Ahora: {formatOfficeDateTime(b.startAt, tz)} – {formatOfficeTime(b.endAt, tz)}
          </p>
          <RescheduleForm booking={b} />
        </Card>
      )}
    </>
  )
}
