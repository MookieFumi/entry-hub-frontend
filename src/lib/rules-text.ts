import type { Rules } from './slots'

const DAYS_ES: Record<string, string> = {
  Monday: 'lunes',
  Tuesday: 'martes',
  Wednesday: 'miércoles',
  Thursday: 'jueves',
  Friday: 'viernes',
  Saturday: 'sábado',
  Sunday: 'domingo',
}

export const dayEs = (day: string) => DAYS_ES[day] ?? day

/** "15 min", "1 h", "1 h 30 min". */
export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours === 0) return `${minutes} min`
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

/** Days as a range when they are consecutive ("de lunes a viernes"), otherwise as a list. */
function describeDays(days: string[]): string {
  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const indexes = days.map((d) => order.indexOf(d)).sort((a, b) => a - b)
  const consecutive =
    indexes.length > 2 && indexes.every((n, i) => i === 0 || n === indexes[i - 1]! + 1)
  const names = indexes.map((n) => dayEs(order[n]!))
  if (consecutive) return `de ${names[0]} a ${names[names.length - 1]}`
  return names.join(', ')
}

/** The booking rules from `/rules` as short sentences for the booking screen. */
export function describeRules(rules: Rules): string[] {
  const lines = [
    `Se reserva ${describeDays(rules.officeDays as string[])}, de ${rules.officeOpens} a ${rules.officeCloses} (${rules.timeZone}).`,
    `Duración: de ${formatMinutes(Number(rules.minDurationMinutes))} a ${formatMinutes(Number(rules.maxDurationMinutes))}, en tramos de ${formatMinutes(Number(rules.slotMinutes))}.`,
    `Antelación: la reserva empieza al menos ${formatMinutes(Number(rules.minLeadTimeMinutes))} después de ahora y como mucho ${Number(rules.maxAdvanceDays)} días después.`,
    `Cancelación: hasta ${formatMinutes(Number(rules.cancellationNoticeMinutes))} antes del inicio (Facilities puede cancelar siempre).`,
  ]
  if (rules.maxActiveBookings !== null) {
    lines.push(`Límite: ${Number(rules.maxActiveBookings)} reservas activas por persona.`)
  }
  return lines
}
