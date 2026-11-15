import { Tabs } from '@base-ui/react/tabs'
import { useMemo, useState } from 'react'
import { useMyBookings, type Booking } from '@/api/queries'
import { BookingRow } from '@/components/BookingRow'
import { CancelBooking } from '@/components/CancelBooking'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { useT } from '@/i18n'

const tabClass =
  'px-4 py-2 text-sm font-medium text-gray-600 data-[selected]:border-b-2 data-[selected]:border-brand-600 data-[selected]:text-brand-700'

export function MyBookings() {
  const t = useT()
  const bookings = useMyBookings({ includeCancelled: true, page: 1, pageSize: 100 })
  const [now] = useState(() => Date.now())
  const groups = useMemo(() => {
    const items = bookings.data?.items ?? []
    const byStart = (a: Booking, b: Booking) => a.startAt.localeCompare(b.startAt)
    return {
      upcoming: items
        .filter((b) => b.status === 'Confirmed' && new Date(b.endAt).getTime() > now)
        .sort(byStart),
      past: items
        .filter((b) => b.status === 'Confirmed' && new Date(b.endAt).getTime() <= now)
        .sort((a, b) => byStart(b, a)),
      cancelled: items.filter((b) => b.status === 'Cancelled').sort((a, b) => byStart(b, a)),
    }
  }, [bookings.data, now])

  if (bookings.isPending) return <Skeleton className="h-40" />
  if (bookings.error)
    return <ErrorState message={bookings.error.message} onRetry={() => void bookings.refetch()} />

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
      <Tabs.Root defaultValue="upcoming">
        <Tabs.List className="mb-4 flex border-b border-gray-200">
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
        <p className="mt-4 text-sm text-gray-500">
          {t('bookings.truncated', { total: Number(bookings.data.totalCount) })}
        </p>
      )}
    </>
  )
}
