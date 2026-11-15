import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useState } from 'react'
import { config } from '@/lib/config'
import { getAccessToken } from '@/api/client'
import type { components } from '@/api/schema'

export type Occupancy = components['schemas']['RoomOccupancy']
type State = { occupancy: Occupancy | null; connected: boolean }

/**
 * Ocupación en directo de una sala por SSE. `EventSource` no permite la cabecera Authorization, por eso se usa
 * fetch. Se abre al montar y se cierra al salir; se reconecta sola si el servidor corta la conexión.
 */
export function useRoomOccupancy(roomId: string, enabled = true): State {
  const [state, setState] = useState<State>({ occupancy: null, connected: false })

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    void (async () => {
      const token = await getAccessToken()
      await fetchEventSource(`${config.apiUrl}/api/v1/rooms/${roomId}/occupancy`, {
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        openWhenHidden: false,
        onopen: async (res) => {
          if (!res.ok) throw new Error(`SSE ${res.status}`)
          setState((s) => ({ ...s, connected: true }))
        },
        onmessage: (msg) => {
          if (!msg.data) return
          try {
            setState({ occupancy: JSON.parse(msg.data) as Occupancy, connected: true })
          } catch {
            /* mensaje que no es JSON: se ignora */
          }
        },
        onerror: () => {
          setState((s) => ({ ...s, connected: false }))
          // Devolver (sin lanzar) deja que la librería reintente con su espera por defecto.
        },
      })
    })()
    return () => controller.abort()
  }, [roomId, enabled])

  return state
}
