import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, mockApi, renderApp, room, rules } from '@/test/server'

vi.mock('@/hooks/useRoomOccupancy', () => ({
  useRoomOccupancy: () => ({ occupancy: null, connected: false }),
}))

afterEach(() => vi.unstubAllGlobals())

const booking = {
  id: 'b1',
  roomId: room.id,
  organizerId: 'u1',
  title: 'Weekly sync',
  startAt: '2030-01-14T09:00:00Z', // 10:00 in Madrid
  endAt: '2030-01-14T10:00:00Z',
  attendees: 3,
  status: 'Confirmed',
  createdAt: '2030-01-01T00:00:00Z',
  cancelledAt: null,
  rescheduledAt: null,
}

const own = {
  bookingId: 'b1',
  startAt: booking.startAt,
  endAt: booking.endAt,
  isMine: true,
  title: 'Weekly sync',
  organizerId: 'u1',
}

const base = (extra = {}) => ({
  'GET /api/v1/me': () => json(meEmployee),
  'GET /api/v1/rules': () => json(rules),
  'GET /api/v1/bookings/b1': () => json(booking),
  [`GET /api/v1/rooms/${room.id}`]: () => json(room),
  [`GET /api/v1/rooms/${room.id}/schedule`]: () => json([own]),
  ...extra,
})

async function pickTimes(start: string, end: string) {
  await userEvent.selectOptions(await screen.findByLabelText('Nueva hora de inicio'), start)
  await userEvent.selectOptions(screen.getByLabelText('Nueva hora de fin'), end)
}

describe('reschedule a booking', () => {
  it('is reachable from the booking detail', async () => {
    mockApi(base())
    renderApp('/bookings/b1')
    expect(await screen.findByRole('link', { name: 'Reprogramar' })).toHaveAttribute(
      'href',
      '/bookings/b1/reschedule',
    )
  })

  it('does not offer it for a cancelled booking', async () => {
    mockApi(base({ 'GET /api/v1/bookings/b1': () => json({ ...booking, status: 'Cancelled' }) }))
    renderApp('/bookings/b1')
    await screen.findByText('Cancelada')
    expect(screen.queryByRole('link', { name: 'Reprogramar' })).not.toBeInTheDocument()
  })

  it('sends the new time and room and goes back to the booking', async () => {
    const { calls } = mockApi(
      base({
        'POST /api/v1/bookings/b1/reschedule': () => json({ ...booking, rescheduledAt: 'x' }),
      }),
    )
    renderApp('/bookings/b1/reschedule')
    await pickTimes('11:00', '12:00')
    await userEvent.click(screen.getByRole('button', { name: 'Reprogramar' }))
    expect(await screen.findByText('Reserva reprogramada.')).toBeInTheDocument()
    expect(calls.find((c) => c.key === 'POST /api/v1/bookings/b1/reschedule')?.body).toEqual({
      startAt: '2030-01-14T10:00:00.000Z',
      endAt: '2030-01-14T11:00:00.000Z',
      roomId: room.id,
    })
  })

  it('does not block the booking own slot', async () => {
    mockApi(base())
    renderApp('/bookings/b1/reschedule')
    const select = await screen.findByLabelText('Nueva hora de inicio')
    expect(await screen.findByRole('option', { name: '10:00' })).toBeEnabled()
    expect(select).toBeEnabled()
  })

  it('blocks slots taken by other bookings', async () => {
    mockApi(
      base({
        [`GET /api/v1/rooms/${room.id}/schedule`]: () =>
          json([
            own,
            {
              ...own,
              bookingId: 'other',
              startAt: '2030-01-14T10:00:00Z',
              endAt: '2030-01-14T11:00:00Z',
            },
          ]),
      }),
    )
    renderApp('/bookings/b1/reschedule')
    await screen.findByLabelText('Nueva hora de inicio')
    expect(screen.queryByRole('option', { name: '11:00' })).not.toBeInTheDocument()
  })

  it('shows the too-late rule on the start field', async () => {
    mockApi(
      base({
        'POST /api/v1/bookings/b1/reschedule': () =>
          json({ violations: [{ code: 'TooLateToReschedule', message: 'x' }] }, 422),
      }),
    )
    renderApp('/bookings/b1/reschedule')
    await pickTimes('11:00', '12:00')
    await userEvent.click(screen.getByRole('button', { name: 'Reprogramar' }))
    expect((await screen.findAllByText(/Ya no se puede reprogramar/)).length).toBeGreaterThan(0)
  })

  it('refreshes the agenda on a conflict (409)', async () => {
    const { calls } = mockApi(
      base({ 'POST /api/v1/bookings/b1/reschedule': () => json({ title: 'Conflict' }, 409) }),
    )
    renderApp('/bookings/b1/reschedule')
    await pickTimes('11:00', '12:00')
    await userEvent.click(screen.getByRole('button', { name: 'Reprogramar' }))
    expect(await screen.findByText(/se acaba de ocupar/)).toBeInTheDocument()
    expect(calls.filter((c) => c.key.endsWith('/schedule')).length).toBeGreaterThan(1)
  })

  it('asks for the times before sending', async () => {
    const { calls } = mockApi(base())
    renderApp('/bookings/b1/reschedule')
    await screen.findByLabelText('Nueva hora de inicio')
    await userEvent.click(screen.getByRole('button', { name: 'Reprogramar' }))
    expect(await screen.findByText('Elige la hora de inicio.')).toBeInTheDocument()
    expect(calls.some((c) => c.key.includes('reschedule'))).toBe(false)
  })

  it('explains when the booking cannot be rescheduled', async () => {
    mockApi(base({ 'GET /api/v1/bookings/b1': () => json({ ...booking, status: 'Cancelled' }) }))
    renderApp('/bookings/b1/reschedule')
    expect(await screen.findByText('Esta reserva ya no se puede reprogramar')).toBeInTheDocument()
  })

  it('handles a 403', async () => {
    mockApi(base({ 'GET /api/v1/bookings/b1': () => json({}, 403) }))
    renderApp('/bookings/b1/reschedule')
    expect(await screen.findByText('No se puede reprogramar esta reserva')).toBeInTheDocument()
  })
})
