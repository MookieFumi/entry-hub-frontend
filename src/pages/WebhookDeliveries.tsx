import { ApiError } from '@/api/errors'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  useOfficeZone,
  useWebhookDeliveries,
  useWebhooks,
  type WebhookDeliveryStatus,
} from '@/api/queries'
import { Badge } from '@/components/ui/Badge'
import { SelectField } from '@/components/ui/Field'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useEventName } from '@/hooks/useEventName'
import { formatOfficeDateTime } from '@/lib/dates'
import { useT } from '@/i18n'

const STATUSES: WebhookDeliveryStatus[] = ['Pending', 'Succeeded', 'Failed']

function StatusBadge({ status }: { status: WebhookDeliveryStatus }) {
  const t = useT()
  if (status === 'Succeeded') return <Badge tone="success">{t('deliveries.statusSucceeded')}</Badge>
  if (status === 'Failed') return <Badge tone="error">{t('deliveries.statusFailed')}</Badge>
  return <Badge tone="warning">{t('deliveries.statusPending')}</Badge>
}

/** What happened when events were sent to one subscription, newest first. */
export function WebhookDeliveries() {
  const t = useT()
  const tz = useOfficeZone()
  const eventName = useEventName()
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') ?? '') as WebhookDeliveryStatus | ''
  const page = Number(params.get('page') ?? '1') || 1
  const webhooks = useWebhooks()
  const webhook = webhooks.data?.find((w) => w.id === id)
  const deliveries = useWebhookDeliveries(id, { status: status || undefined, page, pageSize: 20 })

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }
  const when = (iso: string | null | undefined) => (iso ? formatOfficeDateTime(iso, tz) : '—')

  const notFound = deliveries.error instanceof ApiError && deliveries.error.kind === 'not-found'
  if (notFound) return <EmptyState title={t('deliveries.notFound')} />

  return (
    <>
      <PageHeader title={t('deliveries.title')} description={webhook?.url} />
      <p className="mb-4 text-sm">
        <Link to="/admin/webhooks" className="text-brand-700 underline">
          {t('deliveries.back')}
        </Link>
      </p>
      <form className="mb-6 max-w-xs" onSubmit={(e) => e.preventDefault()} role="search">
        <SelectField
          label={t('deliveries.status')}
          value={status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="">{t('deliveries.allStates')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`deliveries.${s.toLowerCase() as 'pending' | 'succeeded' | 'failed'}`)}
            </option>
          ))}
        </SelectField>
      </form>
      {deliveries.isPending && <Skeleton className="h-40" />}
      {deliveries.error && !notFound && (
        <ErrorState message={deliveries.error.message} onRetry={() => void deliveries.refetch()} />
      )}
      {deliveries.data && deliveries.data.items.length === 0 && (
        <EmptyState title={t('deliveries.none')} />
      )}
      {deliveries.data && deliveries.data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {t('deliveries.colEvent')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('deliveries.colStatus')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('deliveries.colAttempts')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('deliveries.colLast')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('deliveries.colResult')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('deliveries.colNext')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {deliveries.data.items.map((d) => (
                  <tr key={d.id} className="border-t border-gray-200 align-top">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-900">
                      {eventName(d.eventType)}
                    </th>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3">{Number(d.attempts)}</td>
                    <td className="px-4 py-3">{when(d.lastAttemptAt)}</td>
                    <td className="px-4 py-3">
                      {d.lastStatusCode != null
                        ? t('deliveries.httpStatus', { code: Number(d.lastStatusCode) })
                        : d.lastAttemptAt
                          ? t('deliveries.noAnswer')
                          : '—'}
                      {d.lastError && <p className="text-gray-500 break-all">{d.lastError}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {d.status === 'Pending' ? when(d.nextAttemptAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={Number(deliveries.data.page)}
            pageSize={Number(deliveries.data.pageSize)}
            totalCount={Number(deliveries.data.totalCount)}
            onChange={(p) => set('page', String(p))}
          />
        </>
      )}
    </>
  )
}
