import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useOfficeZone, useRoom, useRules, useSchedule } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { BookingForm } from '@/components/BookingForm'
import { DayTimeline } from '@/components/DayTimeline'
import { ScheduleList } from '@/components/ScheduleList'
import { Badge } from '@/components/ui/Badge'
import {
  Alert,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionTitle,
  Skeleton,
} from '@/components/ui/Feedback'
import { useRoomOccupancy } from '@/hooks/useRoomOccupancy'
import { formatOfficeTime } from '@/lib/dates'
import { addDays, dateInZone, zonedToUtc } from '@/lib/tz'
import { useT } from '@/i18n'

function Occupancy({ roomId }: { roomId: string }) {
  const t = useT()
  const tz = useOfficeZone()
  const { occupancy, connected } = useRoomOccupancy(roomId)
  if (!occupancy)
    return <Badge>{connected ? t('room.occupancyNoData') : t('room.occupancyConnecting')}</Badge>
  const until = occupancy.nextChange
    ? t('room.until', { time: formatOfficeTime(occupancy.nextChange, tz) })
    : ''
  return occupancy.status === 'Free' ? (
    <Badge tone="success">{t('room.freeNow', { until })}</Badge>
  ) : (
    <Badge tone="error">{t('room.busyNow', { until })}</Badge>
  )
}

export function RoomDetail() {
  const t = useT()
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const room = useRoom(id)
  const rules = useRules()
  const tz = useOfficeZone()
  const [date, setDate] = useState(params.get('date') ?? dateInZone(new Date(), tz))
  const from = zonedToUtc(date, '00:00', tz).toISOString()
  const to = zonedToUtc(addDays(date, 1), '00:00', tz).toISOString()
  const schedule = useSchedule(id, from, to)

  if (room.isPending) return <Skeleton className="h-40" />
  if (room.error instanceof ApiError && room.error.kind === 'not-found') {
    return (
      <EmptyState
        title={t('room.notFound')}
        action={
          <Link className="font-semibold text-brand-700 underline hover:text-brand-900" to="/rooms">
            {t('room.backToRooms')}
          </Link>
        }
      >
        {t('room.notFoundHint')}
      </EmptyState>
    )
  }
  if (room.error)
    return (
      <>
        <PageHeader title={t('nav.rooms')} />
        <ErrorState message={room.error.message} onRetry={() => void room.refetch()} />
      </>
    )
  const r = room.data

  return (
    <>
      <PageHeader
        title={r.name}
        description={t('room.summary', { floor: r.floor, capacity: r.capacity })}
        actions={<Occupancy roomId={id} />}
      />
      {!r.isActive && (
        <div className="mb-4">
          <Alert tone="warning">{t('room.inactive')}</Alert>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <SectionTitle>{t('room.book')}</SectionTitle>
          {r.isActive ? (
            <BookingForm
              room={r}
              date={date}
              onDateChange={setDate}
              busy={schedule.data ?? []}
              initialStart={params.get('start') ?? ''}
              initialEnd={params.get('end') ?? ''}
              onConflict={() => void schedule.refetch()}
            />
          ) : (
            <p className="text-sm text-gray-600">{t('room.unavailable')}</p>
          )}
        </Card>
        <Card>
          <SectionTitle>{t('room.daySchedule')}</SectionTitle>
          {schedule.isPending && <Skeleton className="h-24" />}
          {schedule.error && (
            <ErrorState message={schedule.error.message} onRetry={() => void schedule.refetch()} />
          )}
          {schedule.data && rules.data && (
            <div className="mb-4">
              <DayTimeline
                entries={schedule.data}
                rules={rules.data}
                label={t('room.daySchedule')}
              />
            </div>
          )}
          {schedule.data && <ScheduleList entries={schedule.data} timeZone={tz} />}
          <Link
            className="mt-4 inline-block text-sm font-semibold text-brand-700 underline hover:text-brand-900"
            to={`/rooms/${id}/week?date=${date}`}
          >
            {t('room.viewWeek')}
          </Link>
        </Card>
      </div>
    </>
  )
}
