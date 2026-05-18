import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { toast } from "@/hooks/use-toast";
import { Lock, Loader2 } from "lucide-react";

/**
 * Hidden landing for the admin area. Two paths:
 *  1. If the signed-in user is already admin → bounce straight to /admin.
 *  2. Otherwise show a password gate. Correct password calls
 *     bootstrap_admin() server-side, which only succeeds if NO admin exists
 *     yet. After that, normal role-based access kicks in.
 */
export default function AdminGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  useDocumentTitle("Admin", "Internal admin access.");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent("/__admin")}`, { replace: true });
      return;
    }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (data === true) navigate("/admin", { replace: true });
      else setChecking(false);
    });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.rpc("bootstrap_admin", { p_password: pw });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't verify", description: error.message, variant: "destructive" });
      return;
    }
    if (data === true) {
      toast({ title: "Admin access granted" });
      navigate("/admin", { replace: true });
    } else {
      // Generic message — never reveal which check failed.
      toast({ title: "Access denied", description: "Invalid passphrase or admin already claimed.", variant: "destructive" });
    }
  }

  if (loading || checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Lock className="w-8 h-8 mx-auto text-brand mb-2" />
          <CardTitle className="font-serif text-xl text-brand">Restricted area</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="pw">Passphrase</Label>
              <Input id="pw" type="password" autoComplete="off" autoFocus value={pw} onChange={e => setPw(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-brand text-brand-foreground hover:bg-brand/90" disabled={busy || !pw}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
