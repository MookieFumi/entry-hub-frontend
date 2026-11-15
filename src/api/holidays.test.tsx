import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, mockApi } from '@/test/server'
import { useCreateHoliday, useDeleteHoliday, useSiteHolidays, useSites } from './queries'

afterEach(() => vi.unstubAllGlobals())

const SITE = '22222222-2222-2222-2222-222222222222'
const holiday = { id: 'h1', siteId: SITE, date: '2030-01-01', name: 'New Year' }

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('site and holiday hooks', () => {
  it('lists sites', async () => {
    mockApi({ 'GET /api/v1/sites': () => json([{ id: SITE, name: 'HQ' }]) })
    const { result } = renderHook(() => useSites(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data).toHaveLength(1))
  })

  it('lists the holidays of a site with the date range', async () => {
    const { calls } = mockApi({
      [`GET /api/v1/sites/${SITE}/holidays`]: () => json([holiday]),
    })
    const { result } = renderHook(() => useSiteHolidays(SITE, '2030-01-01', '2030-01-31'), {
      wrapper: wrapper(),
    })
    await waitFor(() => expect(result.current.data).toEqual([holiday]))
    expect(calls[0]?.search).toContain('From=2030-01-01')
    expect(calls[0]?.search).toContain('To=2030-01-31')
  })

  it('does not call the API without a site', () => {
    const { calls } = mockApi({})
    renderHook(() => useSiteHolidays(undefined), { wrapper: wrapper() })
    expect(calls).toHaveLength(0)
  })

  it('creates and deletes a holiday', async () => {
    const { calls } = mockApi({
      [`POST /api/v1/sites/${SITE}/holidays`]: () => json(holiday, 201),
      [`DELETE /api/v1/sites/${SITE}/holidays/h1`]: () => new Response(null, { status: 204 }),
    })
    const create = renderHook(() => useCreateHoliday(SITE), { wrapper: wrapper() })
    await create.result.current.mutateAsync({ date: '2030-01-01', name: 'New Year' })
    const del = renderHook(() => useDeleteHoliday(SITE), { wrapper: wrapper() })
    await del.result.current.mutateAsync('h1')
    expect(calls.map((c) => c.key)).toEqual([
      `POST /api/v1/sites/${SITE}/holidays`,
      `DELETE /api/v1/sites/${SITE}/holidays/h1`,
    ])
    expect(calls[0]?.body).toEqual({ date: '2030-01-01', name: 'New Year' })
  })
})
