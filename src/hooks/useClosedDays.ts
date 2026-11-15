import { useOfficeZone, useRules, useSiteHolidays } from '@/api/queries'
import { addDays, dateInZone } from '@/lib/tz'

/** Closed days of a site from today until the end of the booking window. */
export function useClosedDays(siteId: string | undefined) {
  const tz = useOfficeZone()
  const rules = useRules()
  const today = dateInZone(new Date(), tz)
  const to = addDays(today, Number(rules.data?.maxAdvanceDays ?? 90))
  return useSiteHolidays(siteId, today, to)
}
