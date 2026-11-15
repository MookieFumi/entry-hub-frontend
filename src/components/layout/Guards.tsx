import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { useMe } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { ApiError } from '@/api/errors'

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      {children}
    </div>
  )
}

/** Requires a session and a user with a tenant; otherwise redirects to login or explains why. */
export function RequireAuth() {
  const { status, signOut } = useAuth()
  const location = useLocation()
  const me = useMe(status === 'signed-in')

  if (status === 'loading')
    return (
      <Centered>
        <Spinner />
      </Centered>
    )
  if (status === 'signed-out')
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (me.isPending)
    return (
      <Centered>
        <Spinner label="Cargando tu cuenta" />
      </Centered>
    )

  if (me.error instanceof ApiError) {
    if (me.error.kind === 'unauthenticated') {
      return (
        <Centered>
          <Alert tone="warning" title="Tu sesión ha caducado">
            Vuelve a iniciar sesión para continuar.
          </Alert>
          <Button onClick={() => void signOut()}>Ir al inicio de sesión</Button>
        </Centered>
      )
    }
    if (me.error.kind === 'forbidden') {
      return (
        <Centered>
          <Alert tone="warning" title="Tu cuenta no está asignada a ningún cliente">
            Pide a un administrador que te dé acceso.
          </Alert>
          <Button variant="secondary" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
        </Centered>
      )
    }
    return (
      <Centered>
        <Alert tone="error" title="No se pudo cargar tu cuenta">
          {me.error.message}
        </Alert>
        <Button onClick={() => void me.refetch()}>Reintentar</Button>
      </Centered>
    )
  }
  return <Outlet />
}

/** Only Facilities can pass. */
export function RequireFacilities() {
  const me = useMe()
  if (me.data?.role !== 'Facilities') {
    return (
      <Alert tone="warning" title="Sin permiso">
        Esta sección es solo para el equipo de Facilities.
      </Alert>
    )
  }
  return <Outlet />
}
