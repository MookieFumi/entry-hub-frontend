import { screen, waitFor, within } from '@testing-library/react'
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

const baseRoutes = (me = meEmployee) => ({
  'GET /api/v1/me': () => json(me),
  'GET /api/v1/rules': () => json(rules),
})

describe('access and guards', () => {
  it('without a session it goes to login', async () => {
    mockApi({})
    renderApp('/rooms', { signedIn: false })
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('shows the version on the login screen', async () => {
    mockApi({})
    renderApp('/login', { signedIn: false })
    await screen.findByRole('heading', { name: 'Iniciar sesión' })
    expect(screen.getByTestId('app-version')).toHaveTextContent(`Versión ${__APP_VERSION__}`)
  })

  it('shows the version in the landing footer', async () => {
    mockApi({})
    renderApp('/', { signedIn: false })
    expect(await screen.findByTestId('app-version')).toHaveTextContent(`Versión ${__APP_VERSION__}`)
  })

  it('a 403 from /me explains the account has no customer', async () => {
    mockApi({ 'GET /api/v1/me': () => json({ title: 'Forbidden' }, 403) })
    renderApp('/')
    expect(await screen.findByText(/no está asignada a ningún cliente/i)).toBeInTheDocument()
  })

  it('the very first request already carries the token', async () => {
    const { calls } = mockApi({ ...baseRoutes() })
    renderApp('/')
    await screen.findByText('Acme')
    expect(calls[0]?.auth).toBe('Bearer test-token')
  })

  it('an Employee does not see administration', async () => {
    mockApi({ ...baseRoutes() })
    renderApp('/admin/rooms')
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reservas' })).not.toBeInTheDocument()
  })

  it('Facilities sees the administration menu', async () => {
    mockApi({ ...baseRoutes(meFacilities), 'GET /api/v1/rooms': () => json(page([room])) })
    renderApp('/admin/rooms')
    expect(
      await screen.findByRole('heading', { name: 'Administración de salas' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reservas' })).toBeInTheDocument()
  })
})

describe('room catalog', () => {
  it('lists the rooms', async () => {
    mockApi({ ...baseRoutes(), 'GET /api/v1/rooms': () => json(page([room])) })
    renderApp('/rooms')
    expect(await screen.findByRole('link', { name: 'Sala Gaudí' })).toBeInTheDocument()
  })

  it('shows the empty state', async () => {
    mockApi({ ...baseRoutes(), 'GET /api/v1/rooms': () => json(page([])) })
    renderApp('/rooms')
    expect(await screen.findByText('No hay salas con esos filtros')).toBeInTheDocument()
  })

  it('shows the error with retry', async () => {
    mockApi({ ...baseRoutes(), 'GET /api/v1/rooms': () => json({ detail: 'Fallo' }, 500) })
    renderApp('/rooms')
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('a room of another customer looks like not found', async () => {
    mockApi({
      ...baseRoutes(),
      'GET /api/v1/rooms/11111111-1111-1111-1111-111111111111': () => json({}, 404),
    })
    renderApp('/rooms/11111111-1111-1111-1111-111111111111')
    expect(await screen.findByText('Sala no encontrada')).toBeInTheDocument()
  })
})

describe('booking', () => {
  const roomPath = `/api/v1/rooms/${room.id}`
  const routes = (post: () => Response) => ({
    ...baseRoutes(),
    [`GET ${roomPath}`]: () => json(room),
    [`GET ${roomPath}/schedule`]: () => json([]),
    'POST /api/v1/bookings': post,
  })

  async function fill() {
    // A far-away Monday so the test does not depend on the current date.
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await screen.findByRole('heading', { name: 'Sala Gaudí' })
    await waitFor(() => expect(screen.getByLabelText('Hora de inicio')).toBeEnabled())
    await userEvent.selectOptions(screen.getByLabelText('Hora de inicio'), '10:00')
    await userEvent.selectOptions(screen.getByLabelText('Hora de fin'), '11:00')
    await userEvent.type(screen.getByLabelText('Título'), 'Planificación')
  }

  it('sends the booking with UTC times and navigates to the detail', async () => {
    const { calls } = mockApi({
      ...routes(() =>
        json(
          {
            id: 'b1',
            roomId: room.id,
            organizerId: 'u1',
            title: 'Planificación',
            startAt: '2030-01-14T09:00:00Z',
            endAt: '2030-01-14T10:00:00Z',
            attendees: 1,
            status: 'Confirmed',
            createdAt: '2030-01-01T00:00:00Z',
            cancelledAt: null,
          },
          201,
        ),
      ),
      'GET /api/v1/bookings/b1': () =>
        json({
          id: 'b1',
          roomId: room.id,
          organizerId: 'u1',
          title: 'Planificación',
          startAt: '2030-01-14T09:00:00Z',
          endAt: '2030-01-14T10:00:00Z',
          attendees: 1,
          status: 'Confirmed',
          createdAt: '2030-01-01T00:00:00Z',
          cancelledAt: null,
        }),
    })
    await fill()
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect(await screen.findByRole('heading', { name: 'Planificación' })).toBeInTheDocument()
    const post = calls.find((c) => c.key === 'POST /api/v1/bookings')
    expect(post?.body).toMatchObject({
      startAt: '2030-01-14T09:00:00.000Z',
      endAt: '2030-01-14T10:00:00.000Z',
      attendees: 1,
    })
  })

  it('flags the attendees field when the room lacks capacity (422)', async () => {
    mockApi(
      routes(() =>
        json({ status: 422, violations: [{ code: 'ExceedsCapacity', message: 'too many' }] }, 422),
      ),
    )
    await fill()
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    const alerts = await screen.findAllByRole('alert')
    expect(alerts.some((a) => /capacidad de la sala/i.test(a.textContent ?? ''))).toBe(true)
    expect(screen.getByLabelText('Asistentes')).toHaveAttribute('aria-invalid', 'true')
  })

  it('flags the start field when the site is closed that day (422 SiteClosed)', async () => {
    mockApi(
      routes(() =>
        json({ status: 422, violations: [{ code: 'SiteClosed', message: 'closed' }] }, 422),
      ),
    )
    await fill()
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect((await screen.findAllByText('La sede está cerrada ese día.')).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Hora de inicio')).toHaveAttribute('aria-invalid', 'true')
  })

  it('warns when the slot is taken at the same time (409)', async () => {
    mockApi(routes(() => json({ title: 'Conflict' }, 409)))
    await fill()
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect(await screen.findByText(/se acaba de ocupar/i)).toBeInTheDocument()
  })

  it('validates on the client before sending', async () => {
    const { calls } = mockApi(routes(() => json({}, 201)))
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await screen.findByRole('heading', { name: 'Sala Gaudí' })
    await waitFor(() => expect(screen.getByLabelText('Hora de inicio')).toBeEnabled())
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect(await screen.findByText('Elige la hora de inicio.')).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'POST /api/v1/bookings')).toBe(false)
  })

  it('does not allow booking on weekends', async () => {
    mockApi(routes(() => json({}, 201)))
    renderApp(`/rooms/${room.id}?date=2030-01-12`)
    expect(await screen.findByText(/Ese día no se puede reservar/)).toBeInTheDocument()
  })
})

describe('my bookings', () => {
  const future = new Date(Date.now() + 7 * 864e5).toISOString()
  const futureEnd = new Date(Date.now() + 7 * 864e5 + 36e5).toISOString()
  const booking = {
    id: 'b1',
    roomId: room.id,
    organizerId: 'u1',
    title: 'Reunión',
    startAt: future,
    endAt: futureEnd,
    attendees: 3,
    status: 'Confirmed',
    createdAt: future,
    cancelledAt: null,
  }

  it('cancels a booking after confirmation', async () => {
    const { calls } = mockApi({
      ...baseRoutes(),
      'GET /api/v1/bookings/mine': () => json(page([booking])),
      'POST /api/v1/bookings/b1/cancel': () => new Response(null, { status: 204 }),
    })
    renderApp('/bookings')
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar reserva' }))
    await waitFor(() =>
      expect(calls.some((c) => c.key === 'POST /api/v1/bookings/b1/cancel')).toBe(true),
    )
  })

  it('explains TooLateToCancel', async () => {
    mockApi({
      ...baseRoutes(),
      'GET /api/v1/bookings/mine': () => json(page([booking])),
      'POST /api/v1/bookings/b1/cancel': () =>
        json({ violations: [{ code: 'TooLateToCancel', message: 'x' }] }, 422),
    })
    renderApp('/bookings')
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar reserva' }),
    )
    expect(await screen.findByText(/Ya no se puede cancelar/)).toBeInTheDocument()
  })

  it('a 403 on the detail explains it cannot be seen', async () => {
    mockApi({ ...baseRoutes(), 'GET /api/v1/bookings/zz': () => json({}, 403) })
    renderApp('/bookings/zz')
    expect(await screen.findByText('No puedes ver esta reserva')).toBeInTheDocument()
  })
})

describe('room administration', () => {
  const routes = () => ({
    ...baseRoutes(meFacilities),
    'GET /api/v1/rooms': () => json(page([room])),
  })

  it('shows the name conflict on create (409)', async () => {
    mockApi({ ...routes(), 'POST /api/v1/rooms': () => json({ title: 'Conflict' }, 409) })
    renderApp('/admin/rooms')
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva sala' }))
    await userEvent.type(await screen.findByLabelText('Nombre'), 'Sala Gaudí')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Ya existe una sala con ese nombre.')).toBeInTheDocument()
  })

  it('validates the limits before sending', async () => {
    const { calls } = mockApi(routes())
    renderApp('/admin/rooms')
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva sala' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText(/Nombre obligatorio/)).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'POST /api/v1/rooms')).toBe(false)
  })

  it('deactivates a room after confirmation', async () => {
    const { calls } = mockApi({
      ...routes(),
      'PATCH /api/v1/rooms/11111111-1111-1111-1111-111111111111': () =>
        json({ ...room, isActive: false }),
    })
    renderApp('/admin/rooms')
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Desactivar' }),
    )
    await waitFor(() =>
      expect(calls.find((c) => c.key.startsWith('PATCH'))?.body).toMatchObject({ isActive: false }),
    )
  })
})

describe('demo status', () => {
  it('shows the API running', async () => {
    mockApi({
      ...baseRoutes(),
      'GET /api/v1/health': () => json({ status: 'Healthy', database: 'Healthy' }),
    })
    renderApp('/status')
    expect(await screen.findByText('Todo en marcha')).toBeInTheDocument()
  })

  it('shows the version of the build in the menu and on the page', async () => {
    mockApi({
      ...baseRoutes(),
      'GET /api/v1/health': () => json({ status: 'Healthy', database: 'Healthy' }),
    })
    renderApp('/status')
    await screen.findByText('Todo en marcha')
    const versions = screen.getAllByTestId('app-version')
    expect(versions).toHaveLength(2)
    for (const el of versions) expect(el).toHaveTextContent(`Versión ${__APP_VERSION__}`)
  })
})
