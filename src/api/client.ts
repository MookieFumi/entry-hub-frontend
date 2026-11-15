import createClient, { type Middleware } from 'openapi-fetch'
import { config } from '@/lib/config'
import { toApiError } from './errors'
import type { paths } from './schema'

type TokenProvider = () => Promise<string | null> | string | null

let getToken: TokenProvider = () => null

/** The authentication layer (Supabase) registers here how to get the current access token. */
export function setTokenProvider(provider: TokenProvider) {
  getToken = provider
}

/** Current token (for flows that do not go through openapi-fetch, such as SSE). */
export async function getAccessToken(): Promise<string | null> {
  return await getToken()
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = await getToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
}

export function createApiClient(baseUrl = config.apiUrl) {
  const client = createClient<paths>({ baseUrl, fetch: (request) => globalThis.fetch(request) })
  client.use(authMiddleware)
  return client
}

export const api = createApiClient()

/**
 * Unwraps an openapi-fetch response: returns `data` or throws an already interpreted ApiError.
 * Usage: `const rooms = await unwrap(api.GET('/api/v1/rooms'))`.
 */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result
  try {
    result = await request
  } catch {
    // Network failure, CORS or a sleeping API (cold start): for the UI it is "unavailable".
    throw toApiError(503, { detail: 'No se pudo contactar con el servidor.' })
  }
  if (result.error !== undefined || !result.response.ok) {
    throw toApiError(result.response.status, result.error)
  }
  return result.data as T
}
