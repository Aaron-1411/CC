import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Swords, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTrackTool } from "@/hooks/use-track-tool";
import { LoadingState } from "@/components/states";
import { toast } from "@/hooks/use-toast";

const STARTER_QUESTIONS = [
  "What's the lowest offer the vendor would consider today?",
  "How long has this been on the market — including any prior listings or withdrawals?",
  "Has the asking price been reduced? When and by how much?",
  "Is there a chain? How many links and what stage is each?",
  "Why is the vendor selling, and how soon do they need to complete?",
  "What's the EPC rating and last 12 months of energy bills?",
  "Have any offers been received and rejected? At what level?",
  "Are there any disputes with neighbours, freeholder or management company?",
  "What's the lease length, ground rent and service charge trajectory?",
  "Any planning applications nearby (within 200m) in the last 24 months?",
  "Has the property had subsidence, flooding, knotweed, or cladding remediation?",
  "What's included in the sale — appliances, fixtures, parking, garden?",
];

export default function BeatTheAgent() {
  useTrackTool("beat-the-agent");
  const [listing, setListing] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setErr(null); setQuestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("beat-the-agent", {
        body: { listing, askingPrice: askingPrice ? Number(askingPrice) : undefined },
      });
      if (error) throw error;
      const qs = (data as { questions?: string[] })?.questions;
      setQuestions(Array.isArray(qs) && qs.length > 0 ? qs : STARTER_QUESTIONS);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setQuestions(STARTER_QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <header>
        <Badge className="bg-destructive/10 text-destructive border-0 mb-2">
          <Swords className="w-3 h-3 mr-1.5" /> Adversarial mode
        </Badge>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand">Beat the Agent</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Paste any property listing or description. We'll surface the questions the agent
          doesn't want asked — built from a buyer's-side checklist of pricing, chain, condition and legal traps.
        </p>
      </header>

      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Listing URL or description</label>
          <Textarea value={listing} onChange={e => setListing(e.target.value)} rows={5}
            placeholder="Paste the Rightmove/Zoopla URL, or copy the full listing description here…" className="mt-1.5" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Asking price (£, optional)</label>
            <Input type="number" value={askingPrice} onChange={e => setAskingPrice(e.target.value)} placeholder="450000" className="mt-1.5" />
          </div>
        </div>
        <Button onClick={generate} disabled={loading || !listing.trim()} size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
          {loading ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Generating…</> : <><Swords className="w-4 h-4 mr-1.5" /> Get the questions</>}
        </Button>
        {err && <p className="text-xs text-destructive">{err} — showing starter checklist below.</p>}
      </Card>

      {loading && <LoadingState label="Asking the buyer's-side AI…" />}

      {questions.length > 0 && (
        <Card className="p-6">
          <h2 className="font-serif text-2xl font-bold text-brand mb-4">12 questions for the agent</h2>
          <ol className="space-y-3 list-decimal list-inside">
            {questions.slice(0, 12).map((q, i) => (
              <li key={i} className="text-sm leading-relaxed">{q}</li>
            ))}
          </ol>
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => {
              navigator.clipboard.writeText(questions.slice(0, 12).map((q, i) => `${i + 1}. ${q}`).join("\n"));
              toast({ title: "Copied — take it to the viewing." });
            }}>
              Copy all 12
            </Button>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
