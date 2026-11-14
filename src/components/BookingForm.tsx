import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useCreateBooking, useRules, type Room } from '@/api/queries'
import { ApiError } from '@/api/errors'
import { buildSlots, endOptions, isBookableDay, toIso, type ScheduleEntry } from '@/lib/slots'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'

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
  const rules = useRules()
  const create = useCreateBooking()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)
  const [title, setTitle] = useState('')
  const [attendees, setAttendees] = useState('1')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const slots = useMemo(
    () => (rules.data ? buildSlots(date, rules.data, busy) : []),
    [date, rules.data, busy],
  )
  const startOptions = slots.filter((s) => !s.busy && !s.past)
  // Si el inicio o el fin elegidos dejan de ser válidos (cambio de día o de agenda), se tratan como vacíos.
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
    const n = Number(attendees)
    if (!startValue) errors.start = 'Elige la hora de inicio.'
    if (!endValue) errors.end = 'Elige la hora de fin.'
    if (!title.trim()) errors.title = 'Escribe un título.'
    if (title.length > 120) errors.title = 'Como máximo 120 caracteres.'
    if (!Number.isInteger(n) || n < 1 || n > 500) errors.attendees = 'Entre 1 y 500 personas.'
    if (Object.keys(errors).length > 0) return setFieldErrors(errors)

    try {
      const booking = await create.mutateAsync({
        roomId: room.id,
        title: title.trim(),
        startAt: toIso(date, startValue, r),
        endAt: toIso(date, endValue, r),
        attendees: n,
      })
      notify('success', 'Reserva confirmada.')
      void navigate(`/bookings/${booking.id}`)
    } catch (err) {
      if (!(err instanceof ApiError)) return setFormError('Ha ocurrido un error inesperado.')
      if (err.kind === 'rules-broken') {
        const next: Record<string, string> = {}
        for (const v of err.violations) {
          if (v.code === 'ExceedsCapacity') next.attendees = err.message
          else if (v.code === 'RoomUnavailable') onConflict?.()
          else if (
            ['TooSoon', 'TooFarAhead', 'OutsideOfficeHours', 'NotOnSlotBoundary'].includes(v.code)
          )
            next.start = err.message
          else if (['DurationTooShort', 'DurationTooLong'].includes(v.code)) next.end = err.message
        }
        setFieldErrors(next)
        setFormError(err.message)
      } else if (err.kind === 'conflict') {
        onConflict?.()
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
        label="Día"
        type="date"
        value={date}
        onChange={(e) => e.target.value && onDateChange(e.target.value)}
      />
      {!bookableDay && (
        <Alert tone="warning">
          Ese día no se puede reservar: la oficina abre de {r.officeDays.map(dayEs).join(', ')}.
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Hora de inicio"
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
          label="Hora de fin"
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
      <TextField
        label="Título"
        value={title}
        maxLength={120}
        error={fieldErrors.title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextField
        label="Asistentes"
        type="number"
        min={1}
        max={Math.min(500, Number(room.capacity))}
        value={attendees}
        hint={`Capacidad de la sala: ${room.capacity}`}
        error={fieldErrors.attendees}
        onChange={(e) => setAttendees(e.target.value)}
      />
      <p className="text-xs text-gray-500">
        Horas en la zona de la oficina ({r.timeZone}). De {Number(r.minDurationMinutes)} min a{' '}
        {Number(r.maxDurationMinutes) / 60} h, en tramos de {Number(r.slotMinutes)} min.
      </p>
      {formError && <Alert tone="error">{formError}</Alert>}
      <Button type="submit" disabled={create.isPending || !bookableDay}>
        {create.isPending ? 'Reservando…' : 'Reservar'}
      </Button>
    </form>
  )
}

const DAYS_ES: Record<string, string> = {
  Monday: 'lunes',
  Tuesday: 'martes',
  Wednesday: 'miércoles',
  Thursday: 'jueves',
  Friday: 'viernes',
  Saturday: 'sábado',
  Sunday: 'domingo',
}
const dayEs = (d: string) => DAYS_ES[d] ?? d
