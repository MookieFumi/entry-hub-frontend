import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  useOfficeZone,
  useRescheduleBooking,
  useRules,
  useSchedule,
  type Booking,
} from '@/api/queries'
import { ApiError } from '@/api/errors'
import { buildSlots, endOptions, isBookableDay, toIso } from '@/lib/slots'
import { addDays, dateInZone, zonedToUtc } from '@/lib/tz'
import { dayEs } from '@/lib/rules-text'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'

/** Moves a booking to another time in the same room. The same rules as a new booking apply. */
export function RescheduleForm({ booking }: { booking: Booking }) {
  const rules = useRules()
  const tz = useOfficeZone()
  const reschedule = useRescheduleBooking()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [date, setDate] = useState(dateInZone(new Date(booking.startAt), tz))
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const from = zonedToUtc(date, '00:00', tz).toISOString()
  const to = zonedToUtc(addDays(date, 1), '00:00', tz).toISOString()
  const schedule = useSchedule(booking.roomId, from, to)
  // The booking itself must not block its own new time.
  const busy = useMemo(
    () => (schedule.data ?? []).filter((e) => e.bookingId !== booking.id),
    [schedule.data, booking.id],
  )
  const slots = useMemo(
    () => (rules.data ? buildSlots(date, rules.data, busy) : []),
    [date, rules.data, busy],
  )
  const startOptions = slots.filter((s) => !s.busy && !s.past)
  const startValue = startOptions.some((s) => s.time === start) ? start : ''
  const ends = useMemo(
    () => (rules.data && startValue ? endOptions(startValue, rules.data, slots) : []),
    [rules.data, startValue, slots],
  )
  const endValue = ends.includes(end) ? end : ''

  if (rules.isPending) return <p className="text-sm text-gray-500">Cargando reglas…</p>
  if (rules.error || !rules.data)
    return <Alert tone="error">No se pudieron cargar las reglas de reserva.</Alert>
  const r = rules.data
  const bookableDay = isBookableDay(date, r)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setFormError(null)
    const errors: Record<string, string> = {}
    if (!startValue) errors.start = 'Elige la hora de inicio.'
    if (!endValue) errors.end = 'Elige la hora de fin.'
    if (Object.keys(errors).length > 0) return setFieldErrors(errors)

    try {
      await reschedule.mutateAsync({
        id: booking.id,
        body: {
          startAt: toIso(date, startValue, r),
          endAt: toIso(date, endValue, r),
          roomId: booking.roomId,
        },
      })
      notify('success', 'Reserva reprogramada.')
      void navigate(`/bookings/${booking.id}`)
    } catch (err) {
      if (!(err instanceof ApiError)) return setFormError('Ha ocurrido un error inesperado.')
      if (err.kind === 'rules-broken') {
        const next: Record<string, string> = {}
        for (const v of err.violations) {
          if (v.code === 'RoomUnavailable') void schedule.refetch()
          else if (
            [
              'TooSoon',
              'TooFarAhead',
              'OutsideOfficeHours',
              'NotOnSlotBoundary',
              'TooLateToReschedule',
            ].includes(v.code)
          )
            next.start = err.message
          else if (['DurationTooShort', 'DurationTooLong'].includes(v.code)) next.end = err.message
        }
        setFieldErrors(next)
        setFormError(err.message)
      } else if (err.kind === 'conflict') {
        void schedule.refetch()
        setFormError('Esa franja se acaba de ocupar. He actualizado la agenda: elige otra.')
      } else if (err.kind === 'validation') {
        const first = Object.values(err.fieldErrors).flat()[0]
        setFormError(first ?? err.message)
      } else setFormError(err.message)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        label="Nuevo día"
        type="date"
        value={date}
        onChange={(e) => {
          if (!e.target.value) return
          setDate(e.target.value)
          setStart('')
          setEnd('')
        }}
      />
      {!bookableDay && (
        <Alert tone="warning">
          Ese día no se puede reservar: la oficina abre de {r.officeDays.map(dayEs).join(', ')}.
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Nueva hora de inicio"
          value={startValue}
          error={fieldErrors.start}
          disabled={!bookableDay}
          onChange={(e) => {
            setStart(e.target.value)
            setEnd('')
          }}
        >
          <option value="">Elige…</option>
          {startOptions.map((s) => (
            <option key={s.time} value={s.time}>
              {s.time}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Nueva hora de fin"
          value={endValue}
          error={fieldErrors.end}
          disabled={!startValue}
          onChange={(e) => setEnd(e.target.value)}
        >
          <option value="">Elige…</option>
          {ends.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
      </div>
      {formError && <Alert tone="error">{formError}</Alert>}
      <Button type="submit" disabled={reschedule.isPending || !bookableDay}>
        {reschedule.isPending ? 'Reprogramando…' : 'Reprogramar'}
      </Button>
    </form>
  )
}
