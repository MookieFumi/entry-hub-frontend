import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { json, meEmployee, mockApi, page, renderApp, room, rules } from '@/test/server'

vi.mock('@/hooks/useRoomOccupancy', () => ({
  useRoomOccupancy: () => ({ occupancy: null, connected: false }),
}))

const booking = (extra = {}) => ({
  id: 'b1',
  roomId: room.id,
  organizerId: 'u1',
  title: 'Board meeting',
  startAt: '2030-01-14T09:00:00Z',
  endAt: '2030-01-14T10:00:00Z',
  attendees: 3,
  status: 'Pending',
  createdAt: '2030-01-01T00:00:00Z',
  cancelledAt: null,
  ...extra,
})

const base = (b: object) => ({
  'GET /api/v1/me': () => json(meEmployee),
  'GET /api/v1/rules': () => json(rules),
  'GET /api/v1/bookings/b1': () => json(b),
  'GET /api/v1/bookings/mine': () => json(page([b])),
  [`GET /api/v1/rooms/${room.id}`]: () => json(room),
  [`GET /api/v1/rooms/${room.id}/schedule`]: () => json([]),
})

describe('pending approval', () => {
  it('shows the pending status and lets the organizer cancel it', async () => {
    mockApi(base(booking()))
    renderApp('/bookings/b1')
    expect(await screen.findByText('Pendiente de aprobación')).toBeInTheDocument()
    expect(screen.getByText(/tiene que aprobar esta reserva/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('lists pending bookings under the upcoming ones', async () => {
    mockApi(base(booking()))
    renderApp('/bookings')
    expect(await screen.findByText('Board meeting')).toBeInTheDocument()
    expect(screen.getByText('Próximas (1)')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de aprobación')).toBeInTheDocument()
  })

  it('shows a rejected booking as cancelled with who decided and why', async () => {
    mockApi(
      base(
        booking({
          status: 'Cancelled',
          cancelledAt: '2030-01-02T08:00:00Z',
          decidedBy: 'Ana Facilities',
          decidedAt: '2030-01-02T08:00:00Z',
          decisionReason: 'Room reserved for the board',
        }),
      ),
    )
    renderApp('/bookings/b1')
    expect(await screen.findByText('Cancelada')).toBeInTheDocument()
    expect(screen.getByText('Room reserved for the board')).toBeInTheDocument()
    expect(screen.getByText(/Ana Facilities/)).toBeInTheDocument()
  })
})
