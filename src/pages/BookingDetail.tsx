import { Link, useParams } from 'react-router'
import { useBooking, useOfficeZone, useRoom } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { CancelBooking } from '@/components/CancelBooking'
import { Badge } from '@/components/ui/Badge'
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { formatOfficeDateTime, formatOfficeTime } from '@/lib/dates'

function RescheduleLink({ booking }: { booking: { id: string; status: string; startAt: string } }) {
  if (booking.status !== 'Confirmed' || new Date(booking.startAt) <= new Date()) return null
  return (
    <Link
      to={`/bookings/${booking.id}/reschedule`}
      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
    >
      Reprogramar
    </Link>
  )
}

export function BookingDetail() {
  const { id = '' } = useParams()
  const tz = useOfficeZone()
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
      <PageHeader
        title={b.title}
        actions={
          <div className="flex gap-2">
            <RescheduleLink booking={b} />
            <CancelBooking booking={b} />
          </div>
        }
      />
      <Card className="flex flex-col gap-3 text-sm">
        <Badge tone={b.status === 'Confirmed' ? 'success' : 'gray'}>
          {b.status === 'Confirmed' ? 'Confirmada' : 'Cancelada'}
        </Badge>
        <p>
          <span className="font-medium">Cuándo:</span> {formatOfficeDateTime(b.startAt, tz)} –{' '}
          {formatOfficeTime(b.endAt, tz)}
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
        {b.rescheduledAt && (
          <p>
            <span className="font-medium">Reprogramada:</span>{' '}
            {formatOfficeDateTime(b.rescheduledAt, tz)}
          </p>
        )}
        {b.cancelledAt && (
          <p>
            <span className="font-medium">Cancelada:</span>{' '}
            {formatOfficeDateTime(b.cancelledAt, tz)}
          </p>
        )}
      </Card>
    </>
  )
}
