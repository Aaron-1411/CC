import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { login, signup } from "@/data/social";

type Mode = "signin" | "signup";

const cleanHandle = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9_]+/g, "").slice(0, 20);

export function LoginPage() {
  const { user, authMethods, refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, navigate, next]);

  const oauthError = params.get("error");

  const googleHref = useMemo(
    () => `/api/auth/google${next && next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`,
    [next],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await signup({ email, password, displayName, handle });
      } else {
        await login(email, password);
      }
      await refresh();
      navigate(next, { replace: true });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-300/40 focus:outline-none";

  return (
    <div className="flex flex-col gap-6 pt-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">
          Plate<span className="text-amber-300">Spin</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {mode === "signup"
            ? "Create your profile to post meals and follow friends."
            : "Sign in to post meals and follow friends."}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Just want to decide where to eat?{" "}
          <button
            type="button"
            onClick={() => navigate("/discover")}
            className="font-semibold text-amber-300 underline"
          >
            Spin without an account
          </button>
        </p>
      </header>

      {oauthError && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-sm text-red-200">
          Sign-in failed ({oauthError}). Please try again.
        </p>
      )}

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErr(null);
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            mode === "signin" ? "bg-amber-300 text-slate-900" : "text-slate-400"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setErr(null);
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            mode === "signup" ? "bg-amber-300 text-slate-900" : "text-slate-400"
          }`}
        >
          Create account
        </button>
      </div>

      {authMethods.google && (
        <a
          href={googleHref}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 transition active:scale-[0.98]"
        >
          Continue with Google
        </a>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputClass}
        />
        <input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
          className={inputClass}
        />

        {mode === "signup" && (
          <>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              maxLength={40}
              className={inputClass}
            />
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] focus-within:border-amber-300/40">
              <span className="pl-3 text-sm text-slate-500">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(cleanHandle(e.target.value))}
                placeholder="handle"
                className="w-full bg-transparent px-1.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
            <p className="-mt-1 px-1 text-[11px] text-slate-500">
              Lowercase letters, numbers and underscores. This is your public @name.
            </p>
          </>
        )}

        {err && <p className="text-sm text-red-300">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-2xl bg-amber-300 py-3 text-base font-extrabold text-slate-900 shadow-lg shadow-amber-300/20 transition active:scale-[0.98] disabled:opacity-50"
        >
          {busy
            ? mode === "signup"
              ? "Creating…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        {mode === "signin" ? (
          <>
            New to PlateSpin?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErr(null);
              }}
              className="font-semibold text-amber-300"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErr(null);
              }}
              className="font-semibold text-amber-300"
            >
              Sign in
            </button>
          </>
        )}
      </p>

      <p className="px-2 text-center text-[11px] leading-relaxed text-slate-600">
        Place data © OpenStreetMap contributors.
      </p>
    </div>
  );
}
