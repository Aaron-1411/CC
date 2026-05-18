import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Gate for routes that should not be reachable without an account.
 * Used as the future paywall slot (auth first, entitlement check next).
 * While auth state hydrates we render a quiet spinner so we don't flicker
 * into a redirect for already-signed-in users.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(pathname + search)}`} replace />;
  }
  return <>{children}</>;
}
