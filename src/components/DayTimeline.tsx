import { type Rules, type ScheduleEntry } from '@/lib/slots'
import { timeInZone } from '@/lib/tz'

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  return h * 60 + m
}

/**
 * Timeline of one day between office opening and closing. It is a visual aid: the list of the day's
 * bookings (same content as text) always goes next to it.
 */
export function DayTimeline({
  entries,
  rules,
  label,
}: {
  entries: ScheduleEntry[]
  rules: Rules
  label: string
}) {
  const open = minutes(rules.officeOpens)
  const close = minutes(rules.officeCloses)
  const span = close - open
  const pct = (m: number) => `${(Math.min(Math.max(m - open, 0), span) / span) * 100}%`
  const hours: number[] = []
  for (let h = Math.ceil(open / 60); h * 60 <= close; h += 2) hours.push(h)

  return (
    <div
      role="img"
      aria-label={`${label}: ${entries.length === 0 ? 'sin reservas' : `${entries.length} reservas`}`}
      className="relative h-10 rounded-lg bg-gray-100"
    >
      {entries.map((e, i) => {
        const start = minutes(timeInZone(new Date(e.startAt), rules.timeZone))
        const end = minutes(timeInZone(new Date(e.endAt), rules.timeZone))
        return (
          <div
            key={e.bookingId ?? i}
            data-testid="timeline-block"
            className={`absolute inset-y-1 rounded-md ${e.isMine ? 'bg-brand-600' : 'bg-gray-400'}`}
            style={{ left: pct(start), width: `calc(${pct(end)} - ${pct(start)})` }}
          />
        )
      })}
      {hours.map((h) => (
        <span
          key={h}
          aria-hidden="true"
          className="absolute -bottom-5 -translate-x-1/2 text-xs text-gray-500"
          style={{ left: pct(h * 60) }}
        >
          {String(h).padStart(2, '0')}
        </span>
      ))}
    </div>
  )
}
