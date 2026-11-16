import { useSearchParams } from 'react-router'
import { useRooms } from '@/api/queries'
import { FeatureChecklist } from '@/components/FeatureFilter'
import { RoomCard } from '@/components/RoomCard'
import { TextField } from '@/components/ui/Field'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useT } from '@/i18n'

const PAGE_SIZE = 12
const num = (v: string | null) => (v && /^-?\d+$/.test(v) ? Number(v) : undefined)

export function Rooms() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const floor = num(params.get('floor'))
  const minCapacity = num(params.get('minCapacity'))
  const page = num(params.get('page')) ?? 1
  const features = params.get('features')?.split(',').filter(Boolean) ?? []
  const rooms = useRooms({ floor, minCapacity, features, page, pageSize: PAGE_SIZE })

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader title={t('rooms.title')} description={t('rooms.description')} />
      <form
        className="mb-8 grid grid-cols-2 items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 lg:grid-cols-[9rem_9rem_minmax(0,1fr)]"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <TextField
          label={t('rooms.floor')}
          type="number"
          min={-5}
          max={100}
          value={floor ?? ''}
          onChange={(e) => update('floor', e.target.value)}
        />
        <TextField
          label={t('rooms.minCapacity')}
          type="number"
          min={1}
          max={500}
          value={minCapacity ?? ''}
          onChange={(e) => update('minCapacity', e.target.value)}
        />
        <div className="col-span-2 lg:col-span-1">
          <FeatureChecklist
            selected={features}
            valueOf={(f) => f.code}
            onChange={(next) => update('features', next.join(','))}
          />
        </div>
      </form>
      {rooms.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}
      {rooms.error && (
        <ErrorState message={rooms.error.message} onRetry={() => void rooms.refetch()} />
      )}
      {rooms.data && rooms.data.items.length === 0 && (
        <EmptyState title={t('rooms.noneTitle')}>{t('rooms.noneHint')}</EmptyState>
      )}
      {rooms.data && rooms.data.items.length > 0 && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.data.items.map((r) => (
              <li key={r.id}>
                <RoomCard room={r} />
              </li>
            ))}
          </ul>
          <Pagination
            page={Number(rooms.data.page)}
            pageSize={Number(rooms.data.pageSize)}
            totalCount={Number(rooms.data.totalCount)}
            onChange={(p) => {
              const next = new URLSearchParams(params)
              next.set('page', String(p))
              setParams(next)
            }}
          />
        </>
      )}
    </>
  )
}
