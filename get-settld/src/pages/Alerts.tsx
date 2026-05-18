import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Bell, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Alert {
  id: string;
  label: string;
  postcode: string | null;
  property_url: string | null;
  threshold_pct: number;
  last_value: number | null;
  last_checked_at: string | null;
  active: boolean;
  created_at: string;
}

interface Snapshot {
  id: string;
  property_key: string;
  label: string | null;
  verdict: string;
  score: number;
  created_at: string;
}

export default function Alerts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [postcode, setPostcode] = useState("");
  const [url, setUrl] = useState("");
  const [threshold, setThreshold] = useState(5);

  const alerts = useQuery({
    queryKey: ["alerts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_alerts").select("*").eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Alert[];
    },
  });

  const snaps = useQuery({
    queryKey: ["snaps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verdict_snapshots").select("*").eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Snapshot[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("price_alerts").insert({
        user_id: user!.id, label, postcode: postcode || null,
        property_url: url || null, threshold_pct: threshold, active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setLabel(""); setPostcode(""); setUrl("");
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert created");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("price_alerts").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  // Group snapshots by property_key for chart
  const grouped: Record<string, Snapshot[]> = {};
  (snaps.data ?? []).forEach((s) => {
    grouped[s.property_key] = [...(grouped[s.property_key] ?? []), s];
  });

  if (!user) {
    return (
      <>
        <PageHeader eyebrow="Alerts" title="Alerts & verdict history" description="Sign in to track properties over time." />
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <Card className="p-8"><Button asChild><a href="/auth">Sign in</a></Button></Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Watch list"
        title="Alerts & verdict history"
        description="Track a postcode's £/sqft, a specific listing's price, and how a property's verdict changes as rates and your inputs move."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-5 gap-6">
        <Card className="p-5 lg:col-span-2 space-y-3 h-fit">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand" />
            <h3 className="font-serif font-bold text-brand">New alert</h3>
          </div>
          <div><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. N22 flats under £350k" /></div>
          <div><Label>Postcode (optional)</Label><Input value={postcode} onChange={(e) => setPostcode(e.target.value.toUpperCase())} placeholder="N22 5" /></div>
          <div><Label>Listing URL (optional)</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.rightmove.co.uk/..." /></div>
          <div><Label>Trigger threshold (%)</Label><NumberInput value={threshold} onChange={setThreshold} /></div>
          <Button className="w-full" onClick={() => create.mutate()} disabled={!label || create.isPending}>Create alert</Button>
          <p className="text-xs text-muted-foreground">We'll check daily and notify you when the price moves more than your threshold.</p>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5">
            <h3 className="font-serif font-bold text-brand mb-3">Active alerts</h3>
            {alerts.data?.length === 0 && <p className="text-sm text-muted-foreground">No alerts yet.</p>}
            <ul className="space-y-2 text-sm">
              {(alerts.data ?? []).map((a) => (
                <li key={a.id} className="border rounded-md px-3 py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.postcode && <>postcode <span className="font-mono">{a.postcode}</span> · </>}
                      threshold {a.threshold_pct}%
                      {a.last_checked_at && <> · last check {new Date(a.last_checked_at).toLocaleDateString()}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={a.active} onCheckedChange={(v) => toggle.mutate({ id: a.id, active: v })} />
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-5 w-5 text-brand" />
              <h3 className="font-serif font-bold text-brand">Verdict history</h3>
            </div>
            {Object.keys(grouped).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Run a Quick Verdict and tap "Save snapshot" to start tracking how a property's verdict changes over time.
              </p>
            )}
            {Object.entries(grouped).map(([key, list]) => (
              <div key={key} className="mb-6">
                <p className="text-sm font-medium mb-2">{list[0].label ?? key}</p>
                <div className="h-48">
                  <ResponsiveContainer>
                    <LineChart data={list.map((s) => ({ date: new Date(s.created_at).toLocaleDateString(), score: s.score }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--brand))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {list.slice(-5).map((s) => (
                    <Badge key={s.id} variant="outline" className="text-xs">
                      {new Date(s.created_at).toLocaleDateString()} · {s.verdict} · {s.score}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
