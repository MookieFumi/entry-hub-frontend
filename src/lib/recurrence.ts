import type { components } from '@/api/schema'

export type RecurrenceRequest = components['schemas']['RecurrenceRequest']

export type RepeatValue = {
  frequency: 'None' | 'Daily' | 'Weekly'
  interval: string
  endMode: 'count' | 'until'
  count: string
  until: string
}

export const noRepeat: RepeatValue = {
  frequency: 'None',
  interval: '1',
  endMode: 'count',
  count: '4',
  until: '',
}

export type RepeatErrors = Partial<
  Record<'interval' | 'count' | 'until', 'interval' | 'count' | 'until'>
>

/** The recurrence to send, or the fields that are invalid. `firstDay` is the local day (yyyy-MM-dd) of the first booking. */
export function buildRecurrence(
  v: RepeatValue,
  firstDay: string,
): { recurrence?: RecurrenceRequest; errors: RepeatErrors } {
  if (v.frequency === 'None') return { errors: {} }
  const errors: RepeatErrors = {}
  const interval = Number(v.interval)
  if (!Number.isInteger(interval) || interval < 1 || interval > 52) errors.interval = 'interval'
  const recurrence: RecurrenceRequest = { frequency: v.frequency, interval }
  if (v.endMode === 'count') {
    const count = Number(v.count)
    if (!Number.isInteger(count) || count < 2 || count > 52) errors.count = 'count'
    recurrence.count = count
  } else {
    if (!v.until || v.until <= firstDay) errors.until = 'until'
    recurrence.until = v.until
  }
  return Object.keys(errors).length > 0 ? { errors } : { recurrence, errors }
}
