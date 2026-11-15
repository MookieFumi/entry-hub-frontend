import type { SiteHoliday } from '@/api/queries'
import { Alert } from '@/components/ui/Feedback'
import { useT } from '@/i18n'

/** Warns when the chosen day is closed and lists the next closed days of the site. */
export function ClosedDaysNotice({ holidays, date }: { holidays: SiteHoliday[]; date: string }) {
  const t = useT()
  const closed = holidays.find((h) => h.date === date)
  const upcoming = holidays
    .filter((h) => h.date >= date && h.date !== date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)
  if (!closed && upcoming.length === 0) return null
  const label = (h: SiteHoliday) => (h.name ? `${h.date} (${h.name})` : h.date)
  return (
    <>
      {closed && (
        <Alert tone="warning">
          {closed.name ? t('closed.dayClosedNamed', { name: closed.name }) : t('closed.dayClosed')}
        </Alert>
      )}
      {upcoming.length > 0 && (
        <p className="text-xs text-gray-500">
          {t('closed.upcoming', { days: upcoming.map(label).join(', ') })}
        </p>
      )}
    </>
  )
}
