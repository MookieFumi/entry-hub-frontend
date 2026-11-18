import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectLocale, formatLocale, getLocale, initLocale, setLocale } from './index'
import { formatOfficeTime } from '@/lib/dates'

afterEach(() => {
  setLocale('es')
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('language choice', () => {
  it('remembers the choice and sets <html lang>', () => {
    setLocale('en')
    expect(localStorage.getItem('entryhub.locale')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('EntryHub · Room booking')
  })

  it('starts from the saved choice', () => {
    localStorage.setItem('entryhub.locale', 'en')
    initLocale()
    expect(getLocale()).toBe('en')
  })

  it('guesses from the browser language and falls back to English', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR', 'es-MX'])
    expect(detectLocale()).toBe('es')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])
    expect(detectLocale()).toBe('en')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([])
    expect(detectLocale()).toBe('en')
  })

  it('lets the saved choice win over the browser language', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-ES'])
    localStorage.setItem('entryhub.locale', 'en')
    expect(detectLocale()).toBe('en')
    localStorage.setItem('entryhub.locale', 'es')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
    expect(detectLocale()).toBe('es')
  })
})

describe('dates', () => {
  it('follow the language and keep the office time zone', () => {
    expect(formatOfficeTime('2026-12-01T14:00:00Z')).toBe('15:00')
    setLocale('en')
    expect(formatLocale()).toBe('en-GB')
    expect(formatOfficeTime('2026-12-01T14:00:00Z')).toBe('15:00')
    expect(formatOfficeTime('2026-12-01T14:00:00Z', 'Europe/London')).toBe('14:00')
  })
})
