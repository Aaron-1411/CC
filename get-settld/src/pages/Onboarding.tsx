// 6-question onboarding wizard. Captures the bare minimum we need to route a
// new visitor to the right starting tool, seed the Scenario, and personalise
// the journey checklist. Persists answers to localStorage so signed-in users
// pick up where they left off, and non-auth users can still benefit.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useScenario, type Region } from "@/context/ScenarioContext";

type Stage = "dreaming" | "saving" | "ready" | "offered" | "exchanged";

interface Answers {
  stage: Stage;
  region: Region;
  price: number;
  income: number;
  deposit: number;
  isFTB: boolean;
}

const KEY = "ftb.onboarding.v1";

const DEFAULT_ANSWERS: Answers = {
  stage: "saving",
  region: "england",
  price: 350_000,
  income: 65_000,
  deposit: 35_000,
  isFTB: true,
};

const STAGE_DEST: Record<Stage, { to: string; label: string }> = {
  dreaming: { to: "/areas", label: "Explore areas first" },
  saving:   { to: "/deposit", label: "Build your deposit plan" },
  ready:    { to: "/decide", label: "Run a verdict on a property" },
  offered:  { to: "/offer", label: "Offer-strategy tool" },
  exchanged:{ to: "/journey", label: "Track your buying journey" },
};

const STAGES: { value: Stage; label: string; sub: string }[] = [
  { value: "dreaming",  label: "Just dreaming",         sub: "Curious about what's possible." },
  { value: "saving",    label: "Saving for a deposit",  sub: "Working towards the deposit goal." },
  { value: "ready",     label: "Ready to view properties", sub: "Pre-approved or close to it." },
  { value: "offered",   label: "Made an offer",         sub: "Negotiating a specific property." },
  { value: "exchanged", label: "Exchanged / completing",sub: "In the conveyancing process." },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setScenario } = useScenario();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...DEFAULT_ANSWERS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return DEFAULT_ANSWERS;
  });

  const update = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((p) => ({ ...p, [k]: v }));

  const finish = () => {
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* ignore */ }
    setScenario({
      price: a.price, deposit: a.deposit, income: a.income,
      region: a.region, isFTB: a.isFTB,
    });
    const dest = STAGE_DEST[a.stage];
    navigate(dest.to);
  };

  const STEPS = [
    {
      title: "Where are you in the journey?",
      sub: "We'll point you straight at the most useful tool.",
      body: (
        <RadioGroup value={a.stage} onValueChange={(v) => update("stage", v as Stage)} className="space-y-2">
          {STAGES.map((s) => (
            <label key={s.value} className="flex items-start gap-3 p-3 rounded-md border border-border hover:border-brand/40 hover:bg-muted/30 cursor-pointer">
              <RadioGroupItem value={s.value} className="mt-1" />
              <div>
                <p className="font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      ),
    },
    {
      title: "Which UK nation are you buying in?",
      sub: "Determines tax regime, schemes and terminology.",
      body: (
        <RadioGroup value={a.region} onValueChange={(v) => update("region", v as Region)} className="grid grid-cols-2 gap-2">
          {[
            { v: "england" as Region, l: "England" },
            { v: "scotland" as Region, l: "Scotland" },
            { v: "wales" as Region, l: "Wales" },
            { v: "ni" as Region, l: "Northern Ireland" },
          ].map((r) => (
            <label key={r.v} className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-brand/40 hover:bg-muted/30 cursor-pointer">
              <RadioGroupItem value={r.v} />
              <span className="font-semibold">{r.l}</span>
            </label>
          ))}
        </RadioGroup>
      ),
    },
    {
      title: "Is this your first home?",
      sub: "Unlocks first-time buyer reliefs on stamp duty.",
      body: (
        <RadioGroup value={a.isFTB ? "yes" : "no"} onValueChange={(v) => update("isFTB", v === "yes")} className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-3 p-3 rounded-md border hover:border-brand/40 hover:bg-muted/30 cursor-pointer">
            <RadioGroupItem value="yes" /><span className="font-semibold">Yes — first home</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-md border hover:border-brand/40 hover:bg-muted/30 cursor-pointer">
            <RadioGroupItem value="no" /><span className="font-semibold">No — moved before</span>
          </label>
        </RadioGroup>
      ),
    },
    {
      title: "What price range are you looking at?",
      sub: "Rough estimate is fine — you can change this any time.",
      body: (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Property price</Label>
            <NumberInput value={a.price} onChange={(n) => update("price", n)} className="font-mono" />
          </div>
          <div>
            <Label>Deposit you have / are saving</Label>
            <NumberInput value={a.deposit} onChange={(n) => update("deposit", n)} className="font-mono" />
            <p className="text-xs text-muted-foreground mt-1">{a.price > 0 ? `${((a.deposit / a.price) * 100).toFixed(1)}% of price` : ""}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Household income (gross, annual)?",
      sub: "Used for affordability and stress-test calcs. Stays on your device.",
      body: (
        <div className="max-w-xs">
          <Label>Total household income</Label>
          <NumberInput value={a.income} onChange={(n) => update("income", n)} className="font-mono" />
          <p className="text-xs text-muted-foreground mt-2">Lenders typically multiply this 4.5×–5× for a maximum loan.</p>
        </div>
      ),
    },
    {
      title: "You're set",
      sub: "We've personalised the toolkit for you.",
      body: (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Stage</span><span className="font-semibold">{STAGES.find((s) => s.value === a.stage)?.label}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Region</span><span className="font-semibold capitalize">{a.region}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">First-time buyer</span><span className="font-semibold">{a.isFTB ? "Yes" : "No"}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Target price</span><span className="font-mono font-semibold">£{a.price.toLocaleString()}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Deposit</span><span className="font-mono font-semibold">£{a.deposit.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Income</span><span className="font-mono font-semibold">£{a.income.toLocaleString()}</span></div>
          <div className="bg-brand-muted text-brand rounded-md p-3 mt-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">Best next step: <strong>{STAGE_DEST[a.stage].label}</strong></span>
          </div>
        </div>
      ),
    },
  ];

  const total = STEPS.length;
  const pct = ((step + 1) / total) * 100;
  const isLast = step === total - 1;

  return (
    <>
      <PageHeader
        eyebrow="Get started"
        title="Tell us a little, get a lot back"
        description="6 quick questions to personalise the toolkit and route you to the right tool."
      />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {total}</span>
          <button onClick={() => navigate("/")} className="hover:text-brand">Skip for now</button>
        </div>
        <Progress value={pct} className="h-1 mb-6" />
        <Card className="p-6 shadow-soft">
          <h2 className="font-serif text-2xl font-bold text-brand">{STEPS[step].title}</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">{STEPS[step].sub}</p>
          {STEPS[step].body}
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            {isLast ? (
              <Button onClick={finish} className="bg-brand text-brand-foreground hover:bg-brand/90">
                Take me to {STAGE_DEST[a.stage].label} <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => Math.min(total - 1, s + 1))} className="bg-brand text-brand-foreground hover:bg-brand/90">
                Next <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
