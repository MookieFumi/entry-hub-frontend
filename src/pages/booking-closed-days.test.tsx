import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLocale } from '@/i18n'
import { json, meEmployee, mockApi, renderApp, room, rules } from '@/test/server'

vi.mock('@/hooks/useRoomOccupancy', () => ({
  useRoomOccupancy: () => ({ occupancy: null, connected: false }),
}))

afterEach(() => {
  vi.unstubAllGlobals()
  setLocale('es')
})

const SITE = '22222222-2222-2222-2222-222222222222'
const siteRoom = { ...room, siteId: SITE }
const roomPath = `/api/v1/rooms/${room.id}`
const holidays = [
  { id: 'h1', siteId: SITE, date: '2030-01-14', name: 'Fiesta local' },
  { id: 'h2', siteId: SITE, date: '2030-02-04', name: null },
]

const routes = () => ({
  'GET /api/v1/me': () => json(meEmployee),
  'GET /api/v1/rules': () => json(rules),
  [`GET ${roomPath}`]: () => json(siteRoom),
  [`GET ${roomPath}/schedule`]: () => json([]),
  [`GET /api/v1/sites/${SITE}/holidays`]: () => json(holidays),
})

describe('booking form and closed days', () => {
  it('flags a closed day, names it and blocks the booking', async () => {
    const { calls } = mockApi(routes())
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    expect(
      await screen.findByText('La sede está cerrada ese día (Fiesta local): no se puede reservar.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Hora de inicio')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeDisabled()
    expect(screen.getByText(/Próximos días cerrados: 2030-02-04\./)).toBeInTheDocument()
    expect(calls.find((c) => c.key.endsWith('/holidays'))?.search).toContain('From=')
  })

  it('does not flag an open day, and the texts follow the language', async () => {
    setLocale('en')
    mockApi(routes())
    renderApp(`/rooms/${room.id}?date=2030-01-15`)
    await waitFor(() => expect(screen.getByLabelText('Start time')).toBeEnabled())
    expect(screen.queryByText(/The site is closed that day/)).not.toBeInTheDocument()
    expect(await screen.findByText(/Next closed days: 2030-02-04\./)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '2030-01-14' } })
    expect(
      await screen.findByText(/The site is closed that day \(Fiesta local\)/),
    ).toBeInTheDocument()
  })
})
