import { Link } from 'react-router'
import { useOfficeZone, type Booking } from '@/api/queries'
import { Badge } from '@/components/ui/Badge'
import { formatOfficeDateTime, formatOfficeTime } from '@/lib/dates'
import { useT } from '@/i18n'

export function BookingRow({
  booking,
  roomName,
  actions,
}: {
  booking: Booking
  roomName?: string
  actions?: React.ReactNode
}) {
  const t = useT()
  const tz = useOfficeZone()
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
      <div className="min-w-0">
        <Link
          to={`/bookings/${booking.id}`}
          className="font-semibold text-gray-900 hover:text-brand-700"
        >
          {booking.title}
        </Link>
        <p className="text-sm text-gray-600">
          {formatOfficeDateTime(booking.startAt, tz)} – {formatOfficeTime(booking.endAt, tz)} ·{' '}
          {t('booking.people', { count: booking.attendees })}
          {roomName ? ` · ${roomName}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={booking.status === 'Confirmed' ? 'success' : 'gray'}>
          {booking.status === 'Confirmed'
            ? t('booking.statusConfirmed')
            : t('booking.statusCancelled')}
        </Badge>
        {actions}
      </div>
    </li>
  )
}
