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
