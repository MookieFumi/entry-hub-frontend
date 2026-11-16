import { hasMessage, useT, type MessageKey } from '@/i18n'

/** Name of an event in the current language; unknown events show their code. */
export function useEventName() {
  const t = useT()
  return (event: string) => {
    const key = `webhooks.event.${event}`
    return hasMessage(key) ? t(key as MessageKey) : event
  }
}
