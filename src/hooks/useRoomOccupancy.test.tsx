import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setTokenProvider } from '@/api/client'
import { useRoomOccupancy } from './useRoomOccupancy'

afterEach(() => {
  vi.unstubAllGlobals()
  setTokenProvider(() => null)
})

const event = (data: unknown) => `data: ${JSON.stringify(data)}\n\n`
const occupancy = (status: 'Free' | 'Occupied') => ({
  roomId: 'r1',
  status,
  at: '2030-01-14T09:00:00Z',
  nextChange: null,
})

/** A fetch whose body is an SSE stream that the test controls. */
function sseFetch() {
  const encoder = new TextEncoder()
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
    },
  })
  const signals: AbortSignal[] = []
  const headers: Headers[] = []
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    signals.push(init!.signal as AbortSignal)
    headers.push(new Headers(init?.headers))
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return {
    fetchMock,
    signals,
    headers,
    push: (data: unknown) => controller.enqueue(encoder.encode(event(data))),
    pushRaw: (text: string) => controller.enqueue(encoder.encode(`data: ${text}\n\n`)),
  }
}

describe('useRoomOccupancy', () => {
  it('sends the Bearer token and follows the stream', async () => {
    setTokenProvider(() => 'tok')
    const sse = sseFetch()
    const { result } = renderHook(() => useRoomOccupancy('r1'))
    await waitFor(() => expect(result.current.connected).toBe(true))
    expect(sse.headers[0]?.get('Authorization')).toBe('Bearer tok')
    expect(String(sse.fetchMock.mock.calls[0]?.[0])).toContain('/api/v1/rooms/r1/occupancy')

    sse.push(occupancy('Free'))
    await waitFor(() => expect(result.current.occupancy?.status).toBe('Free'))
    sse.push(occupancy('Occupied'))
    await waitFor(() => expect(result.current.occupancy?.status).toBe('Occupied'))
  })

  it('ignores messages that are not JSON', async () => {
    const sse = sseFetch()
    const { result } = renderHook(() => useRoomOccupancy('r1'))
    await waitFor(() => expect(result.current.connected).toBe(true))
    sse.push(occupancy('Free'))
    await waitFor(() => expect(result.current.occupancy?.status).toBe('Free'))
    // Not JSON: the last good state stays.
    sse.pushRaw('not json')
    sse.push(occupancy('Occupied'))
    await waitFor(() => expect(result.current.occupancy?.status).toBe('Occupied'))
  })

  it('closes the stream when the component unmounts', async () => {
    const sse = sseFetch()
    const { result, unmount } = renderHook(() => useRoomOccupancy('r1'))
    await waitFor(() => expect(result.current.connected).toBe(true))
    expect(sse.signals[0]?.aborted).toBe(false)
    unmount()
    expect(sse.signals[0]?.aborted).toBe(true)
  })

  it('does not open a stream when disabled', () => {
    const sse = sseFetch()
    renderHook(() => useRoomOccupancy('r1', false))
    expect(sse.fetchMock).not.toHaveBeenCalled()
  })

  it('reports not connected when the server refuses the stream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('no', { status: 403 })),
    )
    const { result, unmount } = renderHook(() => useRoomOccupancy('r1'))
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(result.current.connected).toBe(false)
    unmount()
  })
})
