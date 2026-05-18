import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Copy, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState, EmptyState } from "@/components/states";
import { useTrackTool } from "@/hooks/use-track-tool";
import { toastWithUndo } from "@/lib/toast-undo";
import RequireAuth from "@/components/RequireAuth";
import { listMyReceipts } from "@/lib/receipts";

interface Invite { id: string; code: string; broker_email: string | null; broker_name: string | null; receipt_id: string | null; message: string | null; created_at: string; accepted_at: string | null; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Receipt = any;

function BrokerInner() {
  useTrackTool("broker-invite");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ broker_name: "", broker_email: "", receipt_id: "", message: "I'd like your view on this property — here's my full Verdict Receipt and the data behind it." });

  const load = async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from("broker_invites").select("*").order("created_at", { ascending: false }),
      listMyReceipts(),
    ]);
    setInvites((a.data as Invite[]) ?? []);
    setReceipts(b);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (!form.broker_name.trim()) {
      toastWithUndo({ message: "Add the broker's name first", onUndo: () => {} });
      return;
    }
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    const { error } = await supabase.from("broker_invites").insert({
      user_id: u.user.id, code,
      broker_name: form.broker_name || null,
      broker_email: form.broker_email || null,
      receipt_id: form.receipt_id || null,
      message: form.message || null,
    });
    if (!error) {
      const url = `${window.location.origin}/broker/${code}`;
      try { await navigator.clipboard.writeText(url); } catch { /* noop */ }
      toastWithUndo({ message: "Invite link copied to clipboard", onUndo: () => {} });
      setForm({ ...form, broker_name: "", broker_email: "" });
      load();
    }
  };

  const remove = async (id: string) => {
    const item = invites.find(i => i.id === id);
    if (!item) return;
    setInvites(invites.filter(i => i.id !== id));
    await supabase.from("broker_invites").delete().eq("id", id);
    toastWithUndo({
      message: "Invite revoked",
      onUndo: async () => {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        await supabase.from("broker_invites").insert({ ...item, user_id: u.user.id, id: undefined } as never);
        load();
      },
    });
  };

  const link = (code: string) => `${window.location.origin}/broker/${code}`;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <header>
        <Badge className="bg-brand-muted text-brand border-0 mb-2"><ShieldCheck className="w-3 h-3 mr-1.5" /> Broker on your terms</Badge>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand">Invite your broker</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          You pick the broker. Share a one-time link with your full Verdict Receipt and scenarios.
          We never sell your details — and we never take referral money from estate agents.
        </p>
      </header>

      <Card className="p-6">
        <h2 className="font-serif text-xl font-bold text-brand mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5" /> Generate an invite</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className="text-xs">Broker name</label><Input value={form.broker_name} onChange={e => setForm({ ...form, broker_name: e.target.value })} placeholder="Sarah from Habito" /></div>
          <div><label className="text-xs">Broker email (optional)</label><Input type="email" value={form.broker_email} onChange={e => setForm({ ...form, broker_email: e.target.value })} /></div>
          <div className="md:col-span-2">
            <label className="text-xs">Attach a Verdict Receipt (optional)</label>
            <select className="w-full mt-1 h-10 rounded-md border bg-background px-3 text-sm" value={form.receipt_id} onChange={e => setForm({ ...form, receipt_id: e.target.value })}>
              <option value="">— No attachment —</option>
              {receipts.map(r => <option key={r.id} value={r.id}>{r.property_ref || r.slug} · {new Date(r.created_at).toLocaleDateString("en-GB")}</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><label className="text-xs">Message</label><Textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
        </div>
        <Button onClick={create} className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">Generate invite link</Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-xl font-bold text-brand mb-4">Your invites</h2>
        {loading ? <LoadingState /> : invites.length === 0 ? <EmptyState title="No invites yet" description="Generate one above to share with your broker." /> : (
          <div className="space-y-2">
            {invites.map(i => (
              <div key={i.id} className="flex items-center justify-between gap-2 p-3 rounded-md border">
                <div className="min-w-0">
                  <p className="font-medium">{i.broker_name || "Unnamed"} {i.accepted_at && <Badge variant="outline" className="ml-2 text-xs">Opened</Badge>}</p>
                  <p className="text-xs text-muted-foreground truncate">{link(i.code)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(link(i.code))}><Copy className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-brand-muted/30 border-brand/20">
        <p className="text-sm text-foreground"><strong>Our pledge:</strong> we will never accept a referral fee from an estate agent. Mortgage broker and conveyancer success fees, when present, are flat and disclosed up-front on every page.</p>
      </Card>
    </div>
  );
}

export default function Broker() { return <RequireAuth><BrokerInner /></RequireAuth>; }
