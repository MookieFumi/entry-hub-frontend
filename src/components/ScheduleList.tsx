import { Badge } from '@/components/ui/Badge'
import { formatOfficeTime } from '@/lib/dates'
import type { ScheduleEntry } from '@/lib/slots'
import { useT } from '@/i18n'

/** The day's bookings as text: equivalent to the timeline for keyboard and screen-reader users. */
export function ScheduleList({
  entries,
  timeZone,
}: {
  entries: ScheduleEntry[]
  timeZone: string
}) {
  const t = useT()
  if (entries.length === 0) return <p className="text-sm text-gray-600">{t('schedule.none')}</p>
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((s, i) => (
        <li
          key={s.bookingId ?? i}
          className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
        >
          <span>
            {formatOfficeTime(s.startAt, timeZone)} – {formatOfficeTime(s.endAt, timeZone)}
            {s.title ? ` · ${s.title}` : ''}
          </span>
          {s.isMine && <Badge tone="brand">{t('schedule.mine')}</Badge>}
        </li>
      ))}
    </ul>
  )
}
