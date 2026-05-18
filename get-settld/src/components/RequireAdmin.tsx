import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Server-verified admin gate. Never trusts client state alone:
 * - Requires an authenticated session.
 * - Calls `has_role(auth.uid(), 'admin')` via Supabase RPC for the truth.
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    if (loading) return;
    if (!user) { setState("denied"); return; }
    let cancelled = false;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState(!error && data === true ? "ok" : "denied");
      });
    return () => { cancelled = true; };
  }, [user, loading]);

  if (loading || state === "checking") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to={`/auth?redirect=${encodeURIComponent(pathname + search)}`} replace />;
  if (state === "denied") return <Navigate to="/" replace />;
  return <>{children}</>;
}
