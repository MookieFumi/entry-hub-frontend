import { FALLBACK_TIME_ZONE } from '@/lib/dates'
import { zonedToUtc } from '@/lib/tz'
import { formatLocale, useLocale } from '@/i18n'

/**
 * A planner cell for one day: weekday on the header band, the day number large, the month below.
 * It is a visual aid (hidden from assistive technology): the date is always next to it as text.
 * Pass an instant (`iso`) or a calendar date (`date`, YYYY-MM-DD); both are read in the office zone.
 */
export function DateTile({
  iso,
  date,
  timeZone = FALLBACK_TIME_ZONE,
  muted = false,
  size = 'md',
}: {
  iso?: string
  date?: string
  timeZone?: string
  muted?: boolean
  size?: 'md' | 'lg'
}) {
  useLocale()
  const instant = iso ? new Date(iso) : zonedToUtc(date ?? '1970-01-01', '12:00', timeZone)
  const parts = new Intl.DateTimeFormat(formatLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  }).formatToParts(instant)
  const part = (type: string) => (parts.find((p) => p.type === type)?.value ?? '').replace('.', '')
  const large = size === 'lg'
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 flex-col self-start overflow-hidden rounded-lg border bg-white text-center ${
        large ? 'w-20' : 'w-14'
      } ${muted ? 'border-gray-200 text-gray-500' : 'border-gray-300 text-gray-900'}`}
    >
      <span
        className={`font-semibold tracking-wider uppercase ${large ? 'py-1 text-xs' : 'py-0.5 text-xs'} ${
          muted ? 'bg-gray-100 text-gray-600' : 'bg-brand-700 text-white'
        }`}
      >
        {part('weekday')}
      </span>
      <span
        className={`font-display nums leading-none ${large ? 'pt-2 text-4xl' : 'pt-1.5 text-2xl'}`}
      >
        {part('day')}
      </span>
      <span
        className={`font-medium text-gray-600 uppercase ${large ? 'pt-0.5 pb-2 text-xs' : 'pb-1 text-xs'}`}
      >
        {part('month')}
      </span>
    </div>
  )
}
