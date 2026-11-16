import { hasMessage, useT, type MessageKey } from '@/i18n'

/** Name for a code of the API (`audit.action.Created`...) in the current language; unknown codes show themselves. */
export function useCatalogName(prefix: string) {
  const t = useT()
  return (code: string) => {
    const key = `${prefix}.${code}`
    return hasMessage(key) ? t(key as MessageKey) : code
  }
}
