/** Utilidades de zona horaria con Intl, sin librerías. Las fechas locales son `YYYY-MM-DD` y las horas `HH:mm`. */

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

/** Diferencia (ms) entre la hora de pared de la zona y UTC en ese instante. */
function offsetMs(date: Date, timeZone: string): number {
  const p = partsIn(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** Convierte una fecha y hora de pared de la zona (p. ej. 09:00 en Madrid) al instante UTC correcto. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const [hh, mm] = time.split(':').map(Number) as [number, number]
  const naive = Date.UTC(y, m - 1, d, hh, mm)
  // Dos pasadas: la primera estima el desfase; la segunda lo corrige si cruzamos un cambio de hora.
  const first = naive - offsetMs(new Date(naive), timeZone)
  return new Date(naive - offsetMs(new Date(first), timeZone))
}

/** Fecha `YYYY-MM-DD` de un instante, vista desde la zona. */
export function dateInZone(instant: Date, timeZone: string): string {
  const p = partsIn(instant, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** Hora `HH:mm` de un instante, vista desde la zona. */
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

/** Día de la semana de una fecha de calendario (no depende de la zona). */
export function dayOfWeek(date: string): DayName {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!
}

/** Suma días a una fecha `YYYY-MM-DD`. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
