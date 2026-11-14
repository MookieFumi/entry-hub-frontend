import { Link, useParams } from 'react-router'
import { useBooking, useRoom } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { CancelBooking } from '@/components/CancelBooking'
import { Badge } from '@/components/ui/Badge'
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { formatOfficeDateTime, formatOfficeTime } from '@/lib/dates'

export function BookingDetail() {
  const { id = '' } = useParams()
  const booking = useBooking(id)
  const room = useRoom(booking.data?.roomId ?? '')

  if (booking.isPending) return <Skeleton className="h-40" />
  if (booking.error instanceof ApiError && booking.error.kind === 'forbidden') {
    return (
      <EmptyState title="No puedes ver esta reserva">
        Solo la persona que la hizo y el equipo de Facilities pueden verla.
      </EmptyState>
    )
  }
  if (booking.error instanceof ApiError && booking.error.kind === 'not-found') {
    return (
      <EmptyState
        title="Reserva no encontrada"
        action={
          <Link className="text-brand-700 underline" to="/bookings">
            Mis reservas
          </Link>
        }
      />
    )
  }
  if (booking.error)
    return <ErrorState message={booking.error.message} onRetry={() => void booking.refetch()} />
  const b = booking.data

  return (
    <>
      <PageHeader title={b.title} actions={<CancelBooking booking={b} />} />
      <Card className="flex flex-col gap-3 text-sm">
        <Badge tone={b.status === 'Confirmed' ? 'success' : 'gray'}>
          {b.status === 'Confirmed' ? 'Confirmada' : 'Cancelada'}
        </Badge>
        <p>
          <span className="font-medium">Cuándo:</span> {formatOfficeDateTime(b.startAt)} –{' '}
          {formatOfficeTime(b.endAt)}
        </p>
        <p>
          <span className="font-medium">Sala:</span>{' '}
          <Link to={`/rooms/${b.roomId}`} className="text-brand-700 underline">
            {room.data?.name ?? 'Ver sala'}
          </Link>
        </p>
        <p>
          <span className="font-medium">Asistentes:</span> {b.attendees}
        </p>
        {b.cancelledAt && (
          <p>
            <span className="font-medium">Cancelada:</span> {formatOfficeDateTime(b.cancelledAt)}
          </p>
        )}
      </Card>
    </>
  )
}
