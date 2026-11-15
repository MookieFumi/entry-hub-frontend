import { Link } from 'react-router'
import type { Room } from '@/api/queries'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Feedback'
import { useT } from '@/i18n'

export function RoomCard({ room }: { room: Room }) {
  const t = useT()
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">
          <Link to={`/rooms/${room.id}`} className="hover:text-brand-700 focus-visible:underline">
            {room.name}
          </Link>
        </h3>
        {!room.isActive && <Badge tone="warning">{t('room.inactiveBadge')}</Badge>}
      </div>
      <p className="text-sm text-gray-600">
        {t('room.summary', { floor: room.floor, capacity: room.capacity })}
      </p>
      {room.features.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t('features.listLabel')}>
          {room.features.map((f) => (
            <li key={f.id}>
              <Badge tone={f.kind === 'Accessibility' ? 'brand' : 'gray'}>{f.name}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
