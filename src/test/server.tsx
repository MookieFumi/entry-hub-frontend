import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { RouterProvider } from 'react-router/dom'
import { vi } from 'vitest'
import { AuthProvider } from '@/auth/AuthProvider'
import { ToastProvider } from '@/components/ui/Toasts'
import { createTestRouter } from '@/router'

type Handler = (req: Request) => Response | Promise<Response>
export type Routes = Record<string, Handler>

export const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: status >= 400 ? { 'Content-Type': 'application/problem+json' } : undefined,
  })

export const rules = {
  minDurationMinutes: 15,
  maxDurationMinutes: 240,
  slotMinutes: 15,
  officeOpens: '08:00',
  officeCloses: '20:00',
  officeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  timeZone: 'Europe/Madrid',
  minLeadTimeMinutes: 15,
  maxAdvanceDays: 90,
  cancellationNoticeMinutes: 15,
  maxActiveBookings: 5,
}

export const room = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Sala Gaudí',
  floor: 2,
  capacity: 8,
  equipment: ['TV'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
}

export const page = <T,>(items: T[]) => ({ items, page: 1, pageSize: 20, totalCount: items.length })

/** Replaces `fetch` with a test server with "METHOD /path" routes. Anything not registered returns 404. */
export function mockApi(routes: Routes) {
  const calls: { key: string; body: unknown; search: string }[] = []
  const fetchMock = vi.fn(async (input: Request | string, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input, init)
    const url = new URL(req.url)
    const key = `${req.method} ${url.pathname}`
    calls.push({
      search: url.search,
      key,
      body:
        req.method === 'GET'
          ? null
          : await req
              .clone()
              .json()
              .catch(() => null),
    })
    const handler = routes[key]
    return handler ? handler(req) : json({ title: 'Not found' }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls }
}

export function renderApp(path: string, { signedIn = true }: { signedIn?: boolean } = {}) {
  sessionStorage.clear()
  if (signedIn) sessionStorage.setItem('entryhub.devToken', 'test-token')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createTestRouter(path)
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

export const meEmployee = { userId: 'u1', role: 'Employee', tenantId: 't1', tenantName: 'Acme' }
export const meFacilities = { ...meEmployee, role: 'Facilities' }
