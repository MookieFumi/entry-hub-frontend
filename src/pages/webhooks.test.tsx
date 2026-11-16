import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, meFacilities, mockApi, renderApp, rules } from '@/test/server'

afterEach(() => vi.unstubAllGlobals())

const hook = {
  id: 'w1',
  url: 'https://hooks.example.com/entry',
  events: ['booking.created', 'booking.cancelled'],
  isEnabled: true,
  createdAt: '2030-01-01T00:00:00Z',
}

const routes = (extra = {}) => ({
  'GET /api/v1/me': () => json(meFacilities),
  'GET /api/v1/rules': () => json(rules),
  'GET /api/v1/webhooks': () => json([hook]),
  ...extra,
})

describe('webhooks admin: list, pause and delete', () => {
  it('lists the subscriptions with their events and state', async () => {
    mockApi(routes())
    renderApp('/admin/webhooks')
    expect(await screen.findByText('https://hooks.example.com/entry')).toBeInTheDocument()
    expect(screen.getByText('Reserva creada, Reserva cancelada')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('shows an empty state', async () => {
    mockApi(routes({ 'GET /api/v1/webhooks': () => json([]) }))
    renderApp('/admin/webhooks')
    expect(await screen.findByText('Todavía no hay suscripciones')).toBeInTheDocument()
  })

  it('pauses a subscription', async () => {
    const { calls } = mockApi(
      routes({ 'PATCH /api/v1/webhooks/w1': () => json({ ...hook, isEnabled: false }) }),
    )
    renderApp('/admin/webhooks')
    await userEvent.click(await screen.findByRole('button', { name: 'Pausar' }))
    await waitFor(() =>
      expect(calls.find((c) => c.key === 'PATCH /api/v1/webhooks/w1')?.body).toEqual({
        isEnabled: false,
      }),
    )
    expect(await screen.findByText('Suscripción en pausa.')).toBeInTheDocument()
  })

  it('deletes a subscription after confirmation', async () => {
    const { calls } = mockApi(
      routes({ 'DELETE /api/v1/webhooks/w1': () => new Response(null, { status: 204 }) }),
    )
    renderApp('/admin/webhooks')
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    const dialog = await screen.findByRole('dialog')
    expect(calls.some((c) => c.key === 'DELETE /api/v1/webhooks/w1')).toBe(false)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
    await waitFor(() =>
      expect(calls.some((c) => c.key === 'DELETE /api/v1/webhooks/w1')).toBe(true),
    )
    expect(await screen.findByText('Suscripción eliminada.')).toBeInTheDocument()
  })

  it('is not available to employees', async () => {
    mockApi(routes({ 'GET /api/v1/me': () => json(meEmployee) }))
    renderApp('/admin/webhooks')
    await waitFor(() =>
      expect(screen.queryByText('https://hooks.example.com/entry')).not.toBeInTheDocument(),
    )
    expect(await screen.findByText(/permiso/i)).toBeInTheDocument()
  })
})

describe('webhooks admin: create a subscription', () => {
  const created = { ...hook, id: 'w2', secret: 'whsec_super_secret' }

  it('creates a subscription and shows the secret once', async () => {
    const { calls } = mockApi(routes({ 'POST /api/v1/webhooks': () => json(created, 201) }))
    renderApp('/admin/webhooks')
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva suscripción' }))
    await userEvent.type(
      await screen.findByLabelText('URL de destino'),
      'https://hooks.example.com/new',
    )
    await userEvent.click(screen.getByLabelText('Reserva reprogramada'))
    await userEvent.click(screen.getByRole('button', { name: 'Crear suscripción' }))
    await waitFor(() =>
      expect(calls.find((c) => c.key === 'POST /api/v1/webhooks')?.body).toEqual({
        url: 'https://hooks.example.com/new',
        events: ['booking.created', 'booking.cancelled'],
      }),
    )
    expect(await screen.findByDisplayValue('whsec_super_secret')).toBeInTheDocument()
    expect(screen.getByText(/única vez que se muestra/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ya lo he guardado' }))
    await waitFor(() =>
      expect(screen.queryByDisplayValue('whsec_super_secret')).not.toBeInTheDocument(),
    )
  })

  it('requires an https URL and at least one event', async () => {
    const { calls } = mockApi(routes())
    renderApp('/admin/webhooks')
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva suscripción' }))
    await userEvent.type(
      await screen.findByLabelText('URL de destino'),
      'http://insecure.example.com',
    )
    for (const name of ['Reserva creada', 'Reserva cancelada', 'Reserva reprogramada'])
      await userEvent.click(screen.getByLabelText(name))
    await userEvent.click(screen.getByRole('button', { name: 'Crear suscripción' }))
    expect(await screen.findByText('Indica una URL https válida.')).toBeInTheDocument()
    expect(screen.getByText('Elige al menos un evento.')).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'POST /api/v1/webhooks')).toBe(false)
  })

  it('explains a duplicate URL (409) and API field errors (400)', async () => {
    let status = 409
    mockApi(
      routes({
        'POST /api/v1/webhooks': () =>
          status === 409
            ? json({ title: 'Conflict' }, 409)
            : json({ title: 'Bad', errors: { Url: ['The host is not public.'] } }, 400),
      }),
    )
    renderApp('/admin/webhooks')
    await userEvent.click(await screen.findByRole('button', { name: 'Nueva suscripción' }))
    await userEvent.type(
      await screen.findByLabelText('URL de destino'),
      'https://hooks.example.com/entry',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Crear suscripción' }))
    expect(await screen.findByText('Ya hay una suscripción con esa URL.')).toBeInTheDocument()
    status = 400
    await userEvent.click(screen.getByRole('button', { name: 'Crear suscripción' }))
    expect(await screen.findByText('The host is not public.')).toBeInTheDocument()
  })
})

describe('webhooks admin: delivery log', () => {
  const delivery = (extra = {}) => ({
    id: 'd1',
    eventId: 'e1',
    eventType: 'booking.created',
    status: 'Succeeded',
    attempts: 1,
    nextAttemptAt: null,
    lastAttemptAt: '2030-01-02T10:00:00Z',
    lastStatusCode: 200,
    lastError: null,
    createdAt: '2030-01-02T10:00:00Z',
    completedAt: '2030-01-02T10:00:01Z',
    ...extra,
  })
  const pageOf = (items: object[], totalCount = items.length) => ({
    items,
    page: 1,
    pageSize: 20,
    totalCount,
  })

  it('opens the log from the list and shows each delivery', async () => {
    mockApi(
      routes({
        'GET /api/v1/webhooks/w1/deliveries': () =>
          json(
            pageOf([
              delivery(),
              delivery({
                id: 'd2',
                eventType: 'booking.cancelled',
                status: 'Failed',
                attempts: 5,
                lastStatusCode: 500,
                lastError: 'Server error',
              }),
              delivery({
                id: 'd3',
                status: 'Pending',
                lastStatusCode: null,
                nextAttemptAt: '2030-01-02T11:00:00Z',
              }),
            ]),
          ),
      }),
    )
    renderApp('/admin/webhooks')
    await userEvent.click(await screen.findByRole('button', { name: 'Entregas' }))
    expect(await screen.findByText('Correcta')).toBeInTheDocument()
    expect(screen.getByText('Fallida')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('HTTP 500')).toBeInTheDocument()
    expect(screen.getByText('Server error')).toBeInTheDocument()
    expect(screen.getByText('https://hooks.example.com/entry')).toBeInTheDocument()
  })

  it('filters by status and pages through the results', async () => {
    const { calls } = mockApi(
      routes({
        'GET /api/v1/webhooks/w1/deliveries': () => json(pageOf([delivery()], 45)),
      }),
    )
    renderApp('/admin/webhooks/w1/deliveries')
    await userEvent.selectOptions(await screen.findByLabelText('Estado'), 'Failed')
    await waitFor(() =>
      expect(
        calls.some((c) => c.key.endsWith('/deliveries') && c.search.includes('Status=Failed')),
      ).toBe(true),
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }))
    await waitFor(() =>
      expect(
        calls.some((c) => c.search.includes('Page=2') && c.search.includes('Status=Failed')),
      ).toBe(true),
    )
  })

  it('shows an empty state and a missing subscription', async () => {
    mockApi(
      routes({
        'GET /api/v1/webhooks/w1/deliveries': () => json(pageOf([])),
        'GET /api/v1/webhooks/nope/deliveries': () => json({ title: 'Not found' }, 404),
      }),
    )
    const { unmount } = renderApp('/admin/webhooks/w1/deliveries')
    expect(await screen.findByText('No hay entregas con estos filtros.')).toBeInTheDocument()
    unmount()
    renderApp('/admin/webhooks/nope/deliveries')
    expect(await screen.findByText('No existe esta suscripción.')).toBeInTheDocument()
  })
})
