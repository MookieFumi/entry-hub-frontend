import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { hasSupabase } from '@/auth/supabase'
import { AppVersion } from '@/components/AppVersion'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { Wordmark } from '@/components/ui/icons'
import { useT } from '@/i18n'

export function Login() {
  const t = useT()
  const { status, signIn, signInWithToken } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (status === 'signed-in') return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (hasSupabase) await signIn(email.trim(), password)
      else signInWithToken(token.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="flex flex-col justify-between gap-8 bg-brand-700 p-6 text-white sm:p-10">
        <Wordmark name={t('app.name')} />
        <PlannerSheet />
      </div>
      <main className="mx-auto flex w-full max-w-md flex-col justify-center gap-6 p-6 py-10 sm:p-10">
        <div>
          <h1 className="font-display text-4xl text-gray-900">{t('login.title')}</h1>
          <p className="mt-2 text-gray-600">{t('login.intro')}</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {hasSupabase ? (
            <>
              <TextField
                label={t('login.email')}
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label={t('login.password')}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          ) : (
            <>
              <Alert tone="warning" title={t('login.devTitle')}>
                {t('login.devBody', { tool: 'dotnet user-jwts' })}
              </Alert>
              <TextField
                label={t('login.token')}
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" disabled={busy}>
            {busy ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>
        <AppVersion className="text-gray-500" />
      </main>
    </div>
  )
}

/** Decorative planner sheet for the sign-in panel: a ruled week with a few marks. No real data. */
function PlannerSheet() {
  const marks: Record<number, string> = {
    1: 'bg-white/85',
    7: 'bg-mine-400',
    8: 'bg-mine-400',
    12: 'bg-white/85',
    13: 'bg-white/85',
    15: 'bg-error-500',
    19: 'bg-success-500',
    23: 'bg-white/85',
  }
  return (
    <div
      aria-hidden="true"
      className="hidden grid-cols-5 overflow-hidden rounded-xl border border-white/25 lg:grid"
    >
      {Array.from({ length: 25 }, (_, i) => (
        <div
          key={i}
          className={`h-16 border-white/25 p-2 xl:h-20 ${i % 5 === 0 ? '' : 'border-l'} ${i < 5 ? '' : 'border-t'}`}
        >
          {marks[i] && <div className={`marker-draw h-3 rounded-sm ${marks[i]}`} />}
        </div>
      ))}
    </div>
  )
}
