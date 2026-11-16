import { Link, useLocation, useParams } from 'react-router'
import { useBooking, useOfficeZone, useRoom, useRules } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { SeriesSummary } from '@/components/SeriesSummary'
import type { components } from '@/api/schema'
import { CheckInBooking } from '@/components/CheckInBooking'
import { DecideBooking } from '@/components/DecideBooking'
import { CancelBooking } from '@/components/CancelBooking'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { formatOfficeDateTime, formatOfficeTime } from '@/lib/dates'
import { useT } from '@/i18n'

function RescheduleLink({
  booking,
}: {
  booking: { id: string; status: unknown; startAt: string }
}) {
  const t = useT()
  if (booking.status !== 'Confirmed' || new Date(booking.startAt) <= new Date()) return null
  return (
    <Link
      to={`/bookings/${booking.id}/reschedule`}
      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
    >
      {t('booking.reschedule')}
    </Link>
  )
}

type SeriesOutcome = components['schemas']['SeriesOutcome']

export function BookingDetail() {
  const t = useT()
  const { id = '' } = useParams()
  const tz = useOfficeZone()
  const booking = useBooking(id)
  const room = useRoom(booking.data?.roomId ?? '')
  const rules = useRules()
  const series = (useLocation().state as { series?: SeriesOutcome | null } | null)?.series

  if (booking.isPending) return <Skeleton className="h-40" />
  if (booking.error instanceof ApiError && booking.error.kind === 'forbidden') {
    return <EmptyState title={t('booking.forbiddenTitle')}>{t('booking.forbiddenHint')}</EmptyState>
  }
  if (booking.error instanceof ApiError && booking.error.kind === 'not-found') {
    return (
      <EmptyState
        title={t('booking.notFound')}
        action={
          <Link className="text-brand-700 underline" to="/bookings">
            {t('nav.myBookings')}
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
            <CheckInBooking booking={b} />
            <DecideBooking booking={b} />
            <RescheduleLink booking={b} />
            <CancelBooking booking={b} />
          </div>
        }
      />
      {series && (
        <div className="mb-4">
          <SeriesSummary series={series} />
        </div>
      )}
      <Card className="flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2">
          <BookingStatusBadge status={b.status} />
          {b.status === 'Pending' && (
            <span className="text-gray-600">{t('booking.pendingHint')}</span>
          )}
        </div>
        <p>
          <span className="font-medium">{t('booking.when')}</span>{' '}
          {formatOfficeDateTime(b.startAt, tz)} – {formatOfficeTime(b.endAt, tz)}
        </p>
        <p>
          <span className="font-medium">{t('booking.room')}</span>{' '}
          <Link to={`/rooms/${b.roomId}`} className="text-brand-700 underline">
            {room.data?.name ?? t('booking.viewRoom')}
          </Link>
        </p>
        <p>
          <span className="font-medium">{t('booking.attendees')}</span> {b.attendees}
        </p>
        {b.rescheduledAt && (
          <p>
            <span className="font-medium">{t('booking.rescheduled')}</span>{' '}
            {formatOfficeDateTime(b.rescheduledAt, tz)}
          </p>
        )}
        {b.seriesId && (
          <p>
            {t('series.position', { position: Number(b.seriesPosition ?? 1) })}{' '}
            <Link to={`/bookings?series=${b.seriesId}`} className="text-brand-700 underline">
              {t('series.viewAll')}
            </Link>
          </p>
        )}
        {b.checkedInAt && (
          <p>
            <span className="font-medium">{t('checkIn.at')}</span>{' '}
            {formatOfficeDateTime(b.checkedInAt, tz)}
          </p>
        )}
        {b.status === 'Confirmed' &&
          !b.checkedInAt &&
          Number(rules.data?.autoReleaseMinutes) > 0 && (
            <p className="text-gray-600">
              {t('checkIn.hint')}{' '}
              {t('checkIn.autoRelease', { minutes: Number(rules.data?.autoReleaseMinutes) })}
            </p>
          )}
        {b.decidedAt && (
          <p>
            <span className="font-medium">{t('booking.decidedAt')}</span>{' '}
            {formatOfficeDateTime(b.decidedAt, tz)}
            {b.decidedBy ? ` · ${t('booking.decidedBy')} ${b.decidedBy}` : ''}
          </p>
        )}
        {b.decisionReason && (
          <p>
            <span className="font-medium">{t('booking.decisionReason')}</span> {b.decisionReason}
          </p>
        )}
        {b.cancelledAt && (
          <p>
            <span className="font-medium">{t('booking.cancelledAt')}</span>{' '}
            {formatOfficeDateTime(b.cancelledAt, tz)}
          </p>
        )}
      </Card>
    </>
  )
}
