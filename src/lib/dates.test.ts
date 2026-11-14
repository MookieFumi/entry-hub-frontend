import { formatOfficeTime } from './dates'

describe('fechas en la zona de la oficina', () => {
  it('muestra la hora de Madrid, no la del navegador (invierno: UTC+1)', () => {
    expect(formatOfficeTime('2026-12-01T08:00:00Z')).toContain('9:00')
  })

  it('respeta el horario de verano (UTC+2)', () => {
    expect(formatOfficeTime('2026-07-01T08:00:00Z')).toContain('10:00')
  })
})
