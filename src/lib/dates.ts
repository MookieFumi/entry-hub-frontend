/**
 * La API guarda las fechas en UTC y evalúa sus reglas en la zona de la oficina, que publica en
 * `GET /rules` (`timeZone`). La interfaz muestra siempre esa zona, no la del navegador. Este valor solo
 * se usa mientras las reglas no han cargado.
 */
export const FALLBACK_TIME_ZONE = 'Europe/Madrid'

export function formatOfficeDateTime(
  iso: string,
  timeZone = FALLBACK_TIME_ZONE,
  locale = 'es-ES',
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(iso))
}

export function formatOfficeTime(
  iso: string,
  timeZone = FALLBACK_TIME_ZONE,
  locale = 'es-ES',
): string {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone }).format(new Date(iso))
}
