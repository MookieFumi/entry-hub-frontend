import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, mockApi, renderApp, room, rules } from '@/test/server'

vi.mock('@/hooks/useRoomOccupancy', () => ({
  useRoomOccupancy: () => ({ occupancy: null, connected: false }),
}))

afterEach(() => vi.unstubAllGlobals())

const roomPath = `/api/v1/rooms/${room.id}`

describe('booking creation sends an Idempotency-Key', () => {
  it('reuses the key for a retry of the same data and renews it when the data changes', async () => {
    let attempts = 0
    const { calls } = mockApi({
      'GET /api/v1/me': () => json(meEmployee),
      'GET /api/v1/rules': () => json(rules),
      [`GET ${roomPath}`]: () => json(room),
      [`GET ${roomPath}/schedule`]: () => json([]),
      'POST /api/v1/bookings': () => {
        attempts += 1
        return json({ title: 'Unavailable' }, 503)
      },
    })
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await screen.findByRole('heading', { name: 'Sala Gaudí' })
    await waitFor(() => expect(screen.getByLabelText('Hora de inicio')).toBeEnabled())
    await userEvent.selectOptions(screen.getByLabelText('Hora de inicio'), '10:00')
    await userEvent.selectOptions(screen.getByLabelText('Hora de fin'), '11:00')
    await userEvent.type(screen.getByLabelText('Título'), 'Planificación')

    const submit = screen.getByRole('button', { name: 'Reservar' })
    await userEvent.click(submit)
    await waitFor(() => expect(attempts).toBe(1))
    await userEvent.click(submit)
    await waitFor(() => expect(attempts).toBe(2))
    await userEvent.type(screen.getByLabelText('Título'), ' 2')
    await userEvent.click(submit)
    await waitFor(() => expect(attempts).toBe(3))

    const keys = calls.filter((c) => c.key === 'POST /api/v1/bookings').map((c) => c.idempotencyKey)
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/)
    expect(keys[1]).toBe(keys[0])
    expect(keys[2]).not.toBe(keys[0])
  })
})
