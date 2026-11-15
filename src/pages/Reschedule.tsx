import { Link, useParams } from 'react-router'
import { useBooking, useOfficeZone, useRoom } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { RescheduleForm } from '@/components/RescheduleForm'
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { formatOfficeDateTime, formatOfficeTime } from '@/lib/dates'
import { useT } from '@/i18n'

export function Reschedule() {
  const t = useT()
  const { id = '' } = useParams()
  const tz = useOfficeZone()
  const booking = useBooking(id)
  const room = useRoom(booking.data?.roomId ?? '')

  if (booking.isPending) return <Skeleton className="h-40" />
  if (booking.error instanceof ApiError && ['forbidden', 'not-found'].includes(booking.error.kind))
    return (
      <EmptyState
        title={t('reschedule.cannotTitle')}
        action={
          <Link className="text-brand-700 underline" to="/bookings">
            {t('nav.myBookings')}
          </Link>
        }
      >
        {t('reschedule.cannotHint')}
      </EmptyState>
    )
  if (booking.error)
    return <ErrorState message={booking.error.message} onRetry={() => void booking.refetch()} />
  const b = booking.data
  const editable = b.status === 'Confirmed' && new Date(b.startAt) > new Date()

  return (
    <>
      <PageHeader
        title={t('reschedule.title')}
        description={`${b.title} · ${room.data?.name ?? ''}`.replace(/ · $/, '')}
      />
      {!editable ? (
        <EmptyState
          title={t('reschedule.notEditableTitle')}
          action={
            <Link className="text-brand-700 underline" to={`/bookings/${b.id}`}>
              {t('reschedule.backToBooking')}
            </Link>
          }
        >
          {t('reschedule.notEditableHint')}
        </EmptyState>
      ) : (
        <Card className="flex max-w-xl flex-col gap-4">
          <p className="text-sm text-gray-600">
            {t('reschedule.current', {
              range: `${formatOfficeDateTime(b.startAt, tz)} – ${formatOfficeTime(b.endAt, tz)}`,
            })}
          </p>
          <RescheduleForm booking={b} />
        </Card>
      )}
    </>
  )
}
