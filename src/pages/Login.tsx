import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/auth/AuthProvider'
import { hasSupabase } from '@/auth/supabase'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t('login.title')}</h1>
        <p className="mt-1 text-sm text-gray-600">{t('login.intro')}</p>
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
    </main>
  )
}
