import { Link } from 'react-router'
import type { Room } from '@/api/queries'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Feedback'

export function RoomCard({ room }: { room: Room }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">
          <Link to={`/rooms/${room.id}`} className="hover:text-brand-700 focus-visible:underline">
            {room.name}
          </Link>
        </h3>
        {!room.isActive && <Badge tone="warning">Inactiva</Badge>}
      </div>
      <p className="text-sm text-gray-600">
        Planta {room.floor} · hasta {room.capacity} personas
      </p>
      {room.equipment.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Equipamiento">
          {room.equipment.map((e) => (
            <li key={e}>
              <Badge>{e}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
