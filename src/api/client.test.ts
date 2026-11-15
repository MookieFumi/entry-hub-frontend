import { createApiClient, setTokenProvider, unwrap } from './client'

function fakeFetch(handler: (req: Request) => Response) {
  return vi.fn(async (input: Request) => handler(input))
}

describe('API client', () => {
  afterEach(() => setTokenProvider(() => null))

  it('sends the token as Bearer', async () => {
    setTokenProvider(() => 'token-123')
    let auth: string | null = null
    const fetchMock = fakeFetch((req) => {
      auth = req.headers.get('Authorization')
      return Response.json({ items: [], page: 1, pageSize: 20, totalCount: 0 })
    })
    const client = createApiClient('http://api.test')
    const page = await unwrap(
      client.GET('/api/v1/rooms', { fetch: fetchMock as unknown as typeof fetch }),
    )
    expect(auth).toBe('Bearer token-123')
    expect(page.items).toEqual([])
  })

  it('throws an ApiError with the 422 violations', async () => {
    const fetchMock = fakeFetch(
      () =>
        new Response(
          JSON.stringify({
            status: 422,
            violations: [{ code: 'RoomUnavailable', message: 'busy' }],
          }),
          { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
        ),
    )
    const client = createApiClient('http://api.test')
    await expect(
      unwrap(
        client.POST('/api/v1/bookings', {
          body: {
            roomId: '00000000-0000-0000-0000-000000000001',
            title: 't',
            startAt: '2026-12-01T09:00:00Z',
            endAt: '2026-12-01T10:00:00Z',
            attendees: 2,
          },
          fetch: fetchMock as unknown as typeof fetch,
        }),
      ),
    ).rejects.toMatchObject({ kind: 'rules-broken', status: 422 })
  })

  it('treats a network failure as API unavailable', async () => {
    await expect(unwrap(Promise.reject(new TypeError('Failed to fetch')))).rejects.toMatchObject({
      kind: 'unavailable',
    })
  })
})
