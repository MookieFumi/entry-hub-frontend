import type { ReactNode } from 'react'

/** Authored icon set: 20 px, one stroke weight, round joins. Decorative: labels carry the meaning. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export const HomeIcon = () => (
  <Icon>
    <path d="M3 9.2 10 3.5l7 5.7V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
    <path d="M8 17v-5h4v5" />
  </Icon>
)
export const RoomsIcon = () => (
  <Icon>
    <path d="M5 17V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13" />
    <path d="M3 17h14M12 10.2v.1" />
  </Icon>
)
export const SearchIcon = () => (
  <Icon>
    <circle cx="9" cy="9" r="5.2" />
    <path d="m13 13 4 4" />
  </Icon>
)
export const BookingsIcon = () => (
  <Icon>
    <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" />
    <path d="M3 8.5h14M7 3v3M13 3v3M7 12h2.5" />
  </Icon>
)
export const AdminRoomsIcon = () => (
  <Icon>
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="11" y="3" width="6" height="6" rx="1" />
    <rect x="3" y="11" width="6" height="6" rx="1" />
    <path d="M14 11.5v5M11.5 14h5" />
  </Icon>
)
export const AdminBookingsIcon = () => (
  <Icon>
    <path d="M4 5h12M4 10h12M4 15h7" />
    <path d="m13.5 15 1.5 1.5 2.5-3" />
  </Icon>
)
export const ClosedDaysIcon = () => (
  <Icon>
    <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" />
    <path d="M3 8.5h14M7 3v3M13 3v3M8 11l4 4M12 11l-4 4" />
  </Icon>
)
export const StatusIcon = () => (
  <Icon>
    <path d="M2.5 10.5h3.2l2-5 3.6 9 2-4h4.2" />
  </Icon>
)

export const RulesIcon = () => (
  <Icon>
    <path d="M5 3h10a1 1 0 0 1 1 1v13H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M7.5 7h5M7.5 10h5M7.5 13h3" />
  </Icon>
)
export const DataIcon = () => (
  <Icon>
    <ellipse cx="10" cy="5" rx="6" ry="2.2" />
    <path d="M4 5v10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V5M4 10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2" />
  </Icon>
)
export const AuditIcon = () => (
  <Icon>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 6v4l2.5 2" />
  </Icon>
)
export const WebhooksIcon = () => (
  <Icon>
    <circle cx="5" cy="14" r="2" />
    <circle cx="15" cy="14" r="2" />
    <circle cx="10" cy="5" r="2" />
    <path d="M7 14h6M9 6.8 6 12.3M11 6.8l3 5.5" />
  </Icon>
)

/** EntryHub mark: a planner sheet with one cell marked. */
export function Mark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="7" fill="#fff" />
      <rect x="17" y="17" width="9" height="9" rx="1.5" className="fill-mine-400" />
      <path
        d="M6 6h20v20H6zM16 6v20M6 16h20"
        fill="none"
        className="stroke-brand-800"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Wordmark({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      <span className="font-display text-2xl tracking-tight">{name}</span>
    </span>
  )
}
