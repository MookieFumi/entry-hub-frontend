import { addDays, dateInZone, dayOfWeek, timeInZone, zonedToUtc } from './tz'

describe('zonas horarias', () => {
  it('convierte la hora de Madrid a UTC en invierno y en verano', () => {
    expect(zonedToUtc('2026-12-01', '09:00', 'Europe/Madrid').toISOString()).toBe(
      '2026-12-01T08:00:00.000Z',
    )
    expect(zonedToUtc('2026-07-01', '09:00', 'Europe/Madrid').toISOString()).toBe(
      '2026-07-01T07:00:00.000Z',
    )
  })

  it('respeta el cambio de hora de marzo (27 de marzo 2027, el domingo 28 pasa a UTC+2)', () => {
    expect(zonedToUtc('2027-03-26', '09:00', 'Europe/Madrid').toISOString()).toBe(
      '2027-03-26T08:00:00.000Z',
    )
    expect(zonedToUtc('2027-03-29', '09:00', 'Europe/Madrid').toISOString()).toBe(
      '2027-03-29T07:00:00.000Z',
    )
  })

  it('ida y vuelta: instante a hora y fecha de la oficina', () => {
    const d = new Date('2026-12-01T08:00:00Z')
    expect(timeInZone(d, 'Europe/Madrid')).toBe('09:00')
    expect(dateInZone(new Date('2026-12-01T23:30:00Z'), 'Europe/Madrid')).toBe('2026-12-02')
  })

  it('día de la semana y suma de días', () => {
    expect(dayOfWeek('2026-11-14')).toBe('Saturday')
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
  })
})
