import { useSearchParams } from 'react-router'
import { useRooms } from '@/api/queries'
import { RoomCard } from '@/components/RoomCard'
import { TextField } from '@/components/ui/Field'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'

const PAGE_SIZE = 12
const num = (v: string | null) => (v && /^-?\d+$/.test(v) ? Number(v) : undefined)

export function Rooms() {
  const [params, setParams] = useSearchParams()
  const floor = num(params.get('floor'))
  const minCapacity = num(params.get('minCapacity'))
  const page = num(params.get('page')) ?? 1
  const rooms = useRooms({ floor, minCapacity, page, pageSize: PAGE_SIZE })

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader title="Salas" description="Encuentra una sala y reserva una franja." />
      <form
        className="mb-6 grid gap-4 sm:grid-cols-2"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <TextField
          label="Planta"
          type="number"
          min={-5}
          max={100}
          value={floor ?? ''}
          onChange={(e) => update('floor', e.target.value)}
        />
        <TextField
          label="Capacidad mínima"
          type="number"
          min={1}
          max={500}
          value={minCapacity ?? ''}
          onChange={(e) => update('minCapacity', e.target.value)}
        />
      </form>
      {rooms.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      {rooms.error && (
        <ErrorState message={rooms.error.message} onRetry={() => void rooms.refetch()} />
      )}
      {rooms.data && rooms.data.items.length === 0 && (
        <EmptyState title="No hay salas con esos filtros">
          Prueba con otra planta o una capacidad menor.
        </EmptyState>
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
