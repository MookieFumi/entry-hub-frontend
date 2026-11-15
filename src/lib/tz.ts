/** Time zone utilities with Intl, no libraries. Local dates are `YYYY-MM-DD` and times `HH:mm`. */

function partsIn(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

/** Difference (ms) between the zone's wall-clock time and UTC at that instant. */
function offsetMs(date: Date, timeZone: string): number {
  const p = partsIn(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** Converts a wall-clock date and time of the zone (e.g. 09:00 in Madrid) to the correct UTC instant. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const [hh, mm] = time.split(':').map(Number) as [number, number]
  const naive = Date.UTC(y, m - 1, d, hh, mm)
  // Two passes: the first estimates the offset; the second fixes it if we cross a clock change.
  const first = naive - offsetMs(new Date(naive), timeZone)
  return new Date(naive - offsetMs(new Date(first), timeZone))
}

/** `YYYY-MM-DD` date of an instant, seen from the zone. */
export function dateInZone(instant: Date, timeZone: string): string {
  const p = partsIn(instant, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** `HH:mm` time of an instant, seen from the zone. */
export function timeInZone(instant: Date, timeZone: string): string {
  const p = partsIn(instant, timeZone)
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const
export type DayName = (typeof DAY_NAMES)[number]

/** Day of the week of a calendar date (does not depend on the zone). */
export function dayOfWeek(date: string): DayName {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!
}

/** Adds days to a `YYYY-MM-DD` date. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
