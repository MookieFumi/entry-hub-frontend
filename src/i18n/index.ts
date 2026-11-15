import { useSyncExternalStore } from 'react'
import { en } from './en'
import { es } from './es'

export type Locale = 'es' | 'en'
export type MessageKey = keyof typeof es
export type Catalog = Record<MessageKey, string>
export type Params = Record<string, string | number>

export const LOCALES: readonly Locale[] = ['es', 'en']
export const DEFAULT_LOCALE: Locale = 'es'

const catalogs: Record<Locale, Catalog> = { es, en }

let current: Locale = DEFAULT_LOCALE
const listeners = new Set<() => void>()

export function getLocale(): Locale {
  return current
}

const STORAGE_KEY = 'entryhub.locale'

/** BCP 47 tag used for dates and numbers in each language. */
const FORMAT_LOCALES: Record<Locale, string> = { es: 'es-ES', en: 'en-GB' }

export function formatLocale(locale: Locale = current): string {
  return FORMAT_LOCALES[locale]
}

export function isLocale(value: unknown): value is Locale {
  return value === 'es' || value === 'en'
}

function applyToDocument(locale: Locale): void {
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

export function setLocale(locale: Locale): void {
  if (locale === current) return
  current = locale
  applyToDocument(locale)
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts only for this visit.
  }
  listeners.forEach((listener) => listener())
}

/** Language to start with: the saved choice, then the browser language, then Spanish. */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    // Ignore unavailable storage.
  }
  const preferred = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [])
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

/** Call once at startup (not at import time, so tests keep the default language). */
export function initLocale(): void {
  const detected = detectLocale()
  applyToDocument(detected)
  current = detected
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Replaces `{name}` placeholders; an unknown placeholder is left as written. */
function interpolate(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  )
}

/** Translates a key in the current language. Usable outside React; components should use `useT`. */
export function t(key: MessageKey, params?: Params): string {
  return interpolate(catalogs[current][key], params)
}

/** True when the key exists in the catalogs (for keys built from API data). */
export function hasMessage(key: string): key is MessageKey {
  return key in catalogs[DEFAULT_LOCALE]
}

/** Re-renders the component when the language changes and returns the translate function. */
export function useT(): typeof t {
  useSyncExternalStore(subscribe, getLocale)
  return t
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale)
}

/** Catalogs, exposed so tests can check they stay in sync. */
export const allCatalogs: Readonly<Record<Locale, Catalog>> = catalogs
