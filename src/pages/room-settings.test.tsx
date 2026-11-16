import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

afterEach(() => vi.unstubAllGlobals())

const roomPath = `/api/v1/rooms/${room.id}`
const guarded = { ...room, bufferBeforeMinutes: 10, bufferAfterMinutes: 5, requiresApproval: true }

describe('room approval and buffers', () => {
  it('edits the buffers and the approval of a room', async () => {
    const { calls } = mockApi({
      'GET /api/v1/me': () => json(meFacilities),
      'GET /api/v1/rules': () => json(rules),
      'GET /api/v1/rooms': () => json(page([room])),
      [`PATCH ${roomPath}`]: () => json(guarded),
    })
    renderApp('/admin/rooms')
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const before = await screen.findByLabelText('Margen antes (minutos)')
    await userEvent.clear(before)
    await userEvent.type(before, '10')
    await userEvent.clear(screen.getByLabelText('Margen después (minutos)'))
    await userEvent.type(screen.getByLabelText('Margen después (minutos)'), '5')
    await userEvent.click(screen.getByLabelText(/Las reservas necesitan aprobación/))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(calls.find((c) => c.key === `PATCH ${roomPath}`)?.body).toMatchObject({
        bufferBeforeMinutes: 10,
        bufferAfterMinutes: 5,
        requiresApproval: true,
      }),
    )
  })

  it('rejects a buffer out of range before sending', async () => {
    const { calls } = mockApi({
      'GET /api/v1/me': () => json(meFacilities),
      'GET /api/v1/rules': () => json(rules),
      'GET /api/v1/rooms': () => json(page([room])),
    })
    renderApp('/admin/rooms')
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const before = await screen.findByLabelText('Margen antes (minutos)')
    await userEvent.clear(before)
    await userEvent.type(before, '300')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText(/entre 0 y 240/)).toBeInTheDocument()
    expect(calls.some((c) => c.key.startsWith('PATCH'))).toBe(false)
  })

  it('lists the approval and the buffers in the admin table', async () => {
    mockApi({
      'GET /api/v1/me': () => json(meFacilities),
      'GET /api/v1/rules': () => json(rules),
      'GET /api/v1/rooms': () => json(page([guarded])),
    })
    renderApp('/admin/rooms')
    expect(await screen.findByText('Requiere aprobación')).toBeInTheDocument()
    expect(screen.getByText('10 min antes / 5 min después')).toBeInTheDocument()
  })

  it('tells employees that the room needs approval, but not Facilities', async () => {
    const routes = (me: object) => ({
      'GET /api/v1/me': () => json(me),
      'GET /api/v1/rules': () => json(rules),
      [`GET ${roomPath}`]: () => json(guarded),
      [`GET ${roomPath}/schedule`]: () => json([]),
    })
    mockApi(routes(meEmployee))
    const { unmount } = renderApp(`/rooms/${room.id}?date=2030-01-14`)
    expect(await screen.findByText(/Esta sala requiere aprobación/)).toBeInTheDocument()
    expect(screen.getByText(/10 min antes y 5 min después/)).toBeInTheDocument()
    unmount()
    mockApi(routes(meFacilities))
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await screen.findByRole('heading', { name: 'Sala Gaudí' })
    await screen.findByText(/10 min antes y 5 min después/)
    expect(screen.queryByText(/Esta sala requiere aprobación/)).not.toBeInTheDocument()
  })
})
