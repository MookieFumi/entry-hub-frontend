import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLocale } from '@/i18n'
import { json, meEmployee, meFacilities, mockApi, renderApp, rules } from '@/test/server'

afterEach(() => {
  vi.unstubAllGlobals()
  setLocale('es')
})

const SITE = '22222222-2222-2222-2222-222222222222'
const site = { id: SITE, name: 'Sede central', timeZone: 'Europe/Madrid' }
const holiday = { id: 'h1', siteId: SITE, date: '2030-01-01', name: 'Año Nuevo' }

const routes = (me = meFacilities) => ({
  'GET /api/v1/me': () => json(me),
  'GET /api/v1/rules': () => json(rules),
  'GET /api/v1/sites': () => json([site]),
  [`GET /api/v1/sites/${SITE}/holidays`]: () => json([holiday]),
})

describe('closed days administration', () => {
  it('lists the closed days of the first site', async () => {
    mockApi(routes())
    renderApp('/admin/closed-days')
    expect(await screen.findByRole('heading', { name: 'Días cerrados' })).toBeInTheDocument()
    expect(await screen.findByText('Año Nuevo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Días cerrados' })).toBeInTheDocument()
  })

  it('an Employee has no access', async () => {
    mockApi(routes(meEmployee))
    renderApp('/admin/closed-days')
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument()
  })

  it('adds a closed day', async () => {
    const { calls } = mockApi({
      ...routes(),
      [`POST /api/v1/sites/${SITE}/holidays`]: () =>
        json({ ...holiday, id: 'h2', date: '2030-12-25', name: 'Navidad' }, 201),
    })
    renderApp('/admin/closed-days')
    await userEvent.type(await screen.findByLabelText('Día'), '2030-12-25')
    await userEvent.type(screen.getByLabelText('Nombre (opcional)'), 'Navidad')
    await userEvent.click(screen.getByRole('button', { name: 'Añadir día cerrado' }))
    await waitFor(() =>
      expect(calls.find((c) => c.key.startsWith('POST'))?.body).toEqual({
        date: '2030-12-25',
        name: 'Navidad',
      }),
    )
  })

  it('validates the date before sending', async () => {
    const { calls } = mockApi(routes())
    renderApp('/admin/closed-days')
    await userEvent.click(await screen.findByRole('button', { name: 'Añadir día cerrado' }))
    expect(await screen.findByText('Elige un día.')).toBeInTheDocument()
    expect(calls.some((c) => c.key.startsWith('POST'))).toBe(false)
  })

  it('shows a duplicate day (409)', async () => {
    mockApi({
      ...routes(),
      [`POST /api/v1/sites/${SITE}/holidays`]: () => json({ title: 'Day already closed' }, 409),
    })
    renderApp('/admin/closed-days')
    await userEvent.type(await screen.findByLabelText('Día'), '2030-01-01')
    await userEvent.click(screen.getByRole('button', { name: 'Añadir día cerrado' }))
    expect(await screen.findByText('Ese día ya está cerrado.')).toBeInTheDocument()
  })

  it('reopens a day after confirmation, in English too', async () => {
    setLocale('en')
    const { calls } = mockApi({
      ...routes(),
      [`DELETE /api/v1/sites/${SITE}/holidays/h1`]: () => new Response(null, { status: 204 }),
    })
    renderApp('/admin/closed-days')
    await userEvent.click(await screen.findByRole('button', { name: 'Reopen' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Reopen 2030-01-01?')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reopen' }))
    await waitFor(() => expect(calls.some((c) => c.key.startsWith('DELETE'))).toBe(true))
  })
})
