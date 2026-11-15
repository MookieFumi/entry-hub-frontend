import { formatOfficeTime } from './dates'

describe('dates in the office time zone', () => {
  it('shows Madrid time, not the browser time (winter: UTC+1)', () => {
    expect(formatOfficeTime('2026-12-01T08:00:00Z')).toContain('9:00')
  })

  it('handles summer time (UTC+2)', () => {
    expect(formatOfficeTime('2026-07-01T08:00:00Z')).toContain('10:00')
  })
})
