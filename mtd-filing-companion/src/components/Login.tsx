/**
 * Passwordless sign-in screen.
 *
 * Email-only magic link (Supabase `signInWithOtp`): the user enters their email,
 * we send a one-tap link, and on return supabase-js establishes the session.
 * No passwords to store, reset, or breach — the right default for a mobile-first
 * consumer product, and it sidesteps credential entry entirely.
 */

import { useState } from 'react'
import { useAuth } from '@/lib/auth'

type Phase = 'idle' | 'sending' | 'sent' | 'error'

export default function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setPhase('sending')
    setMessage(null)
    const { error } = await signInWithEmail(trimmed)
    if (error) {
      setPhase('error')
      setMessage(error)
    } else {
      setPhase('sent')
    }
  }

  if (phase === 'sent') {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-4 px-5 py-8">
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-6 text-center dark:border-emerald-900 dark:bg-emerald-950">
          <h1 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
            We sent a sign-in link to{' '}
            <span className="font-medium break-all">{email.trim()}</span>. Open it
            on this device to finish signing in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPhase('idle')
            setMessage(null)
          }}
          className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          Use a different email
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-5 py-8">
      <header className="flex flex-col gap-1 text-center">
        <p className="text-xs font-semibold tracking-widest text-violet-500 uppercase">
          MTD Filing Companion
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Sign in
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your email and we&rsquo;ll send you a secure sign-in link — no
          password needed.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={phase === 'sending'}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-violet-900"
        />
        <button
          type="submit"
          disabled={phase === 'sending'}
          className="rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
        >
          {phase === 'sending' ? 'Sending link…' : 'Send sign-in link'}
        </button>
      </form>

      {phase === 'error' && message && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {message}
        </div>
      )}
    </main>
  )
}
