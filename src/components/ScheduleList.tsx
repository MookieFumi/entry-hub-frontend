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
    <ul className="flex flex-col divide-y divide-gray-200 rounded-lg border border-gray-200">
      {entries.map((s, i) => (
        <li
          key={s.bookingId ?? i}
          className={`flex items-center justify-between gap-2 px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg ${
            s.isMine ? 'bg-mine-200/60' : 'bg-white'
          }`}
        >
          <span className="nums flex items-center gap-2 text-gray-900">
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${s.isMine ? 'bg-brand-950' : 'bg-error-500'}`}
            />
            {formatOfficeTime(s.startAt, timeZone)} – {formatOfficeTime(s.endAt, timeZone)}
            {s.title ? ` · ${s.title}` : ''}
          </span>
          {s.isMine && <Badge tone="mine">{t('schedule.mine')}</Badge>}
        </li>
      ))}
    </ul>
  )
}
