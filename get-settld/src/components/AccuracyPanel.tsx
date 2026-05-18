import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats { sample_size: number; avg_price_error_pct: number | null; avg_satisfaction: number | null; within_5pct: number; within_10pct: number; }

export default function AccuracyPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    supabase.rpc("public_outcome_accuracy").then(r => {
      if (r.data && Array.isArray(r.data) && r.data[0]) setStats(r.data[0] as Stats);
    });
  }, []);

  return (
    <Card className="p-6 bg-brand-muted/40 border-brand/20">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <Badge className="bg-brand text-brand-foreground border-0 mb-2"><LineChart className="w-3 h-3 mr-1.5" /> Live accuracy</Badge>
          <h3 className="font-serif text-2xl font-bold text-brand">How close are we to reality?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Reported by users 6/12/24 months after completion. No other UK proptech publishes this.
          </p>
        </div>
        <TrendingUp className="w-6 h-6 text-brand shrink-0" />
      </div>
      {!stats || stats.sample_size === 0 ? (
        <p className="text-sm text-muted-foreground italic">Building the dataset — first published cohort coming soon. Add yours via Outcomes if you've completed.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div><p className="text-3xl font-serif font-bold text-brand">{stats.sample_size}</p><p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Outcomes</p></div>
          <div><p className="text-3xl font-serif font-bold text-brand">±{stats.avg_price_error_pct ?? "—"}%</p><p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Mean price error</p></div>
          <div><p className="text-3xl font-serif font-bold text-success">{Math.round((stats.within_10pct / stats.sample_size) * 100)}%</p><p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Within ±10%</p></div>
          <div><p className="text-3xl font-serif font-bold text-brand">{stats.avg_satisfaction ?? "—"}/5</p><p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Buyer satisfaction</p></div>
        </div>
      )}
    </Card>
  );
}
