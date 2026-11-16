import { useOfficeZone } from '@/api/queries'
import { ruleMessage } from '@/api/errors'
import type { components } from '@/api/schema'
import { Alert } from '@/components/ui/Feedback'
import { formatOfficeDateTime } from '@/lib/dates'
import { useT } from '@/i18n'

type SeriesOutcome = components['schemas']['SeriesOutcome']

/** Result of creating a recurring booking: how many were booked and which were skipped, with the reason. */
export function SeriesSummary({ series }: { series: SeriesOutcome }) {
  const t = useT()
  const tz = useOfficeZone()
  const skipped = series.occurrences.filter((o) => !o.bookingId)
  const complete = skipped.length === 0
  return (
    <Alert tone={complete ? 'success' : 'warning'}>
      <p className="font-medium">
        {t('series.summary', {
          created: Number(series.created),
          requested: Number(series.requested),
        })}
      </p>
      {!complete && (
        <>
          <p className="mt-1">{t('series.skipped')}</p>
          <ul className="list-disc pl-5">
            {skipped.map((o) => (
              <li key={String(o.position)}>
                {formatOfficeDateTime(o.startAt, tz)} · {o.violations.map(ruleMessage).join(' ')}
              </li>
            ))}
          </ul>
        </>
      )}
    </Alert>
  )
}
