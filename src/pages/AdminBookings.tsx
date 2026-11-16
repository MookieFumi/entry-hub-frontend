import { useSearchParams } from 'react-router'
import { useAllBookings, useOfficeZone, useRooms, type BookingStatus } from '@/api/queries'
import { BookingRow } from '@/components/BookingRow'
import { DecideBooking } from '@/components/DecideBooking'
import { CancelBooking } from '@/components/CancelBooking'
import { SelectField, TextField } from '@/components/ui/Field'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { dateInZone, addDays, zonedToUtc } from '@/lib/tz'
import { useT } from '@/i18n'

export function AdminBookings() {
  const t = useT()
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
      <PageHeader title={t('admin.bookings.title')} description={t('admin.bookings.description')} />
      <form
        className="mb-8 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3 sm:p-5"
        onSubmit={(e) => e.preventDefault()}
        role="search"
      >
        <SelectField
          label={t('admin.bookings.room')}
          value={roomId}
          onChange={(e) => set('room', e.target.value)}
        >
          <option value="">{t('admin.bookings.all')}</option>
          {rooms.data?.items.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t('common.day')}
          type="date"
          value={day}
          onChange={(e) => set('date', e.target.value)}
        />
        <SelectField
          label={t('admin.bookings.state')}
          value={status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="">{t('admin.bookings.allStates')}</option>
          <option value="Pending">{t('admin.bookings.pending')}</option>
          <option value="Confirmed">{t('admin.bookings.confirmed')}</option>
          <option value="Cancelled">{t('admin.bookings.cancelled')}</option>
        </SelectField>
      </form>
      {bookings.isPending && <Skeleton className="h-40" />}
      {bookings.error && (
        <ErrorState message={bookings.error.message} onRetry={() => void bookings.refetch()} />
      )}
      {bookings.data && bookings.data.items.length === 0 && (
        <EmptyState title={t('admin.bookings.none')} />
      )}
      {bookings.data && bookings.data.items.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {bookings.data.items.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                roomName={names.get(b.roomId)}
                actions={
                  <>
                    <DecideBooking booking={b} />
                    <CancelBooking booking={b} />
                  </>
                }
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
