import { useSearchParams } from 'react-router'
import { useAudit, useOfficeZone } from '@/api/queries'
import { SelectField, TextField } from '@/components/ui/Field'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useCatalogName } from '@/hooks/useCatalogName'
import { formatOfficeDateTime } from '@/lib/dates'
import { addDays, zonedToUtc } from '@/lib/tz'
import { useT } from '@/i18n'

const ENTITY_TYPES = ['Booking', 'Room', 'Site', 'Rules', 'Feature', 'SiteHoliday', 'RoomBlock']

/** Facilities read the audit trail: who changed what and when, newest first. */
export function AdminAudit() {
  const t = useT()
  const tz = useOfficeZone()
  const action = useCatalogName('audit.action')
  const entity = useCatalogName('audit.entity')
  const [params, setParams] = useSearchParams()
  const entityType = params.get('type') ?? ''
  const actorId = params.get('actor') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const page = Number(params.get('page') ?? '1') || 1

  const audit = useAudit({
    entityType: entityType || undefined,
    actorId: actorId || undefined,
    from: from ? zonedToUtc(from, '00:00', tz).toISOString() : undefined,
    to: to ? zonedToUtc(addDays(to, 1), '00:00', tz).toISOString() : undefined,
    page,
    pageSize: 25,
  })

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader title={t('audit.title')} description={t('audit.description')} />
      <form
        className="mb-6 grid gap-4 sm:grid-cols-4"
        onSubmit={(e) => e.preventDefault()}
        role="search"
      >
        <SelectField
          label={t('audit.type')}
          value={entityType}
          onChange={(e) => set('type', e.target.value)}
        >
          <option value="">{t('audit.allTypes')}</option>
          {ENTITY_TYPES.map((x) => (
            <option key={x} value={x}>
              {entity(x)}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t('audit.actor')}
          value={actorId}
          onChange={(e) => set('actor', e.target.value.trim())}
        />
        <TextField
          label={t('audit.from')}
          type="date"
          value={from}
          onChange={(e) => set('from', e.target.value)}
        />
        <TextField
          label={t('audit.to')}
          type="date"
          value={to}
          onChange={(e) => set('to', e.target.value)}
        />
      </form>
      {audit.isPending && <Skeleton className="h-40" />}
      {audit.error && (
        <ErrorState message={audit.error.message} onRetry={() => void audit.refetch()} />
      )}
      {audit.data && audit.data.items.length === 0 && <EmptyState title={t('audit.none')} />}
      {audit.data && audit.data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {t('audit.colAt')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('audit.colActor')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('audit.colAction')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('audit.colType')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('audit.colSummary')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {audit.data.items.map((a) => (
                  <tr key={a.id} className="border-t border-gray-200 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatOfficeDateTime(a.at, tz)}
                    </td>
                    <td className="px-4 py-3 break-all">{a.actorId}</td>
                    <td className="px-4 py-3">{action(a.action)}</td>
                    <td className="px-4 py-3">{entity(a.entityType)}</td>
                    <td className="px-4 py-3">{a.summary ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={Number(audit.data.page)}
            pageSize={Number(audit.data.pageSize)}
            totalCount={Number(audit.data.totalCount)}
            onChange={(p) => set('page', String(p))}
          />
        </>
      )}
    </>
  )
}
