import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, mockApi, page, renderApp, room, rules } from '@/test/server'

vi.mock('@/hooks/useRoomOccupancy', () => ({
  useRoomOccupancy: () => ({ occupancy: null, connected: false }),
}))

afterEach(() => vi.unstubAllGlobals())

const roomPath = `/api/v1/rooms/${room.id}`

const created = {
  id: 'b1',
  roomId: room.id,
  organizerId: 'u1',
  title: 'Planning',
  startAt: '2030-01-14T09:00:00Z',
  endAt: '2030-01-14T10:00:00Z',
  attendees: 1,
  status: 'Confirmed',
  createdAt: '2030-01-01T00:00:00Z',
  cancelledAt: null,
}

const base = (extra = {}) => ({
  'GET /api/v1/me': () => json(meEmployee),
  'GET /api/v1/rules': () => json(rules),
  [`GET ${roomPath}`]: () => json(room),
  [`GET ${roomPath}/schedule`]: () => json([]),
  'GET /api/v1/bookings/b1': () => json(created),
  ...extra,
})

async function fillBasics() {
  await screen.findByRole('heading', { name: 'Sala Gaudí' })
  await waitFor(() => expect(screen.getByLabelText('Hora de inicio')).toBeEnabled())
  await userEvent.selectOptions(screen.getByLabelText('Hora de inicio'), '10:00')
  await userEvent.selectOptions(screen.getByLabelText('Hora de fin'), '11:00')
  await userEvent.type(screen.getByLabelText('Título'), 'Planning')
}

describe('repeat a booking', () => {
  it('sends the recurrence with the booking', async () => {
    const { calls } = mockApi(base({ 'POST /api/v1/bookings': () => json(created, 201) }))
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await fillBasics()
    await userEvent.selectOptions(screen.getByLabelText('Repetir'), 'Weekly')
    await userEvent.clear(screen.getByLabelText('Número de reservas (con la primera)'))
    await userEvent.type(screen.getByLabelText('Número de reservas (con la primera)'), '3')
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    await waitFor(() => {
      const body = calls.find((c) => c.key === 'POST /api/v1/bookings')?.body as {
        recurrence?: unknown
      }
      expect(body.recurrence).toEqual({ frequency: 'Weekly', interval: 1, count: 3 })
    })
  })

  it('sends no recurrence by default', async () => {
    const { calls } = mockApi(base({ 'POST /api/v1/bookings': () => json(created, 201) }))
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await fillBasics()
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /api/v1/bookings')).toBe(true))
    const body = calls.find((c) => c.key === 'POST /api/v1/bookings')?.body as object
    expect(body).not.toHaveProperty('recurrence')
  })

  it('validates the options before sending', async () => {
    const { calls } = mockApi(base())
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await fillBasics()
    await userEvent.selectOptions(screen.getByLabelText('Repetir'), 'Daily')
    await userEvent.clear(screen.getByLabelText('Número de reservas (con la primera)'))
    await userEvent.type(screen.getByLabelText('Número de reservas (con la primera)'), '99')
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect(await screen.findByText(/entre 2 y 52/)).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'POST /api/v1/bookings')).toBe(false)
  })

  it('shows InvalidRecurrence on the repeat section', async () => {
    mockApi(
      base({
        'POST /api/v1/bookings': () =>
          json({ title: 'Rules', violations: [{ code: 'InvalidRecurrence', message: 'x' }] }, 422),
      }),
    )
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await fillBasics()
    await userEvent.selectOptions(screen.getByLabelText('Repetir'), 'Weekly')
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    const messages = await screen.findAllByText(/La repetición no es válida/)
    expect(messages.length).toBeGreaterThan(0)
  })
})

describe('series of bookings', () => {
  const outcome = {
    id: 's1',
    requested: 3,
    created: 2,
    occurrences: [
      {
        position: 1,
        startAt: '2030-01-14T09:00:00Z',
        endAt: '2030-01-14T10:00:00Z',
        bookingId: 'b1',
        violations: [],
      },
      {
        position: 2,
        startAt: '2030-01-21T09:00:00Z',
        endAt: '2030-01-21T10:00:00Z',
        bookingId: null,
        violations: [{ code: 'SiteClosed', message: 'x' }],
      },
      {
        position: 3,
        startAt: '2030-01-28T09:00:00Z',
        endAt: '2030-01-28T10:00:00Z',
        bookingId: 'b3',
        violations: [],
      },
    ],
  }

  it('summarizes the outcome after creating a series', async () => {
    mockApi(
      base({
        'POST /api/v1/bookings': () =>
          json({ ...created, seriesId: 's1', seriesPosition: 1, series: outcome }, 201),
      }),
    )
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await fillBasics()
    await userEvent.selectOptions(screen.getByLabelText('Repetir'), 'Weekly')
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect(await screen.findByText('Se han reservado 2 de 3 repeticiones.')).toBeInTheDocument()
    expect(screen.getByText(/La sede está cerrada ese día/)).toBeInTheDocument()
  })

  it('shows the position in the series and filters My bookings by series', async () => {
    const inSeries = { ...created, seriesId: 's1', seriesPosition: 2 }
    const other = { ...created, id: 'b9', title: 'Other thing' }
    mockApi(
      base({
        'GET /api/v1/bookings/b1': () => json(inSeries),
        'GET /api/v1/bookings/mine': () => json(page([inSeries, other])),
      }),
    )
    renderApp('/bookings/b1')
    expect(await screen.findByText(/Repetición 2 de una serie/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Ver las reservas de la serie' }))
    expect(await screen.findByText('Mostrando solo las reservas de una serie.')).toBeInTheDocument()
    expect(screen.queryByText('Other thing')).not.toBeInTheDocument()
  })
})
