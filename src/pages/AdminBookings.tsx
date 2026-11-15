import { useSearchParams } from 'react-router'
import { useAllBookings, useOfficeZone, useRooms, type BookingStatus } from '@/api/queries'
import { BookingRow } from '@/components/BookingRow'
import { CancelBooking } from '@/components/CancelBooking'
import { SelectField, TextField } from '@/components/ui/Field'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { dateInZone, addDays, zonedToUtc } from '@/lib/tz'

export function AdminBookings() {
  const tz = useOfficeZone()
  const [params, setParams] = useSearchParams()
  const roomId = params.get('room') ?? ''
  const status = (params.get('status') ?? '') as BookingStatus | ''
  const day = params.get('date') ?? ''
  const page = Number(params.get('page') ?? '1') || 1
  const rooms = useRooms({ includeInactive: true, pageSize: 100 })
  const names = new Map(rooms.data?.items.map((r) => [r.id, r.name]))

  const bookings = useAllBookings(
    {
      roomId: roomId || undefined,
      status: status || undefined,
      from: day ? zonedToUtc(day, '00:00', tz).toISOString() : undefined,
      to: day
        ? zonedToUtc(addDays(day || dateInZone(new Date(), tz), 1), '00:00', tz).toISOString()
        : undefined,
      page,
      pageSize: 20,
    },
    true,
  )

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader title="Reservas de todos" description="Visible solo para Facilities." />
      <form
        className="mb-6 grid gap-4 sm:grid-cols-3"
        onSubmit={(e) => e.preventDefault()}
        role="search"
      >
        <SelectField label="Sala" value={roomId} onChange={(e) => set('room', e.target.value)}>
          <option value="">Todas</option>
          {rooms.data?.items.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Día"
          type="date"
          value={day}
          onChange={(e) => set('date', e.target.value)}
        />
        <SelectField label="Estado" value={status} onChange={(e) => set('status', e.target.value)}>
          <option value="">Todos</option>
          <option value="Confirmed">Confirmadas</option>
          <option value="Cancelled">Canceladas</option>
        </SelectField>
      </form>
      {bookings.isPending && <Skeleton className="h-40" />}
      {bookings.error && (
        <ErrorState message={bookings.error.message} onRetry={() => void bookings.refetch()} />
      )}
      {bookings.data && bookings.data.items.length === 0 && (
        <EmptyState title="No hay reservas con esos filtros" />
      )}
      {bookings.data && bookings.data.items.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {bookings.data.items.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                roomName={names.get(b.roomId)}
                actions={<CancelBooking booking={b} />}
              />
            ))}
          </ul>
          <Pagination
            page={Number(bookings.data.page)}
            pageSize={Number(bookings.data.pageSize)}
            totalCount={Number(bookings.data.totalCount)}
            onChange={(p) => set('page', String(p))}
          />
        </>
      )}
    </>
  )
}
