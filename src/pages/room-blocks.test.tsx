import { screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, meFacilities, mockApi, renderApp, room, rules } from '@/test/server'
import { toApiError } from '@/api/errors'

afterEach(() => vi.unstubAllGlobals())

const roomPath = `/api/v1/rooms/${room.id}`
const block = {
  id: 'k1',
  roomId: room.id,
  startAt: '2030-01-14T08:00:00Z',
  endAt: '2030-01-14T12:00:00Z',
  reason: 'Cleaning',
  createdAt: '2030-01-01T00:00:00Z',
}
const routes = (extra = {}) => ({
  'GET /api/v1/me': () => json(meFacilities),
  'GET /api/v1/rules': () => json(rules),
  [`GET ${roomPath}`]: () => json(room),
  [`GET ${roomPath}/blocks`]: () => json([block]),
  ...extra,
})
const path = `/admin/rooms/${room.id}/blocks`

async function fill(start = '2030-01-15T09:00', end = '2030-01-15T11:00') {
  fireEvent.change(await screen.findByLabelText('Inicio'), { target: { value: start } })
  fireEvent.change(screen.getByLabelText('Fin'), { target: { value: end } })
}

describe('ApiError', () => {
  it('keeps the bookingIds of a 409', () => {
    expect(toApiError(409, { title: 'Conflict', bookingIds: ['a', 'b', 7] }).bookingIds).toEqual([
      'a',
      'b',
    ])
    expect(toApiError(409, { title: 'Conflict' }).bookingIds).toEqual([])
  })
})

describe('room blocks', () => {
  it('lists the blocks of the room', async () => {
    mockApi(routes())
    renderApp(path)
    expect(
      await screen.findByRole('heading', { name: 'Bloqueos de Sala Gaudí' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Cleaning')).toBeInTheDocument()
  })

  it('creates a block in the office time zone', async () => {
    const { calls } = mockApi(routes({ [`POST ${roomPath}/blocks`]: () => json(block, 201) }))
    renderApp(path)
    await fill()
    await userEvent.type(screen.getByLabelText('Motivo (opcional)'), 'Repairs')
    await userEvent.click(screen.getByRole('button', { name: 'Bloquear la sala' }))
    await waitFor(() =>
      expect(calls.find((c) => c.key === `POST ${roomPath}/blocks`)?.body).toEqual({
        startAt: '2030-01-15T08:00:00.000Z',
        endAt: '2030-01-15T10:00:00.000Z',
        reason: 'Repairs',
      }),
    )
    expect(await screen.findByText('Sala bloqueada.')).toBeInTheDocument()
  })

  it('requires an end after the start', async () => {
    const { calls } = mockApi(routes())
    renderApp(path)
    await fill('2030-01-15T11:00', '2030-01-15T09:00')
    await userEvent.click(screen.getByRole('button', { name: 'Bloquear la sala' }))
    expect(await screen.findByText('El fin debe ser posterior al inicio.')).toBeInTheDocument()
    expect(calls.some((c) => c.key.startsWith('POST'))).toBe(false)
  })

  it('lists the bookings that stop the block (409)', async () => {
    mockApi(
      routes({
        [`POST ${roomPath}/blocks`]: () =>
          json({ title: 'Conflict', bookingIds: ['11111111-aaaa-bbbb-cccc-dddddddddddd'] }, 409),
      }),
    )
    renderApp(path)
    await fill()
    await userEvent.click(screen.getByRole('button', { name: 'Bloquear la sala' }))
    expect(await screen.findByText(/hay reservas confirmadas/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reserva 11111111' })).toHaveAttribute(
      'href',
      '/bookings/11111111-aaaa-bbbb-cccc-dddddddddddd',
    )
  })

  it('lifts a block after confirmation', async () => {
    const { calls } = mockApi(
      routes({ [`DELETE ${roomPath}/blocks/k1`]: () => new Response(null, { status: 204 }) }),
    )
    renderApp(path)
    await userEvent.click(await screen.findByRole('button', { name: 'Levantar' }))
    const dialog = await screen.findByRole('dialog')
    expect(calls.some((c) => c.key.startsWith('DELETE'))).toBe(false)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Levantar' }))
    await waitFor(() =>
      expect(calls.some((c) => c.key === `DELETE ${roomPath}/blocks/k1`)).toBe(true),
    )
    expect(await screen.findByText('Bloqueo levantado.')).toBeInTheDocument()
  })

  it('is reachable from the admin rooms and closed to employees', async () => {
    mockApi({
      ...routes(),
      'GET /api/v1/rooms': () => json({ items: [room], page: 1, pageSize: 20, totalCount: 1 }),
    })
    const { unmount } = renderApp('/admin/rooms')
    expect(await screen.findByRole('link', { name: 'Bloqueos' })).toHaveAttribute('href', path)
    unmount()
    mockApi(routes({ 'GET /api/v1/me': () => json(meEmployee) }))
    renderApp(path)
    expect(await screen.findByText(/permiso/i)).toBeInTheDocument()
  })
})
