import type { Catalog } from './index'

/** English catalog. Must have exactly the same keys and placeholders as `es.ts`. */
export const en: Catalog = {
  'app.name': 'EntryHub',
  'rule.DurationTooShort': 'The booking is too short.',
  'rule.DurationTooLong': 'The booking is too long.',
  'rule.NotOnSlotBoundary': 'The start and the end must fall on 15-minute slots.',
  'rule.OutsideOfficeHours': 'Outside office hours (Monday to Friday, within a single day).',
  'rule.TooSoon': 'The booking starts too soon.',
  'rule.TooFarAhead': 'The booking is too far ahead.',
  'rule.ExceedsCapacity': 'There are more attendees than the room capacity.',
  'rule.RoomUnavailable': 'The room is not available in that time slot.',
  'rule.TooManyActiveBookings': 'You have reached the maximum number of active bookings.',
  'rule.TooLateToReschedule': 'It can no longer be rescheduled: the start is too close.',
  'rule.NotActive': 'The room is not active.',
  'rule.TooLateToCancel': 'It can no longer be cancelled: the start is too close.',
  'common.loading': 'Loading…',
}
