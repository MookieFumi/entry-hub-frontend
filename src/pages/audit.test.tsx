import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, meEmployee, meFacilities, mockApi, renderApp, rules } from '@/test/server'

afterEach(() => vi.unstubAllGlobals())

const entry = (extra = {}) => ({
  id: 'a1',
  at: '2030-01-02T10:00:00Z',
  actorId: 'ana',
  action: 'Cancelled',
  entityType: 'Booking',
  entityId: 'b1',
  summary: 'Weekly sync',
  ...extra,
})
const pageOf = (items: object[], totalCount = items.length) => ({
  items,
  page: 1,
  pageSize: 25,
  totalCount,
})
const routes = (extra = {}) => ({
  'GET /api/v1/me': () => json(meFacilities),
  'GET /api/v1/rules': () => json(rules),
  'GET /api/v1/audit': () =>
    json(
      pageOf([
        entry(),
        entry({ id: 'a2', action: 'Updated', entityType: 'Rules', summary: 'SlotMinutes' }),
      ]),
    ),
  ...extra,
})

describe('audit trail', () => {
  it('lists the changes in Spanish', async () => {
    mockApi(routes())
    renderApp('/admin/audit')
    expect(await screen.findByText('Cancelación')).toBeInTheDocument()
    expect(screen.getByText('Weekly sync')).toBeInTheDocument()
    expect(screen.getByText('Modificación')).toBeInTheDocument()
    expect(screen.getAllByText('ana')).toHaveLength(2)
  })

  it('filters by type, person and day and pages', async () => {
    const { calls } = mockApi(routes({ 'GET /api/v1/audit': () => json(pageOf([entry()], 80)) }))
    renderApp('/admin/audit')
    await userEvent.selectOptions(await screen.findByLabelText('Tipo'), 'Room')
    await userEvent.type(screen.getByLabelText('Persona'), 'ana')
    await waitFor(() =>
      expect(
        calls.some((c) => c.search.includes('EntityType=Room') && c.search.includes('ActorId=ana')),
      ).toBe(true),
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(calls.some((c) => c.search.includes('Page=2'))).toBe(true))
  })

  it('shows an empty state', async () => {
    mockApi(routes({ 'GET /api/v1/audit': () => json(pageOf([])) }))
    renderApp('/admin/audit')
    expect(await screen.findByText('No hay cambios con estos filtros.')).toBeInTheDocument()
  })

  it('is not available to employees', async () => {
    mockApi(routes({ 'GET /api/v1/me': () => json(meEmployee) }))
    renderApp('/admin/audit')
    expect(await screen.findByText(/permiso/i)).toBeInTheDocument()
    expect(screen.queryByText('Weekly sync')).not.toBeInTheDocument()
  })
})
