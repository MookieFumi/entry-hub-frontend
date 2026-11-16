import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  json,
  meEmployee,
  meFacilities,
  mockApi,
  page,
  renderApp,
  room,
  rules,
} from '@/test/server'

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

  it('lets Facilities approve a pending booking', async () => {
    const { calls } = mockApi({
      ...base(booking()),
      'GET /api/v1/me': () => json(meFacilities),
      'POST /api/v1/bookings/b1/approve': () => json(booking({ status: 'Confirmed' })),
    })
    renderApp('/bookings/b1')
    await userEvent.click(await screen.findByRole('button', { name: 'Aprobar' }))
    await waitFor(() =>
      expect(calls.some((c) => c.key === 'POST /api/v1/bookings/b1/approve')).toBe(true),
    )
    expect(await screen.findByText('Reserva aprobada.')).toBeInTheDocument()
  })

  it('rejects with an optional reason', async () => {
    const { calls } = mockApi({
      ...base(booking()),
      'GET /api/v1/me': () => json(meFacilities),
      'POST /api/v1/bookings/b1/reject': () => json(booking({ status: 'Cancelled' })),
    })
    renderApp('/bookings/b1')
    await userEvent.click(await screen.findByRole('button', { name: 'Rechazar' }))
    await userEvent.type(await screen.findByLabelText('Motivo (opcional)'), 'Room needed')
    await userEvent.click(screen.getAllByRole('button', { name: 'Rechazar' }).at(-1)!)
    await waitFor(() =>
      expect(calls.find((c) => c.key === 'POST /api/v1/bookings/b1/reject')?.body).toEqual({
        reason: 'Room needed',
      }),
    )
  })

  it('explains that a booking was already decided (409)', async () => {
    mockApi({
      ...base(booking()),
      'GET /api/v1/me': () => json(meFacilities),
      'POST /api/v1/bookings/b1/approve': () => json({ title: 'Conflict' }, 409),
    })
    renderApp('/bookings/b1')
    await userEvent.click(await screen.findByRole('button', { name: 'Aprobar' }))
    expect(await screen.findByText(/ya no está pendiente/)).toBeInTheDocument()
  })

  it('does not offer the decision to employees', async () => {
    mockApi(base(booking()))
    renderApp('/bookings/b1')
    await screen.findByText('Pendiente de aprobación')
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
  })
})
