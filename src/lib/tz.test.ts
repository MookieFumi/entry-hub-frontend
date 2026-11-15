import { addDays, dateInZone, dayOfWeek, timeInZone, zonedToUtc } from './tz'

describe('time zones', () => {
  it('converts Madrid time to UTC in winter and summer', () => {
    expect(zonedToUtc('2026-12-01', '09:00', 'Europe/Madrid').toISOString()).toBe(
      '2026-12-01T08:00:00.000Z',
    )
    expect(zonedToUtc('2026-07-01', '09:00', 'Europe/Madrid').toISOString()).toBe(
      '2026-07-01T07:00:00.000Z',
    )
  })

  it('handles the March clock change (27 March 2027; Sunday the 28th moves to UTC+2)', () => {
    expect(zonedToUtc('2027-03-26', '09:00', 'Europe/Madrid').toISOString()).toBe(
      '2027-03-26T08:00:00.000Z',
    )
    expect(zonedToUtc('2027-03-29', '09:00', 'Europe/Madrid').toISOString()).toBe(
      '2027-03-29T07:00:00.000Z',
    )
  })

  it('round trip: instant to office date and time', () => {
    const d = new Date('2026-12-01T08:00:00Z')
    expect(timeInZone(d, 'Europe/Madrid')).toBe('09:00')
    expect(dateInZone(new Date('2026-12-01T23:30:00Z'), 'Europe/Madrid')).toBe('2026-12-02')
  })

  it('day of the week and adding days', () => {
    expect(dayOfWeek('2026-11-14')).toBe('Saturday')
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
  })
})
