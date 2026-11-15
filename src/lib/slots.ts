import type { components } from '@/api/schema'
import { dayOfWeek, timeInZone, zonedToUtc } from './tz'

export type Rules = components['schemas']['RulesResponse']
export type ScheduleEntry = components['schemas']['RoomScheduleEntry']

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  return h * 60 + m
}
const toHHmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** Can that day be booked according to the office days in the rules? */
export function isBookableDay(date: string, rules: Rules): boolean {
  return (rules.officeDays as string[]).includes(dayOfWeek(date))
}

export type Slot = { time: string; busy: boolean; past: boolean }

/**
 * Start slots of the day (every `slotMinutes`) between opening and closing, marking the busy ones and
 * those that can no longer be booked because of the minimum lead time. The API remains the authority: this only guides.
 */
export function buildSlots(
  date: string,
  rules: Rules,
  busy: ScheduleEntry[],
  now = new Date(),
): Slot[] {
  if (!isBookableDay(date, rules)) return []
  const step = Number(rules.slotMinutes)
  const open = toMinutes(rules.officeOpens)
  const close = toMinutes(rules.officeCloses)
  const earliest = now.getTime() + Number(rules.minLeadTimeMinutes) * 60_000
  const ranges = busy.map(
    (b) => [new Date(b.startAt).getTime(), new Date(b.endAt).getTime()] as const,
  )

  const slots: Slot[] = []
  for (let t = open; t < close; t += step) {
    const start = zonedToUtc(date, toHHmm(t), rules.timeZone).getTime()
    const end = start + step * 60_000
    slots.push({
      time: toHHmm(t),
      busy: ranges.some(([s, e]) => s < end && e > start),
      past: start < earliest,
    })
  }
  return slots
}

/** Possible end times for a start: they respect the minimum and maximum duration and the closing time, and never cross a busy slot. */
export function endOptions(start: string, rules: Rules, slots: Slot[]): string[] {
  const step = Number(rules.slotMinutes)
  const min = Number(rules.minDurationMinutes)
  const max = Number(rules.maxDurationMinutes)
  const close = toMinutes(rules.officeCloses)
  const from = toMinutes(start)
  const busyAt = new Map(slots.map((s) => [s.time, s.busy]))
  const options: string[] = []
  for (let end = from + step; end <= close && end - from <= max; end += step) {
    // The slot [end - step, end) must be free.
    if (busyAt.get(toHHmm(end - step))) break
    if (end - from >= min) options.push(toHHmm(end))
  }
  return options
}

/** UTC instant (ISO) of an office wall-clock date and time. */
export function toIso(date: string, time: string, rules: Rules): string {
  return zonedToUtc(date, time, rules.timeZone).toISOString()
}

/** Office wall-clock time of an ISO instant. */
export function officeTime(iso: string, rules: Rules): string {
  return timeInZone(new Date(iso), rules.timeZone)
}
