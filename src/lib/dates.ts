/**
 * La API guarda las fechas en UTC y evalúa sus reglas en la zona de la oficina (hoy Europe/Madrid).
 * La interfaz muestra siempre esa zona, no la del navegador. Cuando la API exponga la zona de la sede
 * (backlog de sedes), este valor vendrá de ahí.
 */
export const OFFICE_TIME_ZONE = 'Europe/Madrid'

export function formatOfficeDateTime(iso: string, locale = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: OFFICE_TIME_ZONE,
  }).format(new Date(iso))
}

export function formatOfficeTime(iso: string, locale = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, {
    timeStyle: 'short',
    timeZone: OFFICE_TIME_ZONE,
  }).format(new Date(iso))
}
