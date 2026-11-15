import { NavLink, Outlet } from 'react-router'
import { useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useMe } from '@/api/queries'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`

export function AppLayout() {
  const { signOut, label } = useAuth()
  const me = useMe()
  const [open, setOpen] = useState(false)
  const isFacilities = me.data?.role === 'Facilities'

  const nav = (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
        Inicio
      </NavLink>
      <NavLink to="/rooms" className={linkClass} onClick={() => setOpen(false)}>
        Salas
      </NavLink>
      <NavLink to="/search" className={linkClass} onClick={() => setOpen(false)}>
        Buscar disponibilidad
      </NavLink>
      <NavLink to="/bookings" className={linkClass} onClick={() => setOpen(false)}>
        Mis reservas
      </NavLink>
      {isFacilities && (
        <>
          <p className="mt-4 px-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Administración
          </p>
          <NavLink to="/admin/rooms" className={linkClass} onClick={() => setOpen(false)}>
            Salas
          </NavLink>
          <NavLink to="/admin/bookings" className={linkClass} onClick={() => setOpen(false)}>
            Reservas
          </NavLink>
        </>
      )}
      <NavLink to="/status" className={linkClass} onClick={() => setOpen(false)}>
        Estado
      </NavLink>
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-25 lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:p-3">
        Saltar al contenido
      </a>
      <aside className="hidden border-r border-gray-200 bg-white p-4 lg:block">
        <p className="mb-6 px-3 text-lg font-semibold text-gray-900">EntryHub</p>
        {nav}
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="lg:hidden"
              aria-expanded={open}
              aria-controls="menu-movil"
              onClick={() => setOpen(!open)}
            >
              Menú
            </Button>
            {me.data && <span className="text-sm text-gray-600">{me.data.tenantName}</span>}
          </div>
          <div className="flex items-center gap-3">
            {me.data && <Badge tone={isFacilities ? 'brand' : 'gray'}>{me.data.role}</Badge>}
            <span className="hidden text-sm text-gray-600 sm:inline">{label}</span>
            <Button variant="secondary" onClick={() => void signOut()}>
              Cerrar sesión
            </Button>
          </div>
        </header>
        {open && (
          <div id="menu-movil" className="border-b border-gray-200 bg-white p-4 lg:hidden">
            {nav}
          </div>
        )}
        <main id="contenido" className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
