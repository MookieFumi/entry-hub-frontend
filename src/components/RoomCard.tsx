import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Room } from '@/api/queries'
import { Badge } from '@/components/ui/Badge'
import { featureLabel } from '@/lib/featureLabel'
import { useT } from '@/i18n'

export function RoomCard({ room, action }: { room: Room; action?: ReactNode }) {
  const t = useT()
  return (
    <div className="relative flex h-full gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-[border-color,box-shadow,translate] duration-150 focus-within:border-brand-400 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm">
      <div
        aria-hidden="true"
        className={`flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-lg ${
          room.isActive ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600'
        }`}
      >
        <span className="text-xs leading-none font-semibold uppercase opacity-80">
          {t('rooms.floor')}
        </span>
        <span className="font-display nums mt-0.5 text-2xl leading-none">{room.floor}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">
            <Link
              to={`/rooms/${room.id}`}
              className="after:absolute after:inset-0 after:rounded-xl hover:text-brand-700 focus-visible:underline focus-visible:outline-none"
            >
              {room.name}
            </Link>
          </h3>
          {!room.isActive && <Badge tone="warning">{t('room.inactiveBadge')}</Badge>}
        </div>
        <p className="nums text-sm text-gray-600">
          {t('room.summary', { floor: room.floor, capacity: room.capacity })}
        </p>
        {room.features.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label={t('features.listLabel')}>
            {room.features.map((f) => (
              <li key={f.id}>
                <Badge tone={f.kind === 'Accessibility' ? 'brand' : 'gray'}>
                  {featureLabel(f, t)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        {/* Above the stretched link, so it stays its own target. */}
        {action && <div className="relative z-10 mt-auto pt-3">{action}</div>}
      </div>
    </div>
  )
}
