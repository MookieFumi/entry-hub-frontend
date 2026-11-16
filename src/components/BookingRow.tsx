import { Link } from 'react-router'
import { useOfficeZone, type Booking } from '@/api/queries'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'
import { DateTile } from '@/components/DateTile'
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
  const confirmed = booking.status === 'Confirmed'
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-gray-200 bg-white p-3 pr-4 transition-[border-color,box-shadow] duration-150 hover:border-brand-300 hover:shadow-sm">
      <DateTile iso={booking.startAt} timeZone={tz} muted={!confirmed} />
      <div className="min-w-0 flex-1 basis-48">
        <Link
          to={`/bookings/${booking.id}`}
          className={`font-semibold hover:text-brand-700 hover:underline focus-visible:underline ${
            confirmed ? 'text-gray-900' : 'text-gray-600'
          }`}
        >
          {booking.title}
        </Link>
        <p className="nums text-sm text-gray-600">
          {formatOfficeDateTime(booking.startAt, tz)} – {formatOfficeTime(booking.endAt, tz)} ·{' '}
          {t('booking.people', { count: booking.attendees })}
          {roomName ? ` · ${roomName}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <BookingStatusBadge status={booking.status} />
        {actions}
      </div>
    </li>
  )
}
