import { describe, expect, it } from 'vitest'
import { describeRules, formatMinutes } from './rules-text'
import type { Rules } from './slots'

const rules: Rules = {
  minDurationMinutes: 15,
  maxDurationMinutes: 240,
  slotMinutes: 15,
  officeOpens: '08:00',
  officeCloses: '20:00',
  officeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  timeZone: 'Europe/Madrid',
  minLeadTimeMinutes: 15,
  maxAdvanceDays: 90,
  cancellationNoticeMinutes: 60,
  maxActiveBookings: 5,
  autoReleaseMinutes: 0,
}

describe('formatMinutes', () => {
  it('uses minutes, hours or both', () => {
    expect(formatMinutes(15)).toBe('15 min')
    expect(formatMinutes(60)).toBe('1 h')
    expect(formatMinutes(90)).toBe('1 h 30 min')
    expect(formatMinutes(240)).toBe('4 h')
  })
})

describe('describeRules', () => {
  it('writes every rule from /rules', () => {
    const text = describeRules(rules).join('\n')
    expect(text).toContain('de lunes a viernes, de 08:00 a 20:00 (Europe/Madrid)')
    expect(text).toContain('de 15 min a 4 h, en tramos de 15 min')
    expect(text).toContain('al menos 15 min después de ahora y como mucho 90 días')
    expect(text).toContain('hasta 1 h antes del inicio')
    expect(text).toContain('5 reservas activas')
  })

  it('lists non-consecutive days and omits the limit when there is none', () => {
    const text = describeRules({
      ...rules,
      officeDays: ['Monday', 'Wednesday', 'Friday'],
      maxActiveBookings: null,
    }).join('\n')
    expect(text).toContain('lunes, miércoles, viernes')
    expect(text).not.toContain('reservas activas')
  })

  it('follows the rules of the tenant, not fixed numbers', () => {
    const text = describeRules({ ...rules, maxDurationMinutes: 120, officeCloses: '18:00' }).join(
      '\n',
    )
    expect(text).toContain('a 2 h')
    expect(text).toContain('a 18:00')
  })
})
