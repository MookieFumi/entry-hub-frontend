import { NavLink, Outlet } from 'react-router'
import { useState, type ReactNode } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useMe } from '@/api/queries'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  AdminBookingsIcon,
  AdminRoomsIcon,
  AuditIcon,
  DataIcon,
  RulesIcon,
  WebhooksIcon,
  BookingsIcon,
  ClosedDaysIcon,
  HomeIcon,
  RoomsIcon,
  SearchIcon,
  StatusIcon,
  Wordmark,
} from '@/components/ui/icons'
import { LanguageSwitcher } from './LanguageSwitcher'
import studioOnInk from '@/assets/brand/wordmark-horizontal-on-red.svg'
import { useT } from '@/i18n'

/** The current place is a white cell on the ink rail; yellow is kept for "yours". */
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mine-400 ${
    isActive
      ? 'bg-white font-semibold text-brand-900'
      : 'font-medium text-brand-100 hover:bg-white/10 hover:text-white'
  }`

export function AppLayout() {
  const t = useT()
  const { signOut, label } = useAuth()
  const me = useMe()
  const [open, setOpen] = useState(false)
  const isFacilities = me.data?.role === 'Facilities'

  const item = (to: string, icon: ReactNode, text: string, end = false) => (
    <NavLink to={to} end={end} className={linkClass} onClick={() => setOpen(false)}>
      {icon}
      {text}
    </NavLink>
  )

  const nav = (
    <nav aria-label={t('nav.main')} className="flex flex-col gap-1">
      {item('/', <HomeIcon />, t('nav.home'), true)}
      {item('/rooms', <RoomsIcon />, t('nav.rooms'))}
      {item('/search', <SearchIcon />, t('nav.search'))}
      {item('/bookings', <BookingsIcon />, t('nav.myBookings'))}
      {isFacilities && (
        <>
          <p className="mt-5 mb-1 px-3 text-xs font-semibold tracking-wider text-brand-200 uppercase">
            {t('nav.admin')}
          </p>
          {item('/admin/rooms', <AdminRoomsIcon />, t('nav.rooms'))}
          {item('/admin/bookings', <AdminBookingsIcon />, t('nav.adminBookings'))}
          {item('/admin/closed-days', <ClosedDaysIcon />, t('nav.closedDays'))}
          {item('/admin/rules', <RulesIcon />, t('nav.rules'))}
          {item('/admin/data', <DataIcon />, t('nav.data'))}
          {item('/admin/audit', <AuditIcon />, t('nav.audit'))}
          {item('/admin/webhooks', <WebhooksIcon />, t('nav.webhooks'))}
        </>
      )}
      <div className="mt-5 border-t border-white/15 pt-3">
        {item('/status', <StatusIcon />, t('nav.status'))}
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-25 lg:grid lg:grid-cols-[15.5rem_1fr]">
      <a
        href="#contenido"
        className="sr-only rounded-lg bg-mine-400 font-semibold text-brand-950 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:p-3"
      >
        {t('nav.skip')}
      </a>
      <aside className="hidden bg-brand-700 p-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
        <p className="mb-8 px-1 pt-1">
          <Wordmark name={t('app.name')} />
        </p>
        {nav}
        <a
          href="https://github.com/mookie-studio"
          className="mt-auto block rounded-lg px-1 pt-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mine-400"
        >
          <span className="mb-1 block text-xs font-semibold text-brand-100">
            {t('landing.madeBy')}
          </span>
          <img
            src={studioOnInk}
            alt="mookie studio"
            width={1684}
            height={624}
            className="-ml-1 h-auto w-full"
          />
        </a>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="secondary"
              className="lg:hidden"
              aria-expanded={open}
              aria-controls="menu-movil"
              onClick={() => setOpen(!open)}
            >
              {t('nav.menu')}
            </Button>
            {me.data && (
              <span className="font-display truncate text-lg text-gray-900">
                {me.data.tenantName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {me.data && <Badge tone={isFacilities ? 'brand' : 'gray'}>{me.data.role}</Badge>}
            <LanguageSwitcher />
            <span className="hidden text-sm text-gray-600 md:inline">{label}</span>
            <Button variant="secondary" onClick={() => void signOut()}>
              {t('nav.signOut')}
            </Button>
          </div>
        </header>
        {open && (
          <div id="menu-movil" className="bg-brand-700 p-4 lg:hidden">
            {nav}
          </div>
        )}
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
