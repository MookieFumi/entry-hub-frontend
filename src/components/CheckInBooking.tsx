import { useState } from 'react'
import { ApiError } from '@/api/errors'
import { useCheckInBooking, useMe, type Booking } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toasts'
import { useT } from '@/i18n'

const OPENS_BEFORE_START_MS = 15 * 60_000

/** Whether the check-in window of a booking is open: from 15 minutes before the start to the end. */
export function canCheckInNow(booking: Pick<Booking, 'startAt' | 'endAt'>, now = Date.now()) {
  return (
    now >= new Date(booking.startAt).getTime() - OPENS_BEFORE_START_MS &&
    now < new Date(booking.endAt).getTime()
  )
}

/** Check-in button for the organizer and Facilities of a confirmed booking that is in its window. */
export function CheckInBooking({ booking }: { booking: Booking }) {
  const t = useT()
  const me = useMe()
  const checkIn = useCheckInBooking()
  const { notify } = useToast()
  const [now] = useState(() => Date.now())
  const allowed = me.data?.role === 'Facilities' || me.data?.userId === booking.organizerId
  if (
    !allowed ||
    booking.status !== 'Confirmed' ||
    booking.checkedInAt ||
    !canCheckInNow(booking, now)
  )
    return null

  async function onClick() {
    try {
      await checkIn.mutateAsync(booking.id)
      notify('success', t('checkIn.done'))
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : t('checkIn.failed'))
    }
  }

  return (
    <Button disabled={checkIn.isPending} onClick={() => void onClick()}>
      {t('checkIn.button')}
    </Button>
  )
}
