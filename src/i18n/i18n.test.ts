import { afterEach, describe, expect, it } from 'vitest'
import { allCatalogs, getLocale, setLocale, t } from './index'

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('catalogs', () => {
  it('have the same keys in every language', () => {
    const reference = Object.keys(allCatalogs.es).sort()
    expect(Object.keys(allCatalogs.en).sort()).toEqual(reference)
  })

  it('have the same placeholders for each key', () => {
    for (const [key, text] of Object.entries(allCatalogs.es)) {
      const other = allCatalogs.en[key as keyof typeof allCatalogs.en]
      expect(placeholders(other), key).toEqual(placeholders(text))
    }
  })

  it('have no empty messages', () => {
    for (const catalog of Object.values(allCatalogs)) {
      for (const [key, text] of Object.entries(catalog)) expect(text.trim(), key).not.toBe('')
    }
  })
})

describe('t', () => {
  afterEach(() => setLocale('es'))

  it('uses Spanish by default', () => {
    expect(getLocale()).toBe('es')
    expect(t('common.loading')).toBe('Cargando…')
  })

  it('follows the current language', () => {
    setLocale('en')
    expect(t('common.loading')).toBe('Loading…')
  })
})
