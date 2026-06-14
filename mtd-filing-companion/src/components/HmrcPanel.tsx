/**
 * HMRC connection panel (Phase 1 Definition-of-Done surface).
 *
 * Two actions:
 *   1. **Connect HMRC** — a *full-page* navigation to `/api/hmrc/authorize`. The
 *      server starts the 3-legged OAuth flow and 302s on to HMRC's consent page;
 *      after consent HMRC redirects to `/api/hmrc/callback`, which persists the
 *      tokens and returns the user to `/?hmrc=linked`. Auth rides the
 *      `sb-access-token` cookie the auth layer keeps in sync (navigations can't
 *      carry a Bearer header).
 *   2. **Test connection** — POSTs the browser fraud-prevention data to
 *      `/api/hmrc/ping` with an `Authorization: Bearer` access token, proving the
 *      whole user-restricted chain (auth → valid HMRC token → fraud headers →
 *      `/hello/user`) end to end.
 */

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { collectClientFraudData } from '@/lib/fraudHeaders'

interface PingResponse {
  ok: boolean
  status?: number
  hmrc?: unknown
  error?: string
  message?: string
}

type PingState = 'idle' | 'running' | 'done' | 'failed'

/** Maps a coded ping error to friendly copy without leaking internals. */
function friendlyError(body: PingResponse): string {
  switch (body.error) {
    case 'no_tokens':
      return 'HMRC isn’t linked yet — tap “Connect HMRC” first.'
    case 'refresh_expired':
      return 'Your HMRC authorisation expired. Please reconnect HMRC.'
    case 'not_configured':
      return 'The HMRC connection isn’t configured on the server yet.'
    default:
      return body.message || body.error || 'The connection test failed.'
  }
}

export default function HmrcPanel({
  justLinked,
  preview = false,
}: {
  justLinked: boolean
  /** UI-preview mode: keep the panel visible but disable the live actions. */
  preview?: boolean
}) {
  const { accessToken } = useAuth()
  const [state, setState] = useState<PingState>('idle')
  const [result, setResult] = useState<PingResponse | null>(null)

  // In preview mode the server backend is intentionally unconfigured; surface a
  // gentle notice instead of navigating to (or fetching) an error response.
  const previewNotice: PingResponse = {
    ok: false,
    message: 'Disabled in preview — connect HMRC once the app is configured.',
  }

  function connect() {
    if (preview) {
      setState('failed')
      setResult(previewNotice)
      return
    }
    // Full-page navigation; the server handles consent + callback + redirect.
    window.location.href = '/api/hmrc/authorize'
  }

  async function ping() {
    if (preview) {
      setState('failed')
      setResult(previewNotice)
      return
    }
    setState('running')
    setResult(null)
    try {
      const client = collectClientFraudData()
      const res = await fetch('/api/hmrc/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(client),
      })
      const body = (await res.json()) as PingResponse
      setResult(body)
      setState(body.ok ? 'done' : 'failed')
    } catch {
      setResult({ ok: false, message: 'Request failed — are you online?' })
      setState('failed')
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          HMRC connection
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Link your HMRC account so the app can keep your digital records and file
          on your behalf.
        </p>
      </div>

      {justLinked && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          HMRC linked successfully. Run a connection test to confirm.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={connect}
          className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.99]"
        >
          Connect HMRC
        </button>
        <button
          type="button"
          onClick={ping}
          disabled={state === 'running'}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold text-slate-800 transition active:scale-[0.99] disabled:opacity-60 dark:border-slate-700 dark:text-slate-100"
        >
          {state === 'running' ? 'Testing…' : 'Test connection'}
        </button>
      </div>

      {result && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            result.ok
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
              : 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {result.ok ? (
            <span>HMRC responded successfully (status {result.status}).</span>
          ) : (
            <span>{friendlyError(result)}</span>
          )}
        </div>
      )}
    </section>
  )
}
