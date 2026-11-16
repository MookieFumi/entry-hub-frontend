import { type Rules, type ScheduleEntry } from '@/lib/slots'
import { timeInZone } from '@/lib/tz'
import { useT } from '@/i18n'

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  return h * 60 + m
}

/** The hour scale of the office day: where a minute falls on the strip and which hours are ruled. */
function scale(rules: Rules) {
  const open = minutes(rules.officeOpens)
  const close = minutes(rules.officeCloses)
  const span = close - open
  const pct = (m: number) => `${(Math.min(Math.max(m - open, 0), span) / span) * 100}%`
  const hours: number[] = []
  for (let h = Math.ceil(open / 60); h * 60 < close; h += 1) hours.push(h)
  return { pct, hours }
}

/** Hour header of a strip. A sheet with several strips shows it once, above them. */
export function HourRuler({ rules, className = '' }: { rules: Rules; className?: string }) {
  const { pct, hours } = scale(rules)
  return (
    <div aria-hidden="true" className={`relative h-6 bg-gray-50 ${className}`}>
      {hours.map((h, i) => (
        <span
          key={h}
          className={`nums absolute top-1 pl-1.5 text-xs leading-4 font-semibold text-gray-600 ${
            i % 2 === 1 ? 'hidden md:inline' : ''
          }`}
          style={{ left: pct(h * 60) }}
        >
          {String(h).padStart(2, '0')}
        </span>
      ))}
    </div>
  )
}

/**
 * Planner strip of one day between office opening and closing: a ruled column per hour, other people's
 * bookings drawn as coral blocks and the viewer's own as a slanted highlighter stroke. It is a visual aid: the list of the
 * day's bookings (same content as text) always goes next to it.
 */
export function DayTimeline({
  entries,
  rules,
  label,
  ruler = true,
}: {
  entries: ScheduleEntry[]
  rules: Rules
  label: string
  /** Hour header above the strip; a sheet with several strips shows it once. */
  ruler?: boolean
}) {
  const t = useT()
  const { pct, hours } = scale(rules)

  return (
    <div
      role="img"
      aria-label={`${label}: ${entries.length === 0 ? t('timeline.none') : t('timeline.count', { count: entries.length })}`}
      className="overflow-hidden rounded-lg border border-gray-300 bg-white"
    >
      {ruler && <HourRuler rules={rules} className="border-b border-gray-200" />}
      <div className="relative h-12">
        {hours.slice(1).map((h) => (
          <span
            key={h}
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-gray-200"
            style={{ left: pct(h * 60) }}
          />
        ))}
        {entries.map((e, i) => {
          const start = minutes(timeInZone(new Date(e.startAt), rules.timeZone))
          const end = minutes(timeInZone(new Date(e.endAt), rules.timeZone))
          return (
            <div
              key={e.bookingId ?? i}
              data-testid="timeline-block"
              className={`marker-draw absolute ${
                e.isMine
                  ? 'inset-y-3 -skew-x-12 rounded-sm bg-mine-400 ring-1 ring-brand-950/55 mix-blend-multiply'
                  : 'inset-y-2 rounded bg-error-500'
              }`}
              style={{ left: pct(start), width: `calc(${pct(end)} - ${pct(start)})` }}
            />
          )
        })}
      </div>
    </div>
  )
}
