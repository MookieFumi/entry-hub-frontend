import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, meFacilities, mockApi, renderApp, rules } from '@/test/server'
import { slug } from '@/lib/download'

afterEach(() => vi.unstubAllGlobals())

const exportDoc = { tenantId: 't1', tenantName: 'Acme Ñandú', exportedAt: '2030-01-01T00:00:00Z' }
const routes = (extra = {}) => ({
  'GET /api/v1/me': () => json(meFacilities),
  'GET /api/v1/rules': () => json(rules),
  'GET /api/v1/tenant/export': () => json(exportDoc),
  ...extra,
})

describe('slug', () => {
  it('makes a file-name friendly name', () => {
    expect(slug('Acme Ñandú, S.L.')).toBe('acme-nandu-s-l')
    expect(slug('!!!')).toBe('tenant')
  })
})

describe('tenant data export', () => {
  it('downloads the export as a JSON file named after the tenant', async () => {
    const clicks: string[] = []
    const create = vi.fn(() => 'blob:x')
    const revoke = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this.download)
    })
    mockApi(routes())
    renderApp('/admin/data')
    await userEvent.click(await screen.findByRole('button', { name: 'Descargar JSON' }))
    await waitFor(() => expect(clicks).toHaveLength(1))
    expect(clicks[0]).toMatch(/^acme-nandu-\d{4}-\d{2}-\d{2}\.json$/)
    expect(revoke).toHaveBeenCalled()
    expect(await screen.findByText('Datos descargados.')).toBeInTheDocument()
    click.mockRestore()
  })

  it('shows the error when the export fails', async () => {
    mockApi(routes({ 'GET /api/v1/tenant/export': () => json({ title: 'Not found' }, 404) }))
    renderApp('/admin/data')
    await userEvent.click(await screen.findByRole('button', { name: 'Descargar JSON' }))
    expect(await screen.findByText('Not found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar JSON' })).toBeEnabled()
  })

  it('is not available to employees', async () => {
    mockApi(routes({ 'GET /api/v1/me': () => json(meEmployee) }))
    renderApp('/admin/data')
    expect(await screen.findByText(/permiso/i)).toBeInTheDocument()
  })
})

describe('tenant data deletion', () => {
  const del = {
    deletedAt: '2030-01-01T00:00:00Z',
    bookings: 12,
    rooms: 3,
    sites: 1,
    features: 4,
    blocks: 2,
    holidays: 5,
    auditEntries: 40,
  }

  it('keeps the confirm button disabled until the exact phrase is typed', async () => {
    const { calls } = mockApi(routes({ 'DELETE /api/v1/tenant/data': () => json(del) }))
    renderApp('/admin/data')
    await userEvent.click(await screen.findByRole('button', { name: 'Borrar todos los datos…' }))
    const confirm = await screen.findByRole('button', { name: 'Borrar definitivamente' })
    expect(confirm).toBeDisabled()
    const field = screen.getByLabelText(/Escribe/)
    await userEvent.type(field, 'DELETE acme')
    expect(confirm).toBeDisabled()
    expect(screen.getByText('El texto no coincide.')).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'DELETE /api/v1/tenant/data')).toBe(false)
    await userEvent.clear(field)
    await userEvent.type(field, 'DELETE Acme')
    expect(confirm).toBeEnabled()
  })

  it('deletes with the confirmation and lists what was removed', async () => {
    const { calls } = mockApi(routes({ 'DELETE /api/v1/tenant/data': () => json(del) }))
    renderApp('/admin/data')
    await userEvent.click(await screen.findByRole('button', { name: 'Borrar todos los datos…' }))
    await userEvent.type(await screen.findByLabelText(/Escribe/), 'DELETE Acme')
    await userEvent.click(screen.getByRole('button', { name: 'Borrar definitivamente' }))
    await waitFor(() =>
      expect(calls.find((c) => c.key === 'DELETE /api/v1/tenant/data')?.body).toEqual({
        confirmation: 'DELETE Acme',
      }),
    )
    expect(await screen.findByText(/Se han borrado 12 reservas, 3 salas/)).toBeInTheDocument()
  })

  it('shows the API error', async () => {
    mockApi(
      routes({
        'DELETE /api/v1/tenant/data': () =>
          json({ title: 'Bad', detail: 'Confirmation mismatch' }, 400),
      }),
    )
    renderApp('/admin/data')
    await userEvent.click(await screen.findByRole('button', { name: 'Borrar todos los datos…' }))
    await userEvent.type(await screen.findByLabelText(/Escribe/), 'DELETE Acme')
    await userEvent.click(screen.getByRole('button', { name: 'Borrar definitivamente' }))
    expect(await screen.findByText('Confirmation mismatch')).toBeInTheDocument()
  })
})
