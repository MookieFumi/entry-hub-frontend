import { Link } from 'react-router'
import { useMe, useMyBookings, useOfficeZone, useRules, type Booking } from '@/api/queries'
import { CheckInBooking } from '@/components/CheckInBooking'
import { BookingRow } from '@/components/BookingRow'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState, PageHeader, SectionTitle, Skeleton } from '@/components/ui/Feedback'
import { formatOfficeTime } from '@/lib/dates'
import { addDays, dateInZone, dayOfWeek, zonedToUtc } from '@/lib/tz'
import { formatLocale, useT } from '@/i18n'
import { mondayOf } from './RoomWeek'

const WORK_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

/**
 * The current office week as a row of planner cells: today is marked and the viewer's confirmed
 * bookings appear as highlighted times. The list below carries the same bookings as text and links.
 */
function WeekStrip({ bookings }: { bookings: Booking[] }) {
  const t = useT()
  const tz = useOfficeZone()
  const rules = useRules()
  const today = dateInZone(new Date(), tz)
  const officeDays = (rules.data?.officeDays as string[] | undefined) ?? WORK_WEEK
  const weekFrom = (monday: string) =>
    Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) =>
      officeDays.includes(dayOfWeek(d)),
    )
  // Once the office week is over (for example on a weekend), show the next one.
  const thisWeek = weekFrom(mondayOf(today))
  const days = thisWeek.some((d) => d >= today) ? thisWeek : weekFrom(addDays(mondayOf(today), 7))
  const weekday = new Intl.DateTimeFormat(formatLocale(), { weekday: 'short', timeZone: tz })

  return (
    <section aria-label={t('home.week')} className="mb-10">
      <SectionTitle>{t('home.week')}</SectionTitle>
      <ol
        className="grid overflow-hidden rounded-xl border border-gray-300 bg-white"
        style={{ gridTemplateColumns: `repeat(${days.length || 1}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const isToday = day === today
          const past = day < today
          const mine = bookings
            .filter((b) => dateInZone(new Date(b.startAt), tz) === day)
            .sort((a, b) => a.startAt.localeCompare(b.startAt))
          return (
            <li
              key={day}
              aria-current={isToday ? 'date' : undefined}
              className={`flex min-h-28 flex-col border-l border-gray-200 first:border-l-0 ${
                past ? 'bg-gray-50' : ''
              }`}
            >
              <div
                className={`flex items-baseline justify-between gap-1 px-2 py-1.5 sm:px-3 ${
                  isToday ? 'bg-brand-700 text-white' : 'border-b border-gray-200 text-gray-600'
                }`}
              >
                <span className="text-xs font-semibold tracking-wider uppercase">
                  {weekday.format(zonedToUtc(day, '12:00', tz)).replace('.', '')}
                </span>
                {isToday && (
                  <span className="hidden text-xs font-semibold text-mine-400 sm:inline">
                    {t('home.today')}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-2 sm:p-3">
                <span
                  className={`font-display nums text-2xl leading-none sm:text-3xl ${
                    past ? 'text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {Number(day.slice(8))}
                </span>
                {mine.map((b) => (
                  <span
                    key={b.id}
                    className="marker-draw nums w-fit rounded bg-mine-400 px-1.5 py-0.5 text-xs font-semibold text-brand-950"
                  >
                    {formatOfficeTime(b.startAt, tz)}
                    <span className="hidden sm:inline"> – {formatOfficeTime(b.endAt, tz)}</span>
                  </span>
                ))}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function Home() {
  const t = useT()
  const me = useMe()
  const bookings = useMyBookings({ page: 1, pageSize: 50 })
  const confirmed = (bookings.data?.items ?? []).filter((b) => b.status === 'Confirmed')
  const upcoming = (bookings.data?.items ?? [])
    .filter(
      (b) => (b.status === 'Confirmed' || b.status === 'Pending') && new Date(b.endAt) > new Date(),
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 3)

  return (
    <>
      <PageHeader
        title={me.data ? t('home.greeting', { tenant: me.data.tenantName }) : t('nav.home')}
        description={t('home.description')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/search" className={buttonClass('primary')}>
              {t('home.findRoom')}
            </Link>
            <Link to="/rooms" className={buttonClass('secondary')}>
              {t('home.viewRooms')}
            </Link>
          </div>
        }
      />
      <WeekStrip bookings={confirmed} />
      <section>
        <SectionTitle>{t('home.upcoming')}</SectionTitle>
        {bookings.isPending && <Skeleton className="h-20" />}
        {bookings.data && upcoming.length === 0 && (
          <EmptyState
            title={t('home.noUpcoming')}
            action={
              <Link to="/search" className={buttonClass('primary')}>
                {t('home.findRoom')}
              </Link>
            }
          >
            {t('home.noUpcomingHint')}
          </EmptyState>
        )}
        {upcoming.length > 0 && (
          <ul className="flex flex-col gap-3">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} actions={<CheckInBooking booking={b} />} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
