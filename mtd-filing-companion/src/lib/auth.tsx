/**
 * App-wide auth state, backed by Supabase Auth.
 *
 * Two jobs:
 *   1. Expose the current session (and helpers to sign in / out) to the React
 *      tree via {@link useAuth}.
 *   2. Keep an `sb-access-token` cookie in sync with the session's access token.
 *
 * Why the cookie (job 2): the HMRC OAuth flow starts with a *full-page*
 * navigation to `/api/hmrc/authorize` and returns via a redirect to
 * `/api/hmrc/callback`. Browsers don't attach `Authorization: Bearer` headers to
 * navigations, so the server's `requireUser` reads the JWT from an
 * `sb-access-token` cookie instead. supabase-js stores the session in
 * localStorage, not in that cookie, so we mirror the access token into it
 * ourselves (SameSite=Lax so it rides the top-level GET navigation back from
 * HMRC). Plain `fetch` callers (e.g. the ping button) still send a Bearer header.
 *
 * The cookie holds the same short-lived access token already in localStorage, so
 * it adds no exposure the SPA didn't already have; it is cleared on sign-out.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

interface AuthContextValue {
  /** Loading the initial session (prevents a flash of the login screen). */
  loading: boolean
  session: Session | null
  user: User | null
  /** Current access token (JWT) for `Authorization: Bearer` fetch calls. */
  accessToken: string | null
  /** Send a passwordless magic-link to `email`. Resolves on send, not sign-in. */
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Mirror (or clear) the access token into the `sb-access-token` cookie. */
function syncAccessCookie(token: string | null): void {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = token
    ? `sb-access-token=${token}; Path=/; SameSite=Lax; Max-Age=3600${secure}`
    : `sb-access-token=; Path=/; SameSite=Lax; Max-Age=0${secure}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // When Supabase isn't configured there's nothing to load — go straight to the
  // (un-authenticated) UI rather than spinning forever.
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return

    // 1. Hydrate the existing session (also resolves the magic-link return URL).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      syncAccessCookie(data.session?.access_token ?? null)
      setLoading(false)
    })

    // 2. Track sign-in / sign-out / token-refresh and keep the cookie current.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      syncAccessCookie(next?.access_token ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Supabase is not configured' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    syncAccessCookie(null)
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
      signInWithEmail,
      signOut,
    }),
    [loading, session, signInWithEmail, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Access the auth context. Throws if used outside {@link AuthProvider}. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
