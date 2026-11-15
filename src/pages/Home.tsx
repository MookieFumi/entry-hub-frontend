import { Link } from 'react-router'
import { useMe, useMyBookings } from '@/api/queries'
import { BookingRow } from '@/components/BookingRow'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState, PageHeader, Skeleton } from '@/components/ui/Feedback'

export function Home() {
  const me = useMe()
  const bookings = useMyBookings({ page: 1, pageSize: 50 })
  const upcoming = (bookings.data?.items ?? [])
    .filter((b) => b.status === 'Confirmed' && new Date(b.endAt) > new Date())
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 3)

  return (
    <>
      <PageHeader
        title={me.data ? `Hola, ${me.data.tenantName}` : 'Inicio'}
        description="Reserva una sala o consulta tus próximas reuniones."
        actions={
          <div className="flex gap-2">
            <Link to="/search">
              <Button>Buscar sala libre</Button>
            </Link>
            <Link to="/rooms">
              <Button variant="secondary">Ver salas</Button>
            </Link>
          </div>
        }
      />
      <Card>
        <h2 className="mb-3 font-semibold text-gray-900">Tus próximas reservas</h2>
        {bookings.isPending && <Skeleton className="h-20" />}
        {bookings.data && upcoming.length === 0 && (
          <EmptyState title="No tienes reservas próximas">
            Busca una sala libre y reserva en un minuto.
          </EmptyState>
        )}
        {upcoming.length > 0 && (
          <ul className="flex flex-col gap-3">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
