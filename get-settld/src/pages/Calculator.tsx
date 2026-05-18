import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fmtFull } from "@/lib/format";
import { compute, DEFAULTS, SURVEY_PRICES, inputsFromSearch, inputsToSearch, type CalcInputs } from "@/lib/calculator";
import { copyText } from "@/lib/share";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Share2, Code, Mail, Loader2, Check } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email().max(320);

interface Props { embed?: boolean }

export default function Calculator({ embed = false }: Props) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [inputs, setInputs] = useState<CalcInputs>(() => inputsFromSearch(params.toString()));
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reflect inputs into the URL (so the share button copies a pre-filled link).
  useEffect(() => {
    setParams(inputsFromSearch.length ? new URLSearchParams(inputsToSearch(inputs)) : new URLSearchParams(), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs]);

  const result = useMemo(() => compute(inputs), [inputs]);

  const set = <K extends keyof CalcInputs>(k: K, v: CalcInputs[K]) =>
    setInputs((p) => ({ ...p, [k]: v }));

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/calculator`;
    return `${base}?${inputsToSearch(inputs)}`;
  }, [inputs]);

  const embedSnippet = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = `${window.location.origin}/embed/calculator?${inputsToSearch(inputs)}`;
    return `<iframe src="${url}" width="100%" height="900" style="border:0;max-width:760px" loading="lazy" title="True Cost Calculator"></iframe>`;
  }, [inputs]);

  const handleLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({ title: "Check your email", description: "Please enter a valid address.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("calculator_leads").insert({
      email: parsed.data,
      inputs: inputs as any,
      total_upfront: result.totalUpfront,
      source: embed ? "embed" : "web",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Saved", description: "Redirecting to sign up…" });
    // Redirect into signup with email pre-filled. Auth page reads ?email= and ?redirect=
    setTimeout(() => {
      navigate(`/auth?mode=signup&email=${encodeURIComponent(parsed.data)}&redirect=${encodeURIComponent(location.pathname + location.search)}`);
    }, 700);
  };

  const Body = (
    <div className={embed ? "p-4 sm:p-6" : "max-w-5xl mx-auto px-4 sm:px-6 py-8"}>
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <Card className="lg:col-span-2 p-5 space-y-5 h-fit">
          <h2 className="font-serif text-lg font-bold text-brand">Your numbers</h2>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label>Property price</Label>
              <span className="font-mono text-sm font-semibold">{fmtFull(inputs.price)}</span>
            </div>
            <Slider
              value={[inputs.price]}
              onValueChange={([v]) => set("price", v)}
              min={50_000} max={2_000_000} step={5_000}
            />
            <NumberInput value={inputs.price} onChange={(n) => set("price", n)} className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={inputs.region} onValueChange={(v: any) => set("region", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="england">England</SelectItem>
                <SelectItem value="scotland">Scotland</SelectItem>
                <SelectItem value="wales">Wales</SelectItem>
                <SelectItem value="ni">Northern Ireland</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>First-time buyer</Label>
              <p className="text-xs text-muted-foreground">Applies tax relief where available.</p>
            </div>
            <Switch checked={inputs.isFTB} onCheckedChange={(v) => set("isFTB", v)} />
          </div>

          <div className="space-y-2">
            <Label>Deposit</Label>
            <NumberInput value={inputs.deposit} onChange={(n) => set("deposit", n)} className="font-mono" />
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Survey type</Label>
            <Select value={inputs.surveyType} onValueChange={(v: any) => set("surveyType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SURVEY_PRICES) as (keyof typeof SURVEY_PRICES)[]).map((k) => (
                  <SelectItem key={k} value={k}>{SURVEY_PRICES[k].label} · £{SURVEY_PRICES[k].price}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Solicitor</Label>
              <NumberInput value={inputs.solicitor} onChange={(n) => set("solicitor", n)} />
            </div>
            <div>
              <Label className="text-xs">Mortgage fee</Label>
              <NumberInput value={inputs.mortgageFee} onChange={(n) => set("mortgageFee", n)} />
            </div>
            <div>
              <Label className="text-xs">Removals</Label>
              <NumberInput value={inputs.moving} onChange={(n) => set("moving", n)} />
            </div>
            <div>
              <Label className="text-xs">Insurance (yr 1)</Label>
              <NumberInput value={inputs.insurance} onChange={(n) => set("insurance", n)} />
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => setInputs(DEFAULTS)} className="w-full">
            Reset to defaults
          </Button>
        </Card>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6 bg-gradient-warm">
            <Badge className="bg-brand-muted text-brand border-0 mb-2">Total upfront cost</Badge>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-brand">{fmtFull(result.totalUpfront)}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              To buy a {fmtFull(inputs.price)} home in {inputs.region.charAt(0).toUpperCase() + inputs.region.slice(1)}.
            </p>
            <ul className="mt-5 divide-y border rounded-lg overflow-hidden bg-card text-sm">
              {result.lines.map((l) => (
                <li key={l.key} className="px-3 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{l.label}</p>
                    {l.hint && <p className="text-xs text-muted-foreground mt-0.5">{l.hint}</p>}
                  </div>
                  <span className="font-mono font-semibold whitespace-nowrap">{fmtFull(l.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => copyText(shareUrl, "Share link copied")}>
                <Share2 className="h-4 w-4 mr-1.5" /> Share this calculation
              </Button>
              {!embed && (
                <Button size="sm" variant="outline" asChild>
                  <a href="#embed">
                    <Code className="h-4 w-4 mr-1.5" /> Get the embed code
                  </a>
                </Button>
              )}
            </div>
          </Card>

          {/* Lead capture */}
          {!embed && (
            <Card className="p-5 border-brand/30">
              <h3 className="font-serif font-bold text-brand text-base">
                Save your calculation and track your full buying journey
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Free for 14 days. No card needed.
              </p>
              <form onSubmit={handleLead} className="mt-4 flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  aria-label="Email address"
                />
                <Button type="submit" disabled={submitting || submitted} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitted ? <Check className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  <span className="ml-1.5">{submitted ? "Saved" : "Save & continue"}</span>
                </Button>
              </form>
              <p className="text-[11px] text-muted-foreground mt-2">
                We'll only use your email to save your calculation and send buying-journey tips. Unsubscribe anytime.
              </p>
            </Card>
          )}

          {/* Embed snippet */}
          {!embed && (
            <Card id="embed" className="p-5 scroll-mt-20">
              <h3 className="font-serif font-bold text-brand text-base">Embed this calculator on your site</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Mortgage broker or estate agent? Paste this snippet anywhere on your website.
              </p>
              <pre className="mt-3 p-3 bg-muted rounded-md text-xs overflow-x-auto"><code>{embedSnippet}</code></pre>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => copyText(embedSnippet, "Embed snippet copied")}>
                Copy embed code
              </Button>
            </Card>
          )}
        </div>
      </div>

      {embed && (
        <p className="text-[11px] text-center text-muted-foreground mt-6">
          Powered by <a href={typeof window !== "undefined" ? window.location.origin : "/"} target="_blank" rel="noopener" className="underline hover:text-brand">Settld</a> — UK home-buying toolkit
        </p>
      )}
    </div>
  );

  if (embed) return Body;

  return (
    <>
      <PageHeader
        eyebrow="Free tool"
        title="True Cost Calculator"
        description="Stamp Duty, solicitor, survey, mortgage fee, removals — every upfront cost of buying a UK home, in one number."
      />
      {Body}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 text-sm text-muted-foreground">
        <p>
          Want to go deeper — running costs, lifetime view, regional breakdowns and scenario compare?{" "}
          <Link to="/true-cost" className="underline text-brand">Open the full True Cost tool</Link>.
        </p>
      </div>
    </>
  );
}
