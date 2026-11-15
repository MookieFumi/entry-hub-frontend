import type { Page, Route } from '@playwright/test'

/** Office rules served by the simulated API. */
export const rules = {
  minDurationMinutes: 15,
  maxDurationMinutes: 240,
  slotMinutes: 15,
  officeOpens: '08:00',
  officeCloses: '20:00',
  officeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  timeZone: 'Europe/Madrid',
  minLeadTimeMinutes: 15,
  maxAdvanceDays: 3650,
  cancellationNoticeMinutes: 15,
  maxActiveBookings: 5,
}

/** A Monday far in the future, so the tests do not depend on today's date. */
export const BOOKING_DAY = '2030-01-14'

const features = [
  { id: 'f1', code: 'tv', name: 'TV', kind: 'Equipment', isActive: true },
  {
    id: 'f3',
    code: 'step-free',
    name: 'Acceso sin escalones',
    kind: 'Accessibility',
    isActive: true,
  },
]

type Room = {
  id: string
  name: string
  floor: number
  capacity: number
  equipment: string[]
  features: typeof features
  isActive: boolean
  createdAt: string
}
type Booking = {
  id: string
  roomId: string
  organizerId: string
  title: string
  startAt: string
  endAt: string
  attendees: number
  status: 'Confirmed' | 'Cancelled'
  createdAt: string
  cancelledAt: string | null
  rescheduledAt?: string | null
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: status >= 400 ? 'application/problem+json' : 'application/json',
    body: JSON.stringify(body),
  })

const paged = <T>(items: T[]) => ({ items, page: 1, pageSize: 20, totalCount: items.length })

/**
 * Simulates the API in the browser with a small in-memory state, so a flow (create, then list)
 * behaves like the real thing. The token chooses the role: `facilities` gives Facilities, anything else Employee.
 */
export async function mockApi(page: Page) {
  const inDays = (days: number, hour: number) => {
    const d = new Date(Date.now() + days * 864e5)
    d.setUTCHours(hour, 0, 0, 0)
    return d.toISOString()
  }
  const rooms: Room[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Sala Gaudí',
      floor: 2,
      capacity: 8,
      equipment: ['TV'],
      features: [features[0]!],
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ]
  const bookings: Booking[] = [
    {
      id: 'b-existing',
      roomId: rooms[0]!.id,
      organizerId: 'u1',
      title: 'Weekly sync',
      startAt: inDays(7, 9),
      endAt: inDays(7, 10),
      attendees: 3,
      status: 'Confirmed',
      createdAt: '2026-01-01T00:00:00Z',
      cancelledAt: null,
    },
  ]

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1', '')
    const method = request.method()
    const token = (request.headers()['authorization'] ?? '').replace('Bearer ', '')

    if (method === 'GET' && path === '/me') {
      return json(route, {
        userId: 'u1',
        role: token.includes('facilities') ? 'Facilities' : 'Employee',
        tenantId: 't1',
        tenantName: 'Acme',
      })
    }
    if (method === 'GET' && path === '/rules') return json(route, rules)
    if (method === 'GET' && path === '/health') {
      return json(route, { status: 'Healthy', database: 'Healthy' })
    }
    if (method === 'GET' && path === '/features') return json(route, features)
    if (method === 'GET' && path === '/rooms') return json(route, paged(rooms))
    if (method === 'POST' && path === '/rooms') {
      const body = request.postDataJSON() as {
        name: string
        floor: number
        capacity: number
        equipment: string[]
        featureIds: string[] | null
      }
      if (rooms.some((r) => r.name === body.name)) return json(route, { title: 'Conflict' }, 409)
      const room = {
        name: body.name,
        floor: body.floor,
        capacity: body.capacity,
        equipment: body.equipment,
        features: features.filter((f) => body.featureIds?.includes(f.id)),
        id: crypto.randomUUID(),
        isActive: true,
        createdAt: new Date().toISOString(),
      }
      rooms.push(room)
      return json(route, room, 201)
    }
    const roomMatch = path.match(/^\/rooms\/([^/]+)(\/schedule|\/occupancy)?$/)
    if (method === 'GET' && roomMatch) {
      const room = rooms.find((r) => r.id === roomMatch[1])
      if (!room) return json(route, { title: 'Not found' }, 404)
      if (roomMatch[2] === '/schedule') {
        return json(
          route,
          bookings
            .filter((b) => b.roomId === room.id && b.status === 'Confirmed')
            .map((b) => ({
              bookingId: b.id,
              startAt: b.startAt,
              endAt: b.endAt,
              isMine: true,
              title: b.title,
              organizerId: b.organizerId,
            })),
        )
      }
      if (roomMatch[2] === '/occupancy') {
        // One event, then the stream ends; the client keeps its last state.
        return route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: `data: ${JSON.stringify({ roomId: room.id, status: 'Free', at: new Date().toISOString(), nextChange: null })}\n\n`,
        })
      }
      return json(route, room)
    }
    if (method === 'GET' && path === '/bookings/mine') {
      return json(route, paged(bookings))
    }
    if (method === 'POST' && path === '/bookings') {
      const body = request.postDataJSON() as Pick<
        Booking,
        'roomId' | 'title' | 'startAt' | 'endAt' | 'attendees'
      >
      const booking: Booking = {
        ...body,
        id: crypto.randomUUID(),
        organizerId: 'u1',
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
        cancelledAt: null,
      }
      bookings.push(booking)
      return json(route, booking, 201)
    }
    const bookingMatch = path.match(/^\/bookings\/([^/]+)(\/cancel|\/reschedule)?$/)
    if (bookingMatch) {
      const booking = bookings.find((b) => b.id === bookingMatch[1])
      if (!booking) return json(route, { title: 'Not found' }, 404)
      if (method === 'POST' && bookingMatch[2] === '/reschedule') {
        const body = request.postDataJSON() as { startAt: string; endAt: string }
        booking.startAt = body.startAt
        booking.endAt = body.endAt
        booking.rescheduledAt = new Date().toISOString()
        return json(route, booking)
      }
      if (method === 'POST' && bookingMatch[2]) {
        booking.status = 'Cancelled'
        booking.cancelledAt = new Date().toISOString()
        return route.fulfill({ status: 204 })
      }
      if (method === 'GET') return json(route, booking)
    }
    return json(route, { title: 'Not found' }, 404)
  })
}

/** Signs in through the development login (no Supabase): the token is just a label for the simulated API. */
export async function signIn(page: Page, token = 'employee') {
  await page.goto('/login')
  await page.getByLabel('Token de acceso').fill(token)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL('/')
}
