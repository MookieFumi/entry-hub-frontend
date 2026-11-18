import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'
import { setLocale } from '@/i18n'

// The app defaults to English; most tests assert on the Spanish copy, so start each one in Spanish.
beforeEach(() => {
  setLocale('es')
  localStorage.removeItem('entryhub.locale')
})
