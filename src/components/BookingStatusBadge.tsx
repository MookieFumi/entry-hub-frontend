import { Badge } from '@/components/ui/Badge'
import { useT } from '@/i18n'

/** Status of a booking: confirmed, pending approval or cancelled (a rejected booking is cancelled). */
export function BookingStatusBadge({ status }: { status: unknown }) {
  const t = useT()
  if (status === 'Confirmed') return <Badge tone="success">{t('booking.statusConfirmed')}</Badge>
  if (status === 'Pending') return <Badge tone="warning">{t('booking.statusPending')}</Badge>
  return <Badge tone="gray">{t('booking.statusCancelled')}</Badge>
}
