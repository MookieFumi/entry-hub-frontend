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
