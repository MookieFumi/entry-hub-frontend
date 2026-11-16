import { Link } from 'react-router'
import { useMe, useMyBookings } from '@/api/queries'
import { BookingRow } from '@/components/BookingRow'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { useT } from '@/i18n'

export function Home() {
  const t = useT()
  const me = useMe()
  const bookings = useMyBookings({ page: 1, pageSize: 50 })
  const upcoming = (bookings.data?.items ?? [])
    .filter(
      (b) => (b.status === 'Confirmed' || b.status === 'Pending') && new Date(b.endAt) > new Date(),
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 3)

  return (
    <>
      <PageHeader
        title={me.data ? t('home.greeting', { tenant: me.data.tenantName }) : t('nav.home')}
        description={t('home.description')}
        actions={
          <div className="flex gap-2">
            <Link to="/search">
              <Button>{t('home.findRoom')}</Button>
            </Link>
            <Link to="/rooms">
              <Button variant="secondary">{t('home.viewRooms')}</Button>
            </Link>
          </div>
        }
      />
      <Card>
        <h2 className="mb-3 font-semibold text-gray-900">{t('home.upcoming')}</h2>
        {bookings.isPending && <Skeleton className="h-20" />}
        {bookings.data && upcoming.length === 0 && (
          <EmptyState title={t('home.noUpcoming')}>{t('home.noUpcomingHint')}</EmptyState>
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
