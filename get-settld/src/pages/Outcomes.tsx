import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LineChart as LineIcon, PlusCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState, EmptyState } from "@/components/states";
import { toastWithUndo } from "@/lib/toast-undo";
import { useTrackTool } from "@/hooks/use-track-tool";
import RequireAuth from "@/components/RequireAuth";

interface Outcome {
  id: string; property_ref: string | null;
  predicted_price: number | null; actual_price: number | null;
  satisfaction: number | null; regret_notes: string | null;
  months_after_completion: number | null; created_at: string;
}

function OutcomesInner() {
  useTrackTool("outcomes");
  const [items, setItems] = useState<Outcome[]>([]);
  const [stats, setStats] = useState<{ sample_size: number; avg_price_error_pct: number | null; avg_satisfaction: number | null; within_5pct: number; within_10pct: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ property_ref: "", predicted_price: "", actual_price: "", satisfaction: "5", months_after_completion: "6", regret_notes: "" });

  const load = async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from("outcomes").select("*").order("created_at", { ascending: false }),
      supabase.rpc("public_outcome_accuracy"),
    ]);
    setItems((a.data as Outcome[]) ?? []);
    if (b.data && Array.isArray(b.data) && b.data[0]) setStats(b.data[0] as never);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (!form.actual_price) {
      toastWithUndo({ message: "Add the actual price paid to log this outcome", onUndo: () => {} });
      return;
    }
    const { error } = await supabase.from("outcomes").insert({
      user_id: u.user.id,
      property_ref: form.property_ref || null,
      predicted_price: form.predicted_price ? Number(form.predicted_price) : null,
      actual_price: form.actual_price ? Number(form.actual_price) : null,
      satisfaction: Number(form.satisfaction),
      months_after_completion: Number(form.months_after_completion),
      regret_notes: form.regret_notes || null,
    });
    if (!error) {
      setForm({ property_ref: "", predicted_price: "", actual_price: "", satisfaction: "5", months_after_completion: "6", regret_notes: "" });
      toastWithUndo({ message: "Outcome logged — thank you. It feeds the live accuracy panel.", onUndo: () => {} });
      load();
    }
  };

  const remove = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setItems(items.filter(i => i.id !== id));
    await supabase.from("outcomes").delete().eq("id", id);
    toastWithUndo({
      message: "Outcome removed",
      onUndo: async () => {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        await supabase.from("outcomes").insert({ ...item, user_id: u.user.id, id: undefined } as never);
        load();
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <header>
        <Badge className="bg-brand-muted text-brand border-0 mb-2"><LineIcon className="w-3 h-3 mr-1.5" /> Honest accuracy</Badge>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand">Outcome tracking</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Tell us what actually happened after you completed. We feed it back into our scores so
          we're the only UK proptech with a real accuracy claim — published live on the methodology page.
        </p>
      </header>

      {stats && stats.sample_size > 0 && (
        <Card className="p-6 bg-brand-muted/40 border-brand/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-3xl font-serif font-bold text-brand">{stats.sample_size}</p><p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Outcomes</p></div>
            <div><p className="text-3xl font-serif font-bold text-brand">{stats.avg_price_error_pct ?? "—"}%</p><p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Avg price error</p></div>
            <div><p className="text-3xl font-serif font-bold text-success">{stats.within_5pct}</p><p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Within ±5%</p></div>
            <div><p className="text-3xl font-serif font-bold text-brand">{stats.avg_satisfaction ?? "—"}/5</p><p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Satisfaction</p></div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="font-serif text-xl font-bold text-brand mb-4 flex items-center gap-2"><PlusCircle className="w-5 h-5" /> Log a new outcome</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className="text-xs">Property reference / postcode</label><Input value={form.property_ref} onChange={e => setForm({ ...form, property_ref: e.target.value })} /></div>
          <div><label className="text-xs">Months since completion</label><Input type="number" value={form.months_after_completion} onChange={e => setForm({ ...form, months_after_completion: e.target.value })} /></div>
          <div><label className="text-xs">Predicted price (£)</label><Input type="number" value={form.predicted_price} onChange={e => setForm({ ...form, predicted_price: e.target.value })} /></div>
          <div><label className="text-xs">Actual price paid (£)</label><Input type="number" value={form.actual_price} onChange={e => setForm({ ...form, actual_price: e.target.value })} /></div>
          <div><label className="text-xs">Satisfaction (1–5)</label><Input type="number" min={1} max={5} value={form.satisfaction} onChange={e => setForm({ ...form, satisfaction: e.target.value })} /></div>
        </div>
        <div className="mt-3"><label className="text-xs">Regrets or surprises (optional)</label><Textarea rows={3} value={form.regret_notes} onChange={e => setForm({ ...form, regret_notes: e.target.value })} /></div>
        <Button onClick={submit} className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">Submit outcome</Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-xl font-bold text-brand mb-4">Your outcomes</h2>
        {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No outcomes yet" description="Log one above once you've completed a purchase." /> : (
          <div className="space-y-2">
            {items.map(o => (
              <div key={o.id} className="flex items-center justify-between gap-2 p-3 rounded-md border">
                <div className="min-w-0">
                  <p className="font-medium truncate">{o.property_ref || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    Predicted £{o.predicted_price?.toLocaleString() ?? "—"} · Actual £{o.actual_price?.toLocaleString() ?? "—"} · {o.satisfaction}/5
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(o.id)} aria-label="Delete"><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function Outcomes() {
  return <RequireAuth><OutcomesInner /></RequireAuth>;
}
