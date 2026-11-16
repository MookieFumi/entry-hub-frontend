import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, meFacilities, mockApi, renderApp, rules } from '@/test/server'

afterEach(() => vi.unstubAllGlobals())

const routes = (extra = {}) => ({
  'GET /api/v1/me': () => json(meFacilities),
  'GET /api/v1/rules': () => json(rules),
  ...extra,
})

describe('booking rules screen', () => {
  it('saves the auto-release with the other rules', async () => {
    const { calls } = mockApi(
      routes({ 'PUT /api/v1/rules': () => json({ ...rules, autoReleaseMinutes: 15 }) }),
    )
    renderApp('/admin/rules')
    const field = await screen.findByLabelText('Liberación automática (minutos)')
    await userEvent.clear(field)
    await userEvent.type(field, '15')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(calls.find((c) => c.key === 'PUT /api/v1/rules')?.body).toMatchObject({
        autoReleaseMinutes: 15,
        slotMinutes: 15,
        maxActiveBookings: 5,
      }),
    )
    expect(await screen.findByText('Reglas guardadas.')).toBeInTheDocument()
  })

  it('validates the ranges before sending', async () => {
    const { calls } = mockApi(routes())
    renderApp('/admin/rules')
    const field = await screen.findByLabelText('Liberación automática (minutos)')
    await userEvent.clear(field)
    await userEvent.type(field, '500')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Debe ser un número entero entre 0 y 240.')).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'PUT /api/v1/rules')).toBe(false)
  })

  it('shows the field errors of the API', async () => {
    mockApi(
      routes({
        'PUT /api/v1/rules': () =>
          json({ title: 'Bad', errors: { SlotMinutes: ['It must divide an hour.'] } }, 400),
      }),
    )
    renderApp('/admin/rules')
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('It must divide an hour.')).toBeInTheDocument()
  })

  it('is not available to employees', async () => {
    mockApi(routes({ 'GET /api/v1/me': () => json(meEmployee) }))
    renderApp('/admin/rules')
    await waitFor(() =>
      expect(screen.queryByLabelText('Liberación automática (minutos)')).not.toBeInTheDocument(),
    )
    expect(await screen.findByText(/permiso/i)).toBeInTheDocument()
  })
})
