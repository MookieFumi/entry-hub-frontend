import { Link, useSearchParams } from 'react-router'
import { useAvailability, useOfficeZone } from '@/api/queries'
import { FeatureChecklist } from '@/components/FeatureFilter'
import { RoomCard } from '@/components/RoomCard'
import { buttonClass } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Alert, EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui/Feedback'
import { dateInZone, zonedToUtc } from '@/lib/tz'
import { useT } from '@/i18n'

export function Search() {
  const t = useT()
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
      <PageHeader title={t('search.title')} description={t('search.description')} />
      <form
        className="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-6"
        onSubmit={(e) => e.preventDefault()}
        role="search"
      >
        <TextField
          label={t('common.day')}
          type="date"
          value={date}
          onChange={(e) => set('date', e.target.value)}
        />
        <TextField
          label={t('search.from')}
          type="time"
          step={900}
          value={start}
          onChange={(e) => set('start', e.target.value)}
        />
        <TextField
          label={t('search.to')}
          type="time"
          step={900}
          value={end}
          onChange={(e) => set('end', e.target.value)}
        />
        <TextField
          label={t('form.attendees')}
          type="number"
          min={1}
          max={500}
          value={attendees}
          onChange={(e) => set('attendees', e.target.value)}
        />
        <TextField
          label={t('rooms.floor')}
          type="number"
          value={floor}
          onChange={(e) => set('floor', e.target.value)}
        />
        <TextField
          label={t('rooms.minCapacity')}
          type="number"
          min={1}
          value={minCapacity}
          onChange={(e) => set('minCapacity', e.target.value)}
        />
        <div className="col-span-2 sm:col-span-3 lg:col-span-6">
          <FeatureChecklist
            selected={features}
            valueOf={(f) => f.code}
            onChange={(next) => set('features', next.join(','))}
          />
        </div>
      </form>
      {!valid && <Alert>{t('search.hint')}</Alert>}
      {valid && result.isPending && <Spinner label={t('search.searching')} />}
      {result.error && (
        <ErrorState message={result.error.message} onRetry={() => void result.refetch()} />
      )}
      {result.data && result.data.length === 0 && (
        <EmptyState title={t('search.noneTitle')}>{t('search.noneHint')}</EmptyState>
      )}
      {result.data && result.data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((room) => (
            <li key={room.id}>
              <RoomCard
                room={room}
                action={
                  <Link
                    className={buttonClass('primary')}
                    to={`/rooms/${room.id}?date=${date}&start=${start}&end=${end}`}
                  >
                    {t('search.bookSlot')}
                  </Link>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
