import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { DateTile } from '@/components/DateTile'
import { DayTimeline } from '@/components/DayTimeline'
import { ScheduleList } from '@/components/ScheduleList'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { AppVersion } from '@/components/AppVersion'
import { Badge } from '@/components/ui/Badge'
import { Wordmark } from '@/components/ui/icons'
import studioOnDark from '@/assets/brand/wordmark-horizontal-on-dark.svg'
import { describeRules } from '@/lib/rules-text'
import type { Rules, ScheduleEntry } from '@/lib/slots'
import { formatLocale, useLocale, useT, type MessageKey } from '@/i18n'

/** Demonstration data for the page: not real rooms, bookings or rules of any customer. */
const DEMO_RULES = {
  minDurationMinutes: 15,
  maxDurationMinutes: 240,
  slotMinutes: 15,
  officeOpens: '08:00',
  officeCloses: '20:00',
  officeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  timeZone: 'Europe/Madrid',
  minLeadTimeMinutes: 15,
  maxAdvanceDays: 60,
  cancellationNoticeMinutes: 15,
  maxActiveBookings: 5,
} as unknown as Rules

const WEEKDAYS = [0, 1, 2, 3, 4]
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8)
const DEMO_ROOMS = [
  { name: 'Sala Gaudí', floor: 2, capacity: 8, features: ['TV'], busy: [9, 10, 15, 16] },
  { name: 'Sala Miró', floor: 1, capacity: 4, features: [], busy: [8, 12, 13] },
  { name: 'Sala Dalí', floor: 3, capacity: 12, features: ['TV'], busy: [10, 11, 12, 17, 18] },
]
const RULE_ANSWERS: MessageKey[] = [
  'rule.RoomUnavailable',
  'rule.ExceedsCapacity',
  'rule.OutsideOfficeHours',
  'rule.TooLateToCancel',
]
const DEMO_DAY = '2030-01-14'
const at = (h: number) => `${DEMO_DAY}T${String(h - 1).padStart(2, '0')}:00:00Z`
/** Sala Gaudí's day as the app's schedule entries (same hours as the board). */
const DEMO_SCHEDULE = [
  { bookingId: 'd1', startAt: at(9), endAt: at(11), title: 'Planning', isMine: false },
  { bookingId: 'd2', startAt: at(13), endAt: at(14), title: 'Weekly sync', isMine: true },
  { bookingId: 'd3', startAt: at(15), endAt: at(17), title: null, isMine: false },
] as unknown as ScheduleEntry[]
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`

const primaryCta =
  'inline-flex items-center justify-center rounded-lg bg-mine-400 px-5 py-3 text-base font-semibold whitespace-nowrap text-brand-950 ' +
  'transition-[background-color,translate] duration-150 hover:bg-white active:translate-y-px ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

/**
 * The working planner of the opening: three demo rooms by office hours. A free cell books (and
 * releases) in highlighter; a busy cell or one booking too many answers with the product's own rule text.
 */
function PlannerBoard() {
  const t = useT()
  const [mine, setMine] = useState<string[]>(['0-13'])
  const [notice, setNotice] = useState<{ tone: 'ok' | 'no'; text: string } | null>(null)
  const [denied, setDenied] = useState<string | null>(null)
  const [cursor, setCursor] = useState('0-13')

  // On a narrow screen the board scrolls: open it on the middle of the day, where the marked cell is.
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) * 0.5
  }, [])

  function press(room: number, hour: number) {
    const key = `${room}-${hour}`
    const where = { room: DEMO_ROOMS[room]!.name, time: hh(hour) }
    if (DEMO_ROOMS[room]!.busy.includes(hour)) {
      setDenied(key)
      return setNotice({ tone: 'no', text: t('rule.RoomUnavailable') })
    }
    setDenied(null)
    if (mine.includes(key)) {
      setMine(mine.filter((k) => k !== key))
      return setNotice({ tone: 'ok', text: t('landing.board.released', where) })
    }
    if (mine.length >= Number(DEMO_RULES.maxActiveBookings))
      return setNotice({ tone: 'no', text: t('rule.TooManyActiveBookings') })
    setMine([...mine, key])
    setNotice({ tone: 'ok', text: t('landing.board.booked', where) })
  }

  /** One tab stop for the whole board; the arrow keys move between cells. */
  function move(e: KeyboardEvent<HTMLButtonElement>, room: number, hour: number) {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    }
    const by = step[e.key]
    if (!by) return
    e.preventDefault()
    const r = Math.min(Math.max(room + by[0], 0), DEMO_ROOMS.length - 1)
    const h = Math.min(Math.max(hour + by[1], HOURS[0]!), HOURS[HOURS.length - 1]!)
    e.currentTarget
      .closest('[role="group"]')
      ?.querySelector<HTMLButtonElement>(`[data-cell="${r}-${h}"]`)
      ?.focus()
  }

  return (
    <section aria-labelledby="board-title" className="mt-10 sm:mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="board-title" className="font-display text-2xl text-white">
          {t('landing.board.title')}
        </h2>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-brand-100">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-sm border border-white/50" />
            {t('landing.board.free')}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-sm bg-error-500" />
            {t('landing.board.busy')}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-3 rounded-sm bg-mine-400" />
            {t('landing.board.mine')}
          </li>
          <li className="rounded-full border border-white/40 px-2.5 py-0.5 text-xs">
            {t('landing.board.demo')}
          </li>
        </ul>
      </div>
      <p
        role="status"
        className={`mb-3 flex min-h-6 items-center gap-2 text-base font-medium ${
          notice?.tone === 'no' ? 'text-white' : 'text-brand-100'
        }`}
      >
        {notice && (
          <span
            aria-hidden="true"
            className={`size-2.5 shrink-0 rounded-full ${notice.tone === 'no' ? 'bg-error-500' : 'bg-mine-400'}`}
          />
        )}
        {notice?.text ?? t('landing.board.idle')}
      </p>
      <div
        ref={scroller}
        className="overflow-x-auto rounded-xl border border-white/30 bg-brand-700"
      >
        <div
          role="group"
          aria-label={t('landing.board.label')}
          className="grid min-w-[44rem] grid-cols-[7.5rem_repeat(12,minmax(0,1fr))] sm:grid-cols-[8.5rem_repeat(12,minmax(0,1fr))]"
        >
          <div className="sticky left-0 z-20 border-r border-b border-white/30 bg-brand-700" />
          {HOURS.map((h) => (
            <div
              key={h}
              aria-hidden="true"
              className="nums border-b border-l border-white/30 px-1.5 py-1.5 text-xs font-semibold text-brand-100"
            >
              {String(h).padStart(2, '0')}
            </div>
          ))}
          {DEMO_ROOMS.map((room, r) => (
            <div key={room.name} className="col-span-full grid grid-cols-subgrid">
              <div
                className={`sticky left-0 z-20 border-r border-white/30 bg-brand-700 px-3 py-3 ${r > 0 ? 'border-t' : ''}`}
              >
                <p className="font-semibold text-white">{room.name}</p>
                <p className="nums text-xs text-brand-100">
                  {t('room.summary', { floor: room.floor, capacity: room.capacity })}
                </p>
              </div>
              {HOURS.map((h) => {
                const busy = room.busy.includes(h)
                const isMine = mine.includes(`${r}-${h}`)
                const state = busy
                  ? t('landing.board.busy')
                  : isMine
                    ? t('landing.board.mine')
                    : t('landing.board.free')
                return (
                  <button
                    key={h}
                    type="button"
                    aria-pressed={isMine}
                    aria-label={t('landing.board.cell', { room: room.name, time: hh(h), state })}
                    data-cell={`${r}-${h}`}
                    tabIndex={cursor === `${r}-${h}` ? 0 : -1}
                    onFocus={() => setCursor(`${r}-${h}`)}
                    onKeyDown={(e) => move(e, r, h)}
                    onClick={() => press(r, h)}
                    className={`group relative min-h-16 border-l border-white/30 p-1.5 transition-colors duration-150 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mine-400 ${
                      r > 0 ? 'border-t' : ''
                    } ${busy ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}`}
                  >
                    {busy && (
                      <span
                        className={`block h-full rounded bg-error-500 transition-[box-shadow] duration-150 ${
                          denied === `${r}-${h}` ? 'ring-2 ring-white ring-inset' : ''
                        }`}
                      />
                    )}
                    {isMine && (
                      <span className="marker-draw mt-[25%] block h-1/2 -skew-x-12 rounded-sm bg-mine-400 [--marker-delay:120ms]" />
                    )}
                    {!busy && !isMine && (
                      <span className="block h-full rounded border border-dashed border-white/0 transition-colors duration-150 group-hover:border-white/60" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-brand-100">
        <span className="md:hidden">{t('landing.board.scroll')} </span>
        {t('landing.board.note')}
      </p>
    </section>
  )
}

/** Holds the marker bands inside it until the block scrolls into view, so the draw is seen. */
function InView({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setSeen(true)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen])
  return (
    <div ref={ref} data-inview={seen} className={className}>
      {children}
    </div>
  )
}

/** One row of the planner sheet: the row's name on the left band, its content in the cells. */
function Row({
  id,
  title,
  body,
  children,
}: {
  id: string
  title: string
  body?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-4 border-t border-gray-300 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="px-5 pt-12 sm:px-8 lg:border-r lg:border-gray-300 lg:py-20 lg:pr-12 xl:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        <h2
          id={`${id}-title`}
          className="font-display text-4xl leading-none text-gray-900 sm:text-5xl"
        >
          {title}
        </h2>
        {body && <p className="mt-5 max-w-[46ch] text-lg text-gray-700">{body}</p>}
      </div>
      <div className="px-5 pt-8 pb-14 sm:px-8 lg:py-20 lg:pl-12 xl:pr-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        {children}
      </div>
    </section>
  )
}

export function Landing() {
  const t = useT()
  const heroTitle = t('landing.hero.title')
  const markAt = Math.max(heroTitle.lastIndexOf(t('landing.hero.mark')), 0)
  useLocale()
  const weekday = new Intl.DateTimeFormat(formatLocale(), { weekday: 'short', timeZone: 'UTC' })
  const navLink =
    'rounded px-1 py-1 text-sm font-semibold text-brand-100 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mine-400'

  return (
    <div className="bg-white text-gray-900">
      <a
        href="#contenido"
        className="sr-only rounded-lg bg-mine-400 font-semibold text-brand-950 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:p-3"
      >
        {t('nav.skip')}
      </a>
      <div className="bg-brand-700 text-white">
        <header className="border-b border-white/30">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
            <Wordmark name={t('app.name')} />
            <nav aria-label={t('landing.nav.label')} className="hidden gap-6 md:flex">
              <a className={navLink} href="#find">
                {t('landing.nav.find')}
              </a>
              <a className={navLink} href="#rules">
                {t('landing.nav.rules')}
              </a>
              <a className={navLink} href="#facilities">
                {t('landing.nav.facilities')}
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <LanguageSwitcher tone="ink" />
              <Link
                to="/login"
                className="rounded-lg border border-white/50 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white transition-colors duration-150 hover:bg-white hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mine-400"
              >
                {t('landing.cta')}
              </Link>
            </div>
          </div>
        </header>
        <div aria-hidden="true" className="border-b border-white/30">
          <div className="mx-auto grid max-w-7xl grid-cols-5 px-5 sm:px-8">
            {WEEKDAYS.map((i) => (
              <span
                key={i}
                className={`border-white/30 py-1.5 pl-2 text-xs font-semibold tracking-wider text-brand-100 uppercase ${i > 0 ? 'border-l' : ''}`}
              >
                {weekday.format(new Date(Date.UTC(2024, 0, 1 + i))).replace('.', '')}
              </span>
            ))}
          </div>
        </div>
        <main
          id="contenido"
          className="mx-auto max-w-7xl bg-[linear-gradient(to_right,rgb(255_255_255/0.14)_1px,transparent_1px)] bg-[length:20%_100%] relative bg-origin-content px-5 pt-10 pb-16 sm:px-8 sm:pt-14 sm:pb-24"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 hidden h-96 grid-cols-5 lg:grid"
          >
            <div className="relative col-start-4">
              <span className="marker-draw absolute inset-x-3 top-44 h-16 rounded bg-white/12 [--marker-delay:260ms]" />
            </div>
            <div className="relative col-start-5">
              <span className="marker-draw absolute inset-x-3 top-24 h-12 rounded bg-white/12 [--marker-delay:340ms]" />
              <span className="marker-draw absolute inset-x-4 top-60 h-9 -skew-x-12 rounded-sm bg-white/20 [--marker-delay:420ms]" />
            </div>
          </div>
          <h1 className="font-display relative max-w-[20ch] text-[clamp(3rem,9vw,6rem)] leading-[0.95] text-white">
            {heroTitle.slice(0, markAt)}
            <span className="relative -mx-[0.1em] inline-block px-[0.1em] text-brand-950">
              <span
                aria-hidden="true"
                className="marker-draw absolute inset-0 -skew-x-6 rounded-sm bg-mine-400"
              />
              <span className="relative">{heroTitle.slice(markAt)}</span>
            </span>
          </h1>
          <p className="mt-6 max-w-[58ch] text-lg text-brand-100 sm:text-xl">
            {t('landing.hero.body')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link to="/login" className={primaryCta}>
              {t('landing.cta')}
            </Link>
          </div>
          <PlannerBoard />
        </main>
      </div>

      <Row id="find" title={t('landing.find.title')} body={t('landing.find.body')}>
        <div className="rounded-xl border border-gray-300 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div>
              <h3 className="font-display text-2xl text-gray-900">{DEMO_ROOMS[0]!.name}</h3>
              <p className="nums text-sm text-gray-600">
                {t('room.summary', {
                  floor: DEMO_ROOMS[0]!.floor,
                  capacity: DEMO_ROOMS[0]!.capacity,
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>TV</Badge>
              <Badge tone="success">
                {t('room.freeNow', { until: t('room.until', { time: '13:00' }) })}
              </Badge>
            </div>
          </div>
          <p className="mb-2 text-sm font-semibold text-gray-800">{t('landing.find.day')}</p>
          <InView className="mb-3">
            <DayTimeline entries={DEMO_SCHEDULE} rules={DEMO_RULES} label={t('landing.find.day')} />
          </InView>
          <ScheduleList entries={DEMO_SCHEDULE} timeZone={DEMO_RULES.timeZone} />
        </div>
        <p className="mt-3 text-sm text-gray-600">{t('landing.board.demo')}</p>
      </Row>

      <Row id="rules" title={t('landing.rules.title')} body={t('landing.rules.body')}>
        <ul className="nums list-disc space-y-2 pl-5 text-lg text-gray-900 marker:text-brand-500">
          {describeRules(DEMO_RULES).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-10 mb-3 font-semibold text-gray-900">{t('landing.rules.answers')}</p>
        <ul className="flex flex-col gap-2">
          {RULE_ANSWERS.map((key) => (
            <li
              key={key}
              className="flex items-start gap-3 rounded-lg border border-error-300 bg-error-50 px-4 py-3 font-medium text-error-700"
            >
              <span
                aria-hidden="true"
                className="mt-1.5 size-2.5 shrink-0 rounded-full bg-error-500"
              />
              {t(key)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-gray-600">{t('landing.board.demo')}</p>
      </Row>

      <Row id="facilities" title={t('landing.fac.title')} body={t('landing.fac.body')}>
        <div className="overflow-x-auto rounded-xl border border-gray-300">
          <table className="nums w-full text-left text-sm">
            <thead className="bg-brand-50 text-xs font-semibold tracking-wider text-brand-900 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t('admin.rooms.name')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('admin.rooms.floor')}
                </th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                  {t('admin.rooms.capacity')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('admin.rooms.state')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...DEMO_ROOMS, { name: 'Sala Picasso', floor: 1, capacity: 6 }].map((room, i) => (
                <tr key={room.name} className="border-t border-gray-200">
                  <th scope="row" className="px-4 py-3 font-semibold text-gray-900">
                    {room.name}
                  </th>
                  <td className="px-4 py-3">{room.floor}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{room.capacity}</td>
                  <td className="px-4 py-3">
                    <Badge tone={i === 3 ? 'warning' : 'success'}>
                      {i === 3 ? t('admin.rooms.inactive') : t('admin.rooms.active')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="font-display mt-10 mb-3 text-xl text-gray-900">{t('nav.closedDays')}</h3>
        <ul className="flex flex-wrap gap-x-8 gap-y-4">
          {(
            [
              ['2026-12-25', 'landing.fac.holiday1'],
              ['2027-01-01', 'landing.fac.holiday2'],
            ] as const
          ).map(([date, name]) => (
            <li key={date} className="flex items-center gap-3">
              <DateTile date={date} timeZone={DEMO_RULES.timeZone} />
              <span className="font-semibold text-gray-900">
                {t(name)} <span className="sr-only">({date})</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-gray-600">{t('landing.board.demo')}</p>
      </Row>

      <Row id="more" title={t('landing.more.title')}>
        <ul className="grid gap-x-10 gap-y-5 text-lg text-gray-900 sm:grid-cols-2">
          {(
            [
              'landing.more.languages',
              'landing.more.zone',
              'landing.more.a11y',
              'landing.more.open',
            ] as const
          ).map((key) => (
            <li key={key} className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-2.5 h-2 w-5 shrink-0 rounded-sm bg-mine-400" />
              {t(key)}
            </li>
          ))}
        </ul>
      </Row>

      <section aria-labelledby="close-title" className="bg-mine-400 text-brand-950">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <h2
            id="close-title"
            className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95]"
          >
            {t('landing.close.title')}
          </h2>
          <p className="mt-5 max-w-[60ch] text-lg">{t('landing.close.body')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-brand-800 px-5 py-3 text-base font-semibold whitespace-nowrap text-white transition-[background-color,translate] duration-150 hover:bg-brand-950 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-950"
            >
              {t('landing.cta')}
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-brand-950 text-brand-100">
        <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
          <div className="border-b border-white/20 pb-6">
            <a
              href="https://github.com/mookie-studio"
              className="inline-flex flex-col items-start gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mine-400"
            >
              <span>{t('landing.madeBy')}</span>
              <img
                src={studioOnDark}
                alt="mookie studio"
                width={1684}
                height={624}
                className="-ml-2 h-24 w-auto sm:h-26"
              />
            </a>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm sm:px-8">
          <p>{t('landing.footer')}</p>
          <AppVersion className="text-brand-100/70" />
        </div>
      </footer>
    </div>
  )
}
