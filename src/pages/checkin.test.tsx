import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { json, meEmployee, mockApi, renderApp, room, rules } from '@/test/server'

vi.mock('@/hooks/useRoomOccupancy', () => ({
  useRoomOccupancy: () => ({ occupancy: null, connected: false }),
}))

const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString()

const booking = (startInMinutes: number, extra = {}) => ({
  id: 'b1',
  roomId: room.id,
  organizerId: 'u1',
  title: 'Stand-up',
  startAt: inMinutes(startInMinutes),
  endAt: inMinutes(startInMinutes + 30),
  attendees: 3,
  status: 'Confirmed',
  createdAt: '2030-01-01T00:00:00Z',
  cancelledAt: null,
  ...extra,
})

const base = (b: object, extra = {}) => ({
  'GET /api/v1/me': () => json(meEmployee),
  'GET /api/v1/rules': () => json({ ...rules, autoReleaseMinutes: 10 }),
  'GET /api/v1/bookings/b1': () => json(b),
  [`GET /api/v1/rooms/${room.id}`]: () => json(room),
  [`GET /api/v1/rooms/${room.id}/schedule`]: () => json([]),
  ...extra,
})

describe('check-in', () => {
  it('checks in from the booking detail when the window is open', async () => {
    const { calls } = mockApi(
      base(booking(5), {
        'POST /api/v1/bookings/b1/check-in': () => json(booking(5, { checkedInAt: inMinutes(0) })),
      }),
    )
    renderApp('/bookings/b1')
    await userEvent.click(await screen.findByRole('button', { name: 'Registrar llegada' }))
    await waitFor(() =>
      expect(calls.some((c) => c.key === 'POST /api/v1/bookings/b1/check-in')).toBe(true),
    )
    expect(await screen.findByText('Llegada registrada.')).toBeInTheDocument()
  })

  it('explains the auto-release rule', async () => {
    mockApi(base(booking(5)))
    renderApp('/bookings/b1')
    expect(await screen.findByText(/en los 10 minutos siguientes al inicio/)).toBeInTheDocument()
  })

  it('does not offer the check-in before the window opens or after it was done', async () => {
    mockApi(base(booking(60)))
    renderApp('/bookings/b1')
    await screen.findByRole('heading', { name: 'Stand-up' })
    expect(screen.queryByRole('button', { name: 'Registrar llegada' })).not.toBeInTheDocument()
  })

  it('shows when it was checked in and hides the button', async () => {
    mockApi(base(booking(5, { checkedInAt: inMinutes(0) })))
    renderApp('/bookings/b1')
    expect(await screen.findByText('Llegada registrada:')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar llegada' })).not.toBeInTheDocument()
  })

  it('shows the message of TooEarlyToCheckIn', async () => {
    mockApi(
      base(booking(5), {
        'POST /api/v1/bookings/b1/check-in': () =>
          json({ title: 'Rules', violations: [{ code: 'TooEarlyToCheckIn', message: 'x' }] }, 422),
      }),
    )
    renderApp('/bookings/b1')
    await userEvent.click(await screen.findByRole('button', { name: 'Registrar llegada' }))
    expect(await screen.findByText(/Todavía es pronto/)).toBeInTheDocument()
  })
})
