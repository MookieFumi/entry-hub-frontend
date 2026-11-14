import createClient, { type Middleware } from 'openapi-fetch'
import { config } from '@/lib/config'
import { toApiError } from './errors'
import type { paths } from './schema'

type TokenProvider = () => Promise<string | null> | string | null

let getToken: TokenProvider = () => null

/** La capa de autenticación (Supabase) registra aquí cómo obtener el token de acceso vigente. */
export function setTokenProvider(provider: TokenProvider) {
  getToken = provider
}

/** Token vigente (para flujos que no pasan por openapi-fetch, como el SSE). */
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
 * Desenvuelve una respuesta de openapi-fetch: devuelve `data` o lanza un ApiError ya interpretado.
 * Uso: `const rooms = await unwrap(api.GET('/api/v1/rooms'))`.
 */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result
  try {
    result = await request
  } catch {
    // Fallo de red, CORS o API dormida (arranque en frío): para la interfaz es "no disponible".
    throw toApiError(503, { detail: 'No se pudo contactar con el servidor.' })
  }
  if (result.error !== undefined || !result.response.ok) {
    throw toApiError(result.response.status, result.error)
  }
  return result.data as T
}
