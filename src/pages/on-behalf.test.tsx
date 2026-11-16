import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, meFacilities, mockApi, renderApp, room, rules } from '@/test/server'

vi.mock('@/hooks/useRoomOccupancy', () => ({
  useRoomOccupancy: () => ({ occupancy: null, connected: false }),
}))

afterEach(() => vi.unstubAllGlobals())

const roomPath = `/api/v1/rooms/${room.id}`
const created = {
  id: 'b1',
  roomId: room.id,
  organizerId: 'ana',
  createdBy: 'u1',
  title: 'Visit',
  startAt: '2030-01-14T09:00:00Z',
  endAt: '2030-01-14T10:00:00Z',
  attendees: 1,
  status: 'Confirmed',
  createdAt: '2030-01-01T00:00:00Z',
  cancelledAt: null,
}
const routes = (me: object, extra = {}) => ({
  'GET /api/v1/me': () => json(me),
  'GET /api/v1/rules': () => json(rules),
  [`GET ${roomPath}`]: () => json(room),
  [`GET ${roomPath}/schedule`]: () => json([]),
  'GET /api/v1/bookings/b1': () => json(created),
  ...extra,
})

async function fill() {
  await screen.findByRole('heading', { name: 'Sala Gaudí' })
  await waitFor(() => expect(screen.getByLabelText('Hora de inicio')).toBeEnabled())
  await userEvent.selectOptions(screen.getByLabelText('Hora de inicio'), '10:00')
  await userEvent.selectOptions(screen.getByLabelText('Hora de fin'), '11:00')
  await userEvent.type(screen.getByLabelText('Título'), 'Visit')
}

describe('book on behalf of another person', () => {
  it('sends onBehalfOf for Facilities', async () => {
    const { calls } = mockApi(
      routes(meFacilities, { 'POST /api/v1/bookings': () => json(created, 201) }),
    )
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await fill()
    await userEvent.type(screen.getByLabelText('Reservar en nombre de (opcional)'), ' ana ')
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    await waitFor(() =>
      expect(calls.find((c) => c.key === 'POST /api/v1/bookings')?.body).toMatchObject({
        onBehalfOf: 'ana',
      }),
    )
  })

  it('does not show the field to employees', async () => {
    mockApi(routes(meEmployee))
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await fill()
    expect(screen.queryByLabelText('Reservar en nombre de (opcional)')).not.toBeInTheDocument()
  })

  it('shows who created a booking made on behalf of someone', async () => {
    mockApi(routes(meFacilities))
    renderApp('/bookings/b1')
    expect(await screen.findByText('Reservada por:')).toBeInTheDocument()
    expect(screen.getByText(/ana/)).toBeInTheDocument()
  })
})
