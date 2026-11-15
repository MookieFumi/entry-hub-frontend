import { t, type MessageKey } from '@/i18n'
import type { Rules } from './slots'

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Day name in the current language (lower case in Spanish, as the API sends the English name). */
export const dayName = (day: string) =>
  DAY_ORDER.includes(day) ? t(`day.${day}` as MessageKey) : day

/** "15 min", "1 h", "1 h 30 min". */
export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours === 0) return `${minutes} min`
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

/** Days as a range when they are consecutive ("de lunes a viernes"), otherwise as a list. */
function describeDays(days: string[]): string {
  const indexes = days.map((d) => DAY_ORDER.indexOf(d)).sort((a, b) => a - b)
  const consecutive =
    indexes.length > 2 && indexes.every((n, i) => i === 0 || n === indexes[i - 1]! + 1)
  const names = indexes.map((n) => dayName(DAY_ORDER[n]!))
  if (consecutive) return t('rules.daysRange', { from: names[0]!, to: names[names.length - 1]! })
  return names.join(', ')
}

/** The booking rules from `/rules` as short sentences for the booking screen. */
export function describeRules(rules: Rules): string[] {
  const lines = [
    t('rules.opening', {
      days: describeDays(rules.officeDays as string[]),
      opens: rules.officeOpens,
      closes: rules.officeCloses,
      zone: rules.timeZone,
    }),
    t('rules.duration', {
      min: formatMinutes(Number(rules.minDurationMinutes)),
      max: formatMinutes(Number(rules.maxDurationMinutes)),
      slot: formatMinutes(Number(rules.slotMinutes)),
    }),
    t('rules.lead', {
      lead: formatMinutes(Number(rules.minLeadTimeMinutes)),
      days: Number(rules.maxAdvanceDays),
    }),
    t('rules.cancellation', { notice: formatMinutes(Number(rules.cancellationNoticeMinutes)) }),
  ]
  if (rules.maxActiveBookings !== null) {
    lines.push(t('rules.limit', { max: Number(rules.maxActiveBookings) }))
  }
  return lines
}
