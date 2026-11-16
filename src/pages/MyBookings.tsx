import { Tabs } from '@base-ui/react/tabs'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMyBookings, type Booking } from '@/api/queries'
import { BookingRow } from '@/components/BookingRow'
import { CancelBooking } from '@/components/CancelBooking'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { useT } from '@/i18n'

const tabClass =
  'nums -mb-px border-b-[3px] border-transparent px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:text-gray-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 data-[active]:border-brand-600 data-[active]:text-brand-800'

export function MyBookings() {
  const t = useT()
  const bookings = useMyBookings({ includeCancelled: true, page: 1, pageSize: 100 })
  const [now] = useState(() => Date.now())
  const [params] = useSearchParams()
  const seriesId = params.get('series')
  const groups = useMemo(() => {
    const all = bookings.data?.items ?? []
    const items = seriesId ? all.filter((b) => b.seriesId === seriesId) : all
    const byStart = (a: Booking, b: Booking) => a.startAt.localeCompare(b.startAt)
    return {
      upcoming: items
        .filter(
          (b) =>
            (b.status === 'Confirmed' || b.status === 'Pending') &&
            new Date(b.endAt).getTime() > now,
        )
        .sort(byStart),
      past: items
        .filter((b) => b.status === 'Confirmed' && new Date(b.endAt).getTime() <= now)
        .sort((a, b) => byStart(b, a)),
      cancelled: items.filter((b) => b.status === 'Cancelled').sort((a, b) => byStart(b, a)),
    }
  }, [bookings.data, now, seriesId])

  if (bookings.isPending) return <Skeleton className="h-40" />
  if (bookings.error)
    return (
      <>
        <PageHeader title={t('bookings.title')} />
        <ErrorState message={bookings.error.message} onRetry={() => void bookings.refetch()} />
      </>
    )

  const panel = (list: Booking[], empty: string, cancellable = false) =>
    list.length === 0 ? (
      <EmptyState title={empty} />
    ) : (
      <ul className="flex flex-col gap-3">
        {list.map((b) => (
          <BookingRow
            key={b.id}
            booking={b}
            actions={cancellable ? <CancelBooking booking={b} /> : undefined}
          />
        ))}
      </ul>
    )

  return (
    <>
      <PageHeader title={t('bookings.title')} />
      {seriesId && (
        <p className="mb-4 text-sm text-gray-600">
          {t('series.filtered')}{' '}
          <Link to="/bookings" className="text-brand-700 underline">
            {t('series.clearFilter')}
          </Link>
        </p>
      )}
      <Tabs.Root defaultValue="upcoming">
        <Tabs.List className="mb-5 flex overflow-x-auto border-b border-gray-300">
          <Tabs.Tab value="upcoming" className={tabClass}>
            {t('bookings.tabUpcoming', { count: groups.upcoming.length })}
          </Tabs.Tab>
          <Tabs.Tab value="past" className={tabClass}>
            {t('bookings.tabPast', { count: groups.past.length })}
          </Tabs.Tab>
          <Tabs.Tab value="cancelled" className={tabClass}>
            {t('bookings.tabCancelled', { count: groups.cancelled.length })}
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="upcoming">
          {panel(groups.upcoming, t('bookings.noneUpcoming'), true)}
        </Tabs.Panel>
        <Tabs.Panel value="past">{panel(groups.past, t('bookings.nonePast'))}</Tabs.Panel>
        <Tabs.Panel value="cancelled">
          {panel(groups.cancelled, t('bookings.noneCancelled'))}
        </Tabs.Panel>
      </Tabs.Root>
      {Number(bookings.data.totalCount) > 100 && (
        <p className="nums mt-4 text-sm text-gray-600">
          {t('bookings.truncated', { total: Number(bookings.data.totalCount) })}
        </p>
      )}
    </>
  )
}
