import { describe, expect, it } from 'vitest'
import { setLocale } from '@/i18n'
import { featureLabel } from './featureLabel'

describe('featureLabel', () => {
  it('translates a default entry that kept its English name', () => {
    setLocale('es')
    expect(featureLabel({ code: 'video-conferencing', name: 'Video conferencing' })).toBe(
      'Videoconferencia',
    )
    setLocale('en')
    expect(featureLabel({ code: 'video-conferencing', name: 'Video conferencing' })).toBe(
      'Video conferencing',
    )
  })

  it('keeps the stored name of renamed and custom entries', () => {
    setLocale('es')
    expect(featureLabel({ code: 'projector', name: 'Beamer 4K' })).toBe('Beamer 4K')
    expect(featureLabel({ code: 'tv', name: 'TV' })).toBe('TV')
    setLocale('en')
  })
})
