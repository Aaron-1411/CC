/**
 * App shell + auth gate.
 *
 * Renders one of four states, in order:
 *   1. Supabase not configured → a clear notice (graceful degradation: the app
 *      still builds and runs with no live project, mirroring the server routes).
 *   2. Loading the initial session → a quiet spinner (no flash of the login UI).
 *   3. No session → the passwordless {@link Login} screen.
 *   4. Signed in → the authenticated dashboard: account header + sign-out, the
 *      {@link HmrcPanel} (Connect HMRC + Test connection), and the original
 *      fraud-header spike kept as a collapsible diagnostics card.
 *
 * The `?hmrc=linked` query param (set by the HMRC OAuth callback redirect) drives
 * the one-time "linked successfully" banner inside the panel.
 */

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { isPreview, PREVIEW_EMAIL } from '@/lib/preview'
import { collectClientFraudData } from '@/lib/fraudHeaders'
import Login from '@/components/Login'
import HmrcPanel from '@/components/HmrcPanel'

export default function App() {
  const { loading, user, signOut } = useAuth()

  // Preview mode (VITE_PREVIEW=1) renders the real dashboard shell without a live
  // backend, so the UI is viewable as a visual demo. In every normal build the
  // flag is off and the usual gate applies.
  if (!isSupabaseConfigured && !isPreview) return <NotConfigured />
  if (loading) return <Loading />
  if (!user && !isPreview) return <Login />

  const displayEmail = user?.email ?? (isPreview ? PREVIEW_EMAIL : undefined)
  const justLinked =
    new URLSearchParams(window.location.search).get('hmrc') === 'linked'

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 px-5 py-8">
      {isPreview && <PreviewBanner />}

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-widest text-violet-500 uppercase">
            MTD Filing Companion
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Your dashboard
          </h1>
          {displayEmail && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Signed in as{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {displayEmail}
              </span>
            </p>
          )}
        </div>
        {isPreview ? (
          <span className="shrink-0 rounded-xl border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:text-amber-300">
            Preview
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void signOut()}
            className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition active:scale-[0.99] dark:border-slate-700 dark:text-slate-300"
          >
            Sign out
          </button>
        )}
      </header>

      <HmrcPanel justLinked={justLinked} preview={isPreview} />

      <Diagnostics />
    </main>
  )
}

/**
 * Persistent honest notice shown only in {@link isPreview} builds, so nobody
 * mistakes the visual demo for a working, connected app.
 */
function PreviewBanner() {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
      <p className="font-semibold text-amber-900 dark:text-amber-100">
        Preview · UI demo
      </p>
      <p className="mt-1 text-amber-800 dark:text-amber-200">
        This is a visual preview of the interface. Sign-in and the live HMRC
        connection are disabled until the app is configured with a Supabase
        project and HMRC credentials.
      </p>
    </div>
  )
}

function NotConfigured() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-4 px-5 py-8">
      <div className="flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-6 text-center dark:border-amber-900 dark:bg-amber-950">
        <h1 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
          Supabase not configured
        </h1>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Set{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900">
            VITE_SUPABASE_URL
          </code>{' '}
          and{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900">
            VITE_SUPABASE_ANON_KEY
          </code>{' '}
          in <code className="text-xs">.env.local</code> to enable sign-in.
        </p>
      </div>
    </main>
  )
}

function Loading() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col items-center justify-center gap-3 px-5 py-8">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600 dark:border-slate-700 dark:border-t-violet-400"
        aria-label="Loading"
      />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
    </main>
  )
}

/**
 * Phase 0a fraud-header spike, retained as a collapsed diagnostics card.
 *
 * Collects the browser fraud-prevention data, POSTs it to the Pages Function
 * that assembles the full WEB_APP_VIA_SERVER header set, and renders the result.
 * With no HMRC credentials configured the verdict stays at `assembled` (pipeline
 * observable); once sandbox credentials land it shows the live validator verdict.
 */

interface ValidatorResult {
  specVersion?: string
  code?: string
  message?: string
  errors?: unknown[]
  warnings?: unknown[]
}

interface SpikeResponse {
  ok: boolean
  stage: 'assembled' | 'validated' | 'error'
  credentialsConfigured: boolean
  assembledHeaders: Record<string, string>
  validation?: ValidatorResult
  error?: string
}

type Status = 'idle' | 'running' | 'done' | 'failed'

function Diagnostics() {
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<SpikeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runTest() {
    setStatus('running')
    setError(null)
    setResult(null)
    try {
      const client = collectClientFraudData()
      const res = await fetch('/api/hmrc/test-fraud-headers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      })
      const body = (await res.json()) as SpikeResponse
      setResult(body)
      setStatus(body.ok ? 'done' : 'failed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      setStatus('failed')
    }
  }

  return (
    <details className="group rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <span>Diagnostics · fraud-header spike</span>
        <span className="text-xs text-slate-400 transition group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="mt-4 flex flex-col gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Collect browser fraud-prevention data, assemble the{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
            WEB_APP_VIA_SERVER
          </code>{' '}
          headers, and validate against HMRC.
        </p>

        <button
          type="button"
          onClick={runTest}
          disabled={status === 'running'}
          className="rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
        >
          {status === 'running' ? 'Validating…' : 'Run fraud-header check'}
        </button>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {result && <Verdict result={result} />}
      </div>
    </details>
  )
}

function Verdict({ result }: { result: SpikeResponse }) {
  const headerRows = Object.entries(result.assembledHeaders)
  return (
    <section className="flex flex-col gap-5">
      <StageBanner result={result} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Assembled headers ({headerRows.length})
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <tbody>
              {headerRows.map(([name, value]) => (
                <tr
                  key={name}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <th className="w-2/5 bg-slate-50 px-3 py-2 align-top font-mono font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                    {name}
                  </th>
                  <td className="px-3 py-2 align-top break-all font-mono text-slate-800 dark:text-slate-200">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result.validation && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            HMRC validator verdict
          </h2>
          <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            {JSON.stringify(result.validation, null, 2)}
          </pre>
        </div>
      )}

      {result.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
      )}
    </section>
  )
}

function StageBanner({ result }: { result: SpikeResponse }) {
  const map = {
    assembled: {
      tone: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
      label: 'Headers assembled',
      note: 'No HMRC credentials configured — add sandbox credentials to run the live validator.',
    },
    validated: {
      tone: result.ok
        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
        : 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
      label: result.ok ? 'Valid headers' : 'Invalid headers',
      note: result.validation?.message ?? '',
    },
    error: {
      tone: 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
      label: 'Error',
      note: result.error ?? '',
    },
  }[result.stage]

  return (
    <div className={`rounded-xl border px-4 py-3 ${map.tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{map.label}</span>
        <span className="font-mono text-xs opacity-70">
          creds: {result.credentialsConfigured ? 'yes' : 'no'}
        </span>
      </div>
      {map.note && <p className="mt-1 text-xs opacity-90">{map.note}</p>}
    </div>
  )
}
