import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useCreateBooking, useMe, useRules, type Room } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { describeRules, dayName } from '@/lib/rules-text'
import { buildSlots, endOptions, isBookableDay, toIso, type ScheduleEntry } from '@/lib/slots'
import { RepeatSection } from '@/components/RepeatSection'
import { buildRecurrence, noRepeat, type RepeatErrors, type RepeatValue } from '@/lib/recurrence'
import { ClosedDaysNotice } from '@/components/ClosedDaysNotice'
import { useClosedDays } from '@/hooks/useClosedDays'
import { useIdempotencyKey } from '@/hooks/useIdempotencyKey'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'
import { useT } from '@/i18n'

type Props = {
  room: Room
  date: string
  onDateChange: (date: string) => void
  busy: ScheduleEntry[]
  initialStart?: string
  initialEnd?: string
  onConflict?: () => void
}

export function BookingForm({
  room,
  date,
  onDateChange,
  busy,
  initialStart = '',
  initialEnd = '',
  onConflict,
}: Props) {
  const t = useT()
  const rules = useRules()
  const me = useMe()
  const closedDays = useClosedDays(room.siteId)
  const create = useCreateBooking()
  const idempotencyKey = useIdempotencyKey()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)
  const [title, setTitle] = useState('')
  const [attendees, setAttendees] = useState('1')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [onBehalf, setOnBehalf] = useState('')
  const [repeat, setRepeat] = useState<RepeatValue>(noRepeat)
  const [repeatErrors, setRepeatErrors] = useState<RepeatErrors>({})

  const slots = useMemo(
    () => (rules.data ? buildSlots(date, rules.data, busy) : []),
    [date, rules.data, busy],
  )
  const startOptions = slots.filter((s) => !s.busy && !s.past)
  // If the chosen start or end stops being valid (the day or the schedule changed), treat it as empty.
  const startValue = startOptions.some((s) => s.time === start) ? start : ''
  const ends = useMemo(
    () => (rules.data && startValue ? endOptions(startValue, rules.data, slots) : []),
    [rules.data, startValue, slots],
  )
  const endValue = ends.includes(end) ? end : ''

  if (rules.isPending) return <p className="text-sm text-gray-500">{t('common.rulesLoading')}</p>
  if (rules.error || !rules.data) return <Alert tone="error">{t('common.rulesFailed')}</Alert>
  const r = rules.data
  const openWeekday = isBookableDay(date, r)
  const closedToday = closedDays.data?.some((h) => h.date === date) ?? false
  const bookableDay = openWeekday && !closedToday
  const isFacilities = me.data?.role === 'Facilities'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setFormError(null)
    const errors: Record<string, string> = {}
    const n = Number(attendees)
    if (!startValue) errors.start = t('common.chooseStart')
    if (!endValue) errors.end = t('common.chooseEnd')
    if (!title.trim()) errors.title = t('form.titleRequired')
    if (title.length > 120) errors.title = t('form.titleTooLong')
    if (!Number.isInteger(n) || n < 1 || n > 500) errors.attendees = t('form.attendeesRange')
    if (onBehalf.trim().length > 200) errors.onBehalf = t('form.onBehalfTooLong')
    const built = buildRecurrence(repeat, date)
    setRepeatErrors(built.errors)
    if (Object.keys(errors).length > 0 || Object.keys(built.errors).length > 0)
      return setFieldErrors(errors)

    try {
      const body = {
        roomId: room.id,
        title: title.trim(),
        startAt: toIso(date, startValue, r),
        endAt: toIso(date, endValue, r),
        attendees: n,
        ...(built.recurrence ? { recurrence: built.recurrence } : {}),
        ...(isFacilities && onBehalf.trim() ? { onBehalfOf: onBehalf.trim() } : {}),
      }
      const booking = await create.mutateAsync({ body, idempotencyKey: idempotencyKey(body) })
      notify('success', t('form.bookedToast'))
      void navigate(`/bookings/${booking.id}`, { state: { series: booking.series ?? null } })
    } catch (err) {
      if (!(err instanceof ApiError)) return setFormError(t('common.unexpected'))
      if (err.kind === 'rules-broken') {
        const next: Record<string, string> = {}
        for (const v of err.violations) {
          if (v.code === 'ExceedsCapacity') next.attendees = err.message
          else if (v.code === 'InvalidRecurrence') next.repeat = err.message
          else if (v.code === 'RoomUnavailable' || v.code === 'RoomAlreadyBooked') onConflict?.()
          else if (
            [
              'TooSoon',
              'TooFarAhead',
              'OutsideOfficeHours',
              'NotOnSlotBoundary',
              'SiteClosed',
              'RoomBlocked',
              'NonexistentLocalTime',
            ].includes(v.code)
          )
            next.start = err.message
          else if (['DurationTooShort', 'DurationTooLong'].includes(v.code)) next.end = err.message
        }
        setFieldErrors(next)
        setFormError(err.message)
      } else if (err.kind === 'conflict') {
        onConflict?.()
        setFormError(t('common.slotTaken'))
      } else if (err.kind === 'validation') {
        const first = Object.values(err.fieldErrors).flat()[0]
        setFormError(first ?? err.message)
      } else setFormError(err.message)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t('form.date')}
        type="date"
        value={date}
        onChange={(e) => e.target.value && onDateChange(e.target.value)}
      />
      {room.requiresApproval && me.data?.role !== 'Facilities' && (
        <Alert tone="info">{t('room.needsApproval')}</Alert>
      )}
      {(Number(room.bufferBeforeMinutes) > 0 || Number(room.bufferAfterMinutes) > 0) && (
        <p className="text-sm text-gray-500">
          {t('room.buffersNotice', {
            before: Number(room.bufferBeforeMinutes),
            after: Number(room.bufferAfterMinutes),
          })}
        </p>
      )}
      {!openWeekday && (
        <Alert tone="warning">
          {t('common.closedDay', { days: r.officeDays.map(dayName).join(', ') })}
        </Alert>
      )}
      <ClosedDaysNotice holidays={closedDays.data ?? []} date={date} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t('form.start')}
          value={startValue}
          error={fieldErrors.start}
          disabled={!bookableDay}
          onChange={(e) => {
            setStart(e.target.value)
            setEnd('')
          }}
        >
          <option value="">{t('common.choose')}</option>
          {startOptions.map((s) => (
            <option key={s.time} value={s.time}>
              {s.time}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('form.end')}
          value={endValue}
          error={fieldErrors.end}
          disabled={!startValue}
          onChange={(e) => setEnd(e.target.value)}
        >
          <option value="">{t('common.choose')}</option>
          {ends.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField
        label={t('form.title')}
        value={title}
        maxLength={120}
        error={fieldErrors.title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextField
        label={t('form.attendees')}
        type="number"
        min={1}
        max={Math.min(500, Number(room.capacity))}
        value={attendees}
        hint={t('form.roomCapacity', { capacity: room.capacity })}
        error={fieldErrors.attendees}
        onChange={(e) => setAttendees(e.target.value)}
      />
      {isFacilities && (
        <TextField
          label={t('form.onBehalf')}
          value={onBehalf}
          hint={t('form.onBehalfHint')}
          error={fieldErrors.onBehalf}
          onChange={(e) => setOnBehalf(e.target.value)}
        />
      )}
      <RepeatSection
        value={repeat}
        onChange={setRepeat}
        errors={repeatErrors}
        serverError={fieldErrors.repeat}
      />
      <details className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <summary className="cursor-pointer font-medium text-gray-700">
          {t('form.rulesSummary')}
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {describeRules(r).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
      {formError && <Alert tone="error">{formError}</Alert>}
      <Button type="submit" disabled={create.isPending || !bookableDay}>
        {create.isPending ? t('form.booking') : t('room.book')}
      </Button>
    </form>
  )
}
