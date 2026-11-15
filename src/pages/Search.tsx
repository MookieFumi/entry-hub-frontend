import { Link, useSearchParams } from 'react-router'
import { useAvailability, useOfficeZone } from '@/api/queries'
import { FeatureChecklist } from '@/components/FeatureFilter'
import { RoomCard } from '@/components/RoomCard'
import { TextField } from '@/components/ui/Field'
import { Alert, EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui/Feedback'
import { dateInZone, zonedToUtc } from '@/lib/tz'

export function Search() {
  const tz = useOfficeZone()
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? dateInZone(new Date(), tz)
  const start = params.get('start') ?? ''
  const end = params.get('end') ?? ''
  const attendees = params.get('attendees') ?? ''
  const floor = params.get('floor') ?? ''
  const minCapacity = params.get('minCapacity') ?? ''
  const features = params.get('features')?.split(',').filter(Boolean) ?? []
  const valid = Boolean(date && start && end && end > start)

  const result = useAvailability(
    valid
      ? {
          from: zonedToUtc(date, start, tz).toISOString(),
          to: zonedToUtc(date, end, tz).toISOString(),
          attendees: attendees ? Number(attendees) : undefined,
          floor: floor ? Number(floor) : undefined,
          minCapacity: minCapacity ? Number(minCapacity) : undefined,
          features,
        }
      : null,
  )

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Buscar disponibilidad"
        description="Salas libres en una franja concreta."
      />
      <form
        className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5"
        onSubmit={(e) => e.preventDefault()}
        role="search"
      >
        <TextField
          label="Día"
          type="date"
          value={date}
          onChange={(e) => set('date', e.target.value)}
        />
        <TextField
          label="Desde"
          type="time"
          step={900}
          value={start}
          onChange={(e) => set('start', e.target.value)}
        />
        <TextField
          label="Hasta"
          type="time"
          step={900}
          value={end}
          onChange={(e) => set('end', e.target.value)}
        />
        <TextField
          label="Asistentes"
          type="number"
          min={1}
          max={500}
          value={attendees}
          onChange={(e) => set('attendees', e.target.value)}
        />
        <TextField
          label="Planta"
          type="number"
          value={floor}
          onChange={(e) => set('floor', e.target.value)}
        />
        <TextField
          label="Capacidad mínima"
          type="number"
          min={1}
          value={minCapacity}
          onChange={(e) => set('minCapacity', e.target.value)}
        />
        <div className="sm:col-span-3 lg:col-span-5">
          <FeatureChecklist
            selected={features}
            valueOf={(f) => f.code}
            onChange={(next) => set('features', next.join(','))}
          />
        </div>
      </form>
      {!valid && <Alert>Elige día, hora de inicio y hora de fin para ver las salas libres.</Alert>}
      {valid && result.isPending && <Spinner label="Buscando salas" />}
      {result.error && (
        <ErrorState message={result.error.message} onRetry={() => void result.refetch()} />
      )}
      {result.data && result.data.length === 0 && (
        <EmptyState title="Ninguna sala libre en esa franja">
          Prueba con otra hora, otra planta o con menos asistentes.
        </EmptyState>
      )}
      {result.data && result.data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((room) => (
            <li key={room.id} className="flex flex-col gap-2">
              <RoomCard room={room} />
              <Link
                className="text-sm font-medium text-brand-700 underline"
                to={`/rooms/${room.id}?date=${date}&start=${start}&end=${end}`}
              >
                Reservar esta franja
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
