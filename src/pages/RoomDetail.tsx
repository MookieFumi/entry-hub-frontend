import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useRoom, useRules, useSchedule } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { BookingForm } from '@/components/BookingForm'
import { Badge } from '@/components/ui/Badge'
import { Alert, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { useRoomOccupancy } from '@/hooks/useRoomOccupancy'
import { formatOfficeTime } from '@/lib/dates'
import { addDays, dateInZone, zonedToUtc } from '@/lib/tz'

function Occupancy({ roomId }: { roomId: string }) {
  const { occupancy, connected } = useRoomOccupancy(roomId)
  if (!occupancy) return <Badge>{connected ? 'Sin datos' : 'Conectando…'}</Badge>
  const until = occupancy.nextChange ? ` hasta las ${formatOfficeTime(occupancy.nextChange)}` : ''
  return occupancy.status === 'Free' ? (
    <Badge tone="success">Libre ahora{until}</Badge>
  ) : (
    <Badge tone="error">Ocupada ahora{until}</Badge>
  )
}

export function RoomDetail() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const room = useRoom(id)
  const rules = useRules()
  const tz = rules.data?.timeZone ?? 'Europe/Madrid'
  const [date, setDate] = useState(params.get('date') ?? dateInZone(new Date(), tz))
  const from = zonedToUtc(date, '00:00', tz).toISOString()
  const to = zonedToUtc(addDays(date, 1), '00:00', tz).toISOString()
  const schedule = useSchedule(id, from, to)

  if (room.isPending) return <Skeleton className="h-40" />
  if (room.error instanceof ApiError && room.error.kind === 'not-found') {
    return (
      <EmptyState
        title="Sala no encontrada"
        action={
          <Link className="text-brand-700 underline" to="/rooms">
            Volver a las salas
          </Link>
        }
      >
        Puede que no exista o que no tengas acceso a ella.
      </EmptyState>
    )
  }
  if (room.error)
    return <ErrorState message={room.error.message} onRetry={() => void room.refetch()} />
  const r = room.data

  return (
    <>
      <PageHeader
        title={r.name}
        description={`Planta ${r.floor} · hasta ${r.capacity} personas`}
        actions={<Occupancy roomId={id} />}
      />
      {!r.isActive && (
        <div className="mb-4">
          <Alert tone="warning">Esta sala está desactivada y no admite reservas nuevas.</Alert>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-gray-900">Reservar</h2>
          {r.isActive ? (
            <BookingForm
              room={r}
              date={date}
              onDateChange={setDate}
              busy={schedule.data ?? []}
              initialStart={params.get('start') ?? ''}
              initialEnd={params.get('end') ?? ''}
              onConflict={() => void schedule.refetch()}
            />
          ) : (
            <p className="text-sm text-gray-500">No disponible.</p>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-gray-900">Ocupación del día</h2>
          {schedule.isPending && <Skeleton className="h-24" />}
          {schedule.error && (
            <ErrorState message={schedule.error.message} onRetry={() => void schedule.refetch()} />
          )}
          {schedule.data && schedule.data.length === 0 && (
            <p className="text-sm text-gray-600">Sin reservas este día.</p>
          )}
          {schedule.data && schedule.data.length > 0 && (
            <ul className="flex flex-col gap-2">
              {schedule.data.map((s, i) => (
                <li
                  key={s.bookingId ?? i}
                  className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                >
                  <span>
                    {formatOfficeTime(s.startAt)} – {formatOfficeTime(s.endAt)}
                    {s.title ? ` · ${s.title}` : ''}
                  </span>
                  {s.isMine && <Badge tone="brand">Tuya</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
