import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { useMe } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { ApiError } from '@/api/errors'
import { Landing } from '@/pages/Landing'
import { useT } from '@/i18n'

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      {children}
    </div>
  )
}

/** Requires a session and a user with a tenant; otherwise redirects to login or explains why. */
export function RequireAuth() {
  const t = useT()
  const { status, signOut } = useAuth()
  const location = useLocation()
  const me = useMe(status === 'signed-in')

  if (status === 'loading')
    return (
      <Centered>
        <Spinner />
      </Centered>
    )
  // Visitors without a session land on the public page; any other address asks them to sign in.
  if (status === 'signed-out' && location.pathname === '/') return <Landing />
  if (status === 'signed-out')
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (me.isPending)
    return (
      <Centered>
        <Spinner label={t('auth.loadingAccount')} />
      </Centered>
    )

  if (me.error instanceof ApiError) {
    if (me.error.kind === 'unauthenticated') {
      return (
        <Centered>
          <Alert tone="warning" title={t('auth.expiredTitle')}>
            {t('auth.expiredBody')}
          </Alert>
          <Button onClick={() => void signOut()}>{t('auth.toLogin')}</Button>
        </Centered>
      )
    }
    if (me.error.kind === 'forbidden') {
      return (
        <Centered>
          <Alert tone="warning" title={t('auth.noTenantTitle')}>
            {t('auth.noTenantBody')}
          </Alert>
          <Button variant="secondary" onClick={() => void signOut()}>
            {t('nav.signOut')}
          </Button>
        </Centered>
      )
    }
    return (
      <Centered>
        <Alert tone="error" title={t('auth.accountFailed')}>
          {me.error.message}
        </Alert>
        <Button onClick={() => void me.refetch()}>{t('common.retry')}</Button>
      </Centered>
    )
  }
  return <Outlet />
}

/** Only Facilities can pass. */
export function RequireFacilities() {
  const t = useT()
  const me = useMe()
  if (me.data?.role !== 'Facilities') {
    return (
      <Alert tone="warning" title={t('auth.noPermissionTitle')}>
        {t('auth.facilitiesOnly')}
      </Alert>
    )
  }
  return <Outlet />
}
