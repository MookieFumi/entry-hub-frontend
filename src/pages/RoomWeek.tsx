import { Link, useParams, useSearchParams } from 'react-router'
import { useOfficeZone, useRoom, useRules, useSchedule } from '@/api/queries'
import { DateTile } from '@/components/DateTile'
import { DayTimeline, HourRuler } from '@/components/DayTimeline'
import { buttonClass } from '@/components/ui/Button'
import { ScheduleList } from '@/components/ScheduleList'
import { ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { dayName } from '@/lib/rules-text'
import { addDays, dateInZone, dayOfWeek, zonedToUtc } from '@/lib/tz'
import { formatLocale, useT } from '@/i18n'

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

  const short = (day: string) =>
    new Intl.DateTimeFormat(formatLocale(), {
      day: 'numeric',
      month: 'short',
      timeZone: tz,
    }).format(zonedToUtc(day, '12:00', tz))
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) =>
    rules.data ? (rules.data.officeDays as string[]).includes(dayOfWeek(d)) : true,
  )

  return (
    <>
      <PageHeader
        title={t('week.title', { room: room.data?.name ?? t('week.theRoom') })}
        description={t('week.range', { from: short(monday), to: short(addDays(monday, 6)) })}
        actions={
          <nav aria-label={t('week.nav')} className="flex flex-wrap gap-2">
            <Link
              className={buttonClass('secondary')}
              to={`/rooms/${id}/week?date=${addDays(monday, -7)}`}
            >
              {t('week.previous')}
            </Link>
            <Link className={buttonClass('secondary')} to={`/rooms/${id}/week?date=${nextMonday}`}>
              {t('week.next')}
            </Link>
          </nav>
        }
      />
      {(schedule.isPending || rules.isPending) && <Skeleton className="h-64" />}
      {schedule.error && (
        <ErrorState message={schedule.error.message} onRetry={() => void schedule.refetch()} />
      )}
      {schedule.data && rules.data && (
        <div className="rounded-xl border border-gray-300 bg-white">
          <div className="sticky top-0 z-10 flex gap-4 rounded-t-xl border-b border-gray-300 bg-gray-50 px-4 sm:gap-5 sm:px-5">
            <div className="w-14 shrink-0" />
            <HourRuler rules={rules.data} className="min-w-0 flex-1 border-x border-gray-300" />
          </div>
          {days.map((day) => {
            const entries = schedule.data.filter((e) => dateInZone(new Date(e.startAt), tz) === day)
            const weekday = dayName(dayOfWeek(day))
            const name = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day}`
            return (
              <section
                key={day}
                className="flex gap-4 border-b border-gray-200 px-4 py-3 last:border-b-0 sm:gap-5 sm:px-5"
              >
                <DateTile date={day} timeZone={tz} />
                <div className="min-w-0 flex-1">
                  <h2 className="nums mb-1.5 text-sm font-semibold text-gray-900">
                    <Link
                      className="hover:text-brand-700 hover:underline focus-visible:underline"
                      to={`/rooms/${id}?date=${day}`}
                    >
                      {name}
                    </Link>
                  </h2>
                  <div className="mb-2">
                    <DayTimeline entries={entries} rules={rules.data} label={name} ruler={false} />
                  </div>
                  <ScheduleList entries={entries} timeZone={tz} />
                </div>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
