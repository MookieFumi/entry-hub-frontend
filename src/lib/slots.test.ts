import { buildSlots, endOptions, isBookableDay, type Rules } from './slots'

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
  cancellationNoticeMinutes: 15,
  maxActiveBookings: 5,
  autoReleaseMinutes: 0,
}
const farPast = new Date('2026-01-01T00:00:00Z')

describe('slots', () => {
  it('there are no slots on weekends', () => {
    expect(isBookableDay('2026-11-14', rules)).toBe(false)
    expect(buildSlots('2026-11-14', rules, [], farPast)).toEqual([])
  })

  it('generates 15-minute slots between opening and closing', () => {
    const slots = buildSlots('2026-12-01', rules, [], farPast)
    expect(slots).toHaveLength(48)
    expect(slots[0]?.time).toBe('08:00')
    expect(slots.at(-1)?.time).toBe('19:45')
  })

  it('marks the slots of a booking as busy (10:00 to 11:00 in Madrid)', () => {
    const busy = [
      {
        bookingId: null,
        startAt: '2026-12-01T09:00:00Z',
        endAt: '2026-12-01T10:00:00Z',
        isMine: false,
        title: null,
        organizerId: null,
      },
    ]
    const slots = buildSlots('2026-12-01', rules, busy, farPast)
    const busyTimes = slots.filter((s) => s.busy).map((s) => s.time)
    expect(busyTimes).toEqual(['10:00', '10:15', '10:30', '10:45'])
  })

  it('marks as past the slots that break the minimum lead time', () => {
    const now = new Date('2026-12-01T08:00:00Z') // 09:00 in Madrid
    const slots = buildSlots('2026-12-01', rules, [], now)
    expect(slots.find((s) => s.time === '09:00')?.past).toBe(true)
    expect(slots.find((s) => s.time === '09:15')?.past).toBe(false)
  })

  it('end times respect the maximum duration and do not cross a booking', () => {
    const busy = [
      {
        bookingId: null,
        startAt: '2026-12-01T09:00:00Z',
        endAt: '2026-12-01T10:00:00Z',
        isMine: false,
        title: null,
        organizerId: null,
      },
    ]
    const slots = buildSlots('2026-12-01', rules, busy, farPast)
    expect(endOptions('09:00', rules, slots).at(-1)).toBe('10:00')
    const free = buildSlots('2026-12-02', rules, [], farPast)
    expect(endOptions('09:00', rules, free).at(-1)).toBe('13:00')
  })
})
