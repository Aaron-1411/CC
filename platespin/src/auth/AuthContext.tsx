import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { MeResponse, PublicUser } from "@/contract/types";
import { getMe, logout as apiLogout } from "@/data/social";

interface AuthValue {
  user: PublicUser | null;
  authMethods: MeResponse["authMethods"];
  loading: boolean;
  /** Re-fetch /api/auth/me (call after login or profile edits). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

const NO_METHODS: MeResponse["authMethods"] = { dev: false, google: false, email: false };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authMethods, setAuthMethods] = useState<MeResponse["authMethods"]>(NO_METHODS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me.user);
      setAuthMethods(me.authMethods);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authMethods, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
