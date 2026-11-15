import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, mockApi, page, renderApp, room, rules } from '@/test/server'
import { mondayOf } from './RoomWeek'

vi.mock('@/hooks/useRoomOccupancy', () => ({
  useRoomOccupancy: () => ({ occupancy: null, connected: false }),
}))

afterEach(() => vi.unstubAllGlobals())

const base = {
  'GET /api/v1/me': () => json(meEmployee),
  'GET /api/v1/rules': () => json(rules),
}
const roomPath = `/api/v1/rooms/${room.id}`
const entry = (start: string, end: string, title: string | null, isMine = false) => ({
  bookingId: title ? 'b' + start : null,
  startAt: start,
  endAt: end,
  isMine,
  title,
  organizerId: null,
})

describe('semana', () => {
  it('calcula el lunes de cualquier día', () => {
    expect(mondayOf('2030-01-16')).toBe('2030-01-14')
    expect(mondayOf('2030-01-14')).toBe('2030-01-14')
    expect(mondayOf('2030-01-20')).toBe('2030-01-14')
  })

  it('muestra solo los días laborables y reparte las reservas por día', async () => {
    const { calls } = mockApi({
      ...base,
      [`GET ${roomPath}`]: () => json(room),
      [`GET ${roomPath}/schedule`]: () =>
        json([
          entry('2030-01-15T09:00:00Z', '2030-01-15T10:00:00Z', 'Retro', true),
          entry('2030-01-17T10:00:00Z', '2030-01-17T11:00:00Z', null),
        ]),
    })
    renderApp(`/rooms/${room.id}/week?date=2030-01-16`)
    expect(await screen.findByRole('heading', { name: /Martes 2030-01-15/ })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5)
    expect(screen.queryByRole('heading', { name: /Sábado/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Retro/)).toBeInTheDocument()
    expect(screen.getAllByTestId('timeline-block')).toHaveLength(2)
    const req = calls.find((c) => c.key === `GET ${roomPath}/schedule`)!
    expect(decodeURIComponent(req.search)).toContain('From=2030-01-13T23:00:00.000Z')
    expect(decodeURIComponent(req.search)).toContain('To=2030-01-20T23:00:00.000Z')
  })

  it('navega a la semana siguiente', async () => {
    mockApi({
      ...base,
      [`GET ${roomPath}`]: () => json(room),
      [`GET ${roomPath}/schedule`]: () => json([]),
    })
    renderApp(`/rooms/${room.id}/week?date=2030-01-16`)
    await userEvent.click(await screen.findByRole('link', { name: /Semana siguiente/ }))
    expect(await screen.findByRole('heading', { name: /Lunes 2030-01-21/ })).toBeInTheDocument()
  })
})

describe('ficha de sala', () => {
  it('dibuja la línea de tiempo y la lista equivalente', async () => {
    mockApi({
      ...base,
      [`GET ${roomPath}`]: () => json(room),
      [`GET ${roomPath}/schedule`]: () =>
        json([entry('2030-01-14T09:00:00Z', '2030-01-14T10:00:00Z', 'Planificación', true)]),
    })
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    const timeline = await screen.findByRole('img', { name: /Ocupación del día: 1 reservas/ })
    expect(within(timeline).getAllByTestId('timeline-block')).toHaveLength(1)
    expect(screen.getByText(/10:00 – 11:00 · Planificación/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la semana' })).toHaveAttribute(
      'href',
      `/rooms/${room.id}/week?date=2030-01-14`,
    )
  })
})

describe('búsqueda de disponibilidad', () => {
  it('envía planta y capacidad mínima y ofrece reservar la franja', async () => {
    const { calls } = mockApi({
      ...base,
      'GET /api/v1/rooms/availability': () => json([room]),
    })
    renderApp('/search?date=2030-01-14&start=10:00&end=11:00&floor=2&minCapacity=6')
    expect(await screen.findByRole('link', { name: 'Reservar esta franja' })).toHaveAttribute(
      'href',
      `/rooms/${room.id}?date=2030-01-14&start=10:00&end=11:00`,
    )
    const req = calls.find((c) => c.key === 'GET /api/v1/rooms/availability')!
    expect(req.search).toContain('Floor=2')
    expect(req.search).toContain('MinCapacity=6')
  })

  it('sin resultados sugiere otra planta u hora', async () => {
    mockApi({ ...base, 'GET /api/v1/rooms/availability': () => json([]) })
    renderApp('/search?date=2030-01-14&start=10:00&end=11:00')
    expect(await screen.findByText('Ninguna sala libre en esa franja')).toBeInTheDocument()
  })
})

describe('zona horaria de las reglas', () => {
  it('usa la zona que publica /rules, no una fija', async () => {
    mockApi({
      ...base,
      'GET /api/v1/rules': () => json({ ...rules, timeZone: 'America/New_York' }),
      'GET /api/v1/bookings/mine': () =>
        json(
          page([
            {
              id: 'b1',
              roomId: room.id,
              organizerId: 'u1',
              title: 'Reunión',
              startAt: '2030-01-14T15:00:00Z',
              endAt: '2030-01-14T16:00:00Z',
              attendees: 2,
              status: 'Confirmed',
              createdAt: '2030-01-01T00:00:00Z',
              cancelledAt: null,
            },
          ]),
        ),
    })
    renderApp('/bookings')
    await waitFor(() => expect(screen.getByText(/10:00/)).toBeInTheDocument())
  })
})
