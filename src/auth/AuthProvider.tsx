import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { setTokenProvider } from '@/api/client'
import { supabase } from './supabase'

type Status = 'loading' | 'signed-out' | 'signed-in'

type AuthContextValue = {
  status: Status
  /** Email or identifier to display. */
  label: string | null
  signIn: (email: string, password: string) => Promise<void>
  /** Development only, without Supabase: paste a `dotnet user-jwts` token. */
  signInWithToken: (token: string) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const DEV_TOKEN_KEY = 'entryhub.devToken'

function readDevToken(): string | null {
  try {
    return sessionStorage.getItem(DEV_TOKEN_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sbStatus, setSbStatus] = useState<Status>('loading')
  const [sbLabel, setSbLabel] = useState<string | null>(null)
  const [devToken, setDevToken] = useState<string | null>(() => (supabase ? null : readDevToken()))

  // Without Supabase the state comes from the development token; with Supabase, from its session.
  const status: Status = supabase ? sbStatus : devToken ? 'signed-in' : 'signed-out'
  const label = supabase ? sbLabel : devToken ? 'Token de desarrollo' : null

  // A layout effect, so the token provider is registered before the children's first requests
  // (children's passive effects, such as query fetches, run after it).
  useLayoutEffect(() => {
    if (!supabase) {
      setTokenProvider(() => devToken)
      return
    }
    setTokenProvider(
      async () => (await supabase!.auth.getSession()).data.session?.access_token ?? null,
    )
    void supabase.auth.getSession().then(({ data }) => {
      setSbStatus(data.session ? 'signed-in' : 'signed-out')
      setSbLabel(data.session?.user.email ?? null)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSbStatus(session ? 'signed-in' : 'signed-out')
      setSbLabel(session?.user.email ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [devToken])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Correo o contraseña incorrectos.')
  }, [])

  const signInWithToken = useCallback((token: string) => {
    try {
      sessionStorage.setItem(DEV_TOKEN_KEY, token)
    } catch {
      /* sin almacenamiento: el token vive solo en memoria */
    }
    setDevToken(token)
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    try {
      sessionStorage.removeItem(DEV_TOKEN_KEY)
    } catch {
      /* nada que limpiar */
    }
    setDevToken(null)
    setSbStatus('signed-out')
  }, [])

  const value = useMemo(
    () => ({ status, label, signIn, signInWithToken, signOut }),
    [status, label, signIn, signInWithToken, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
