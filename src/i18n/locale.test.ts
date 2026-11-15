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
  })

  it('starts from the saved choice', () => {
    localStorage.setItem('entryhub.locale', 'en')
    initLocale()
    expect(getLocale()).toBe('en')
  })

  it('guesses from the browser language and falls back to Spanish', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR', 'en-US'])
    expect(detectLocale()).toBe('en')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])
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
