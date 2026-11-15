import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLocale, type Locale } from '@/i18n'
import { json, meEmployee, mockApi, page, renderApp, room, rules } from '@/test/server'

vi.mock('@/hooks/useRoomOccupancy', () => ({
  useRoomOccupancy: () => ({ occupancy: null, connected: false }),
}))

afterEach(() => {
  vi.unstubAllGlobals()
  setLocale('es')
})

type Texts = {
  loginHeading: string
  start: string
  book: string
  chooseStart: string
  cancel: string
  cancelConfirm: string
  notFoundRoute: string
}

const texts: Record<Locale, Texts> = {
  es: {
    loginHeading: 'Iniciar sesión',
    start: 'Hora de inicio',
    book: 'Reservar',
    chooseStart: 'Elige la hora de inicio.',
    cancel: 'Cancelar',
    cancelConfirm: 'Cancelar reserva',
    notFoundRoute: 'Página no encontrada',
  },
  en: {
    loginHeading: 'Sign in',
    start: 'Start time',
    book: 'Book',
    chooseStart: 'Choose the start time.',
    cancel: 'Cancel',
    cancelConfirm: 'Cancel booking',
    notFoundRoute: 'Page not found',
  },
}

const baseRoutes = () => ({
  'GET /api/v1/me': () => json(meEmployee),
  'GET /api/v1/rules': () => json(rules),
})

describe.each(['es', 'en'] as const)('key flows in %s', (locale) => {
  const t = texts[locale]

  it('login', async () => {
    setLocale(locale)
    mockApi({})
    renderApp('/rooms', { signedIn: false })
    expect(await screen.findByRole('heading', { name: t.loginHeading })).toBeInTheDocument()
  })

  it('booking validation', async () => {
    setLocale(locale)
    const roomPath = `/api/v1/rooms/${room.id}`
    mockApi({
      ...baseRoutes(),
      [`GET ${roomPath}`]: () => json(room),
      [`GET ${roomPath}/schedule`]: () => json([]),
    })
    renderApp(`/rooms/${room.id}?date=2030-01-14`)
    await screen.findByRole('heading', { name: 'Sala Gaudí' })
    await waitFor(() => expect(screen.getByLabelText(t.start)).toBeEnabled())
    await userEvent.click(screen.getByRole('button', { name: t.book }))
    expect(await screen.findByText(t.chooseStart)).toBeInTheDocument()
  })

  it('cancel a booking', async () => {
    setLocale(locale)
    const start = new Date(Date.now() + 7 * 864e5).toISOString()
    const end = new Date(Date.now() + 7 * 864e5 + 36e5).toISOString()
    const { calls } = mockApi({
      ...baseRoutes(),
      'GET /api/v1/bookings/mine': () =>
        json(
          page([
            {
              id: 'b1',
              roomId: room.id,
              organizerId: 'u1',
              title: 'Reunión',
              startAt: start,
              endAt: end,
              attendees: 3,
              status: 'Confirmed',
              createdAt: start,
              cancelledAt: null,
            },
          ]),
        ),
      'POST /api/v1/bookings/b1/cancel': () => new Response(null, { status: 204 }),
    })
    renderApp('/bookings')
    await userEvent.click(await screen.findByRole('button', { name: t.cancel }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: t.cancelConfirm }))
    await waitFor(() =>
      expect(calls.some((c) => c.key === 'POST /api/v1/bookings/b1/cancel')).toBe(true),
    )
  })

  it('the 404 page', async () => {
    setLocale(locale)
    mockApi(baseRoutes())
    renderApp('/nowhere')
    expect(await screen.findByText(t.notFoundRoute)).toBeInTheDocument()
  })
})

describe('language switcher', () => {
  it('changes the visible text and keeps the page', async () => {
    mockApi({ ...baseRoutes(), 'GET /api/v1/rooms': () => json(page([room])) })
    renderApp('/rooms')
    await screen.findByRole('link', { name: 'Sala Gaudí' })
    await userEvent.selectOptions(screen.getByLabelText('Idioma'), 'en')
    expect(await screen.findByRole('heading', { name: 'Rooms' })).toBeInTheDocument()
    expect(screen.getByLabelText('Minimum capacity')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })
})
