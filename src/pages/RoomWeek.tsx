import { Link, useParams, useSearchParams } from 'react-router'
import { useOfficeZone, useRoom, useRules, useSchedule } from '@/api/queries'
import { DayTimeline } from '@/components/DayTimeline'
import { ScheduleList } from '@/components/ScheduleList'
import { Card, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { dayName } from '@/lib/rules-text'
import { addDays, dateInZone, dayOfWeek, zonedToUtc } from '@/lib/tz'
import { useT } from '@/i18n'

/** Monday of the week of a date. It works on calendar dates, so clock changes do not affect it. */
export function mondayOf(date: string): string {
  let d = date
  while (dayOfWeek(d) !== 'Monday') d = addDays(d, -1)
  return d
}

export function RoomWeek() {
  const t = useT()
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const tz = useOfficeZone()
  const rules = useRules()
  const room = useRoom(id)
  const monday = mondayOf(params.get('date') ?? dateInZone(new Date(), tz))
  const nextMonday = addDays(monday, 7)
  // 7-day window: below the 31-day maximum the API accepts.
  const schedule = useSchedule(
    id,
    zonedToUtc(monday, '00:00', tz).toISOString(),
    zonedToUtc(nextMonday, '00:00', tz).toISOString(),
  )

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) =>
    rules.data ? (rules.data.officeDays as string[]).includes(dayOfWeek(d)) : true,
  )

  return (
    <>
      <PageHeader
        title={t('week.title', { room: room.data?.name ?? t('week.theRoom') })}
        description={t('week.range', { from: monday, to: addDays(monday, 6) })}
        actions={
          <nav aria-label={t('week.nav')} className="flex gap-3 text-sm font-medium text-brand-700">
            <Link to={`/rooms/${id}/week?date=${addDays(monday, -7)}`}>{t('week.previous')}</Link>
            <Link to={`/rooms/${id}/week?date=${nextMonday}`}>{t('week.next')}</Link>
          </nav>
        }
      />
      {(schedule.isPending || rules.isPending) && <Skeleton className="h-64" />}
      {schedule.error && (
        <ErrorState message={schedule.error.message} onRetry={() => void schedule.refetch()} />
      )}
      {schedule.data && rules.data && (
        <div className="flex flex-col gap-6">
          {days.map((day) => {
            const entries = schedule.data.filter((e) => dateInZone(new Date(e.startAt), tz) === day)
            const weekday = dayName(dayOfWeek(day))
            const name = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day}`
            return (
              <Card key={day}>
                <h2 className="mb-3 font-semibold text-gray-900">
                  <Link className="hover:text-brand-700" to={`/rooms/${id}?date=${day}`}>
                    {name}
                  </Link>
                </h2>
                <div className="mb-8">
                  <DayTimeline entries={entries} rules={rules.data} label={name} />
                </div>
                <ScheduleList entries={entries} timeZone={tz} />
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
