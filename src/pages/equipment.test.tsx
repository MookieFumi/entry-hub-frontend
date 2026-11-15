import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  features,
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

const base = (me = meEmployee) => ({
  'GET /api/v1/me': () => json(me),
  'GET /api/v1/rules': () => json(rules),
  'GET /api/v1/features': () => json(features),
  'GET /api/v1/rooms': () => json(page([room])),
})

const lastQuery = (calls: { key: string; search: string }[], key: string) =>
  decodeURIComponent(calls.filter((c) => c.key === key).at(-1)?.search ?? '')

describe('typed equipment in the catalog', () => {
  it('shows the features of each room as badges', async () => {
    mockApi(base())
    renderApp('/rooms')
    const list = await screen.findByRole('list', { name: 'Equipamiento y accesibilidad' })
    expect(within(list).getByText('TV')).toBeInTheDocument()
  })

  it('filters rooms by catalog codes and keeps them in the URL', async () => {
    const { calls } = mockApi(base())
    renderApp('/rooms')
    await userEvent.click(await screen.findByRole('checkbox', { name: 'TV' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Acceso sin escalones' }))
    await screen.findByRole('checkbox', { name: 'TV', checked: true })
    expect(lastQuery(calls, 'GET /api/v1/rooms')).toContain('Features=tv,step-free')
  })

  it('reads the filter back from the URL', async () => {
    const { calls } = mockApi(base())
    renderApp('/rooms?features=video-conferencing')
    expect(
      await screen.findByRole('checkbox', { name: 'Videoconferencia', checked: true }),
    ).toBeVisible()
    expect(lastQuery(calls, 'GET /api/v1/rooms')).toContain('Features=video-conferencing')
  })

  it('groups the catalog by kind', async () => {
    mockApi(base())
    renderApp('/rooms')
    expect(await screen.findByRole('group', { name: 'Equipamiento' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Accesibilidad' })).toBeInTheDocument()
  })

  it('tells the user when the catalog cannot be loaded', async () => {
    mockApi({ ...base(), 'GET /api/v1/features': () => json({}, 500) })
    renderApp('/rooms')
    expect(await screen.findByText(/No se pudo cargar el catálogo/)).toBeInTheDocument()
  })
})

describe('availability search with features', () => {
  it('sends the selected codes', async () => {
    const { calls } = mockApi({
      ...base(),
      'GET /api/v1/rooms/availability': () => json([room]),
    })
    renderApp('/search?date=2030-01-14&start=10:00&end=11:00&features=tv')
    expect(await screen.findByRole('link', { name: 'Reservar esta franja' })).toBeVisible()
    expect(lastQuery(calls, 'GET /api/v1/rooms/availability')).toContain('Features=tv')
  })
})

describe('room administration with the catalog', () => {
  const admin = () => ({
    ...base(meFacilities),
    'POST /api/v1/rooms': () => json({ ...room, id: 'new' }, 201),
    [`PATCH /api/v1/rooms/${room.id}`]: () => json(room),
  })

  it('creates a room with catalog ids instead of free text', async () => {
    const { calls } = mockApi(admin())
    renderApp('/admin/rooms')
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva sala' }))
    expect(screen.queryByLabelText('Equipamiento')).not.toBeInTheDocument()
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Sala Picasso')
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Acceso sin escalones' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await screen.findByText('Sala creada.')
    expect(calls.find((c) => c.key === 'POST /api/v1/rooms')?.body).toMatchObject({
      name: 'Sala Picasso',
      featureIds: ['f3'],
    })
  })

  it('preselects the features of the room and only sends them when they change', async () => {
    const { calls } = mockApi(admin())
    renderApp('/admin/rooms')
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const tv = await screen.findByRole('checkbox', { name: 'TV', checked: true })
    expect(tv).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await screen.findByText('Sala actualizada.')
    expect(calls.find((c) => c.key.startsWith('PATCH'))?.body).toMatchObject({ featureIds: null })
  })

  it('sends the new selection when it changed', async () => {
    const { calls } = mockApi(admin())
    renderApp('/admin/rooms')
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Acceso sin escalones' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await screen.findByText('Sala actualizada.')
    expect(calls.find((c) => c.key.startsWith('PATCH'))?.body).toMatchObject({
      featureIds: ['f1', 'f3'],
    })
  })

  it('deactivating a room sends only the state, not the catalog', async () => {
    const { calls } = mockApi(admin())
    renderApp('/admin/rooms')
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Desactivar' }),
    )
    await screen.findByText('Sala desactivada.')
    expect(calls.find((c) => c.key.startsWith('PATCH'))?.body).toEqual({
      name: null,
      floor: null,
      capacity: null,
      equipment: null,
      siteId: null,
      featureIds: null,
      isActive: false,
    })
  })
})
