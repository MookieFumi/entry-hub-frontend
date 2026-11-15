/**
 * The API stores dates in UTC and evaluates its rules in the office time zone, which it publishes in
 * `GET /rules` (`timeZone`). The UI always shows that zone, not the browser's. This value is only
 * used while the rules have not loaded.
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
