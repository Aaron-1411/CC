import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { devLogin } from "@/data/social";

export function LoginPage() {
  const { user, authMethods, refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const oauthError = params.get("error");

  const submitDev = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await devLogin(handle || name, name || handle);
      await refresh();
      navigate("/", { replace: true });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const noMethods = !authMethods.dev && !authMethods.google;

  return (
    <div className="flex flex-col gap-6 pt-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">
          Plate<span className="text-amber-300">Spin</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Where your friends eat, what they ate, and how good it was.
        </p>
      </header>

      {oauthError && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-sm text-red-200">
          Sign-in failed ({oauthError}). Please try again.
        </p>
      )}

      {authMethods.google && (
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 transition active:scale-[0.98]"
        >
          Continue with Google
        </a>
      )}

      {authMethods.dev && (
        <form onSubmit={submitDev} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Dev login (no OAuth)</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-300/40 focus:outline-none"
          />
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@handle (a–z, 0–9, _)"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-300/40 focus:outline-none"
          />
          {err && <p className="text-sm text-red-300">{err}</p>}
          <button
            type="submit"
            disabled={busy || (!handle && !name)}
            className="rounded-xl bg-amber-300 py-2.5 font-bold text-slate-900 transition active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Continue"}
          </button>
        </form>
      )}

      {noMethods && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">
          <p className="font-semibold">No sign-in method is configured yet.</p>
          <p className="mt-1 text-amber-100/80">
            Enable Google OAuth (set <code>GOOGLE_CLIENT_ID</code> / <code>GOOGLE_CLIENT_SECRET</code>),
            or set <code>ALLOW_DEV_LOGIN=1</code> in a non-production environment to use the dev login.
          </p>
        </div>
      )}

      <p className="px-2 text-center text-[11px] leading-relaxed text-slate-600">
        Place data © OpenStreetMap contributors.
      </p>
    </div>
  );
}
