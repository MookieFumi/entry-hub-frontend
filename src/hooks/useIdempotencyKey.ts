import { useRef } from 'react'

/**
 * Returns a function that gives the `Idempotency-Key` for a request body. The same body keeps the same
 * key (so a retry after a timeout cannot create a second booking); a different body gets a new one,
 * because the API rejects the same key with a different body.
 */
export function useIdempotencyKey() {
  const last = useRef<{ signature: string; key: string } | null>(null)
  return (payload: unknown): string => {
    const signature = JSON.stringify(payload)
    if (last.current?.signature !== signature) {
      last.current = { signature, key: crypto.randomUUID() }
    }
    return last.current.key
  }
}
