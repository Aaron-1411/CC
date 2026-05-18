import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Share2, RotateCcw, Sparkles, Link as LinkIcon, Save, FolderOpen, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useScenario, Region } from "@/context/ScenarioContext";
import { useAuth } from "@/context/AuthContext";
import { copyText } from "@/lib/share";
import { fmt, fmtFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listScenarios, saveScenario, deleteScenario, type SavedScenario } from "@/lib/scenarios";
import { toast } from "@/hooks/use-toast";
import { useAutosave } from "@/hooks/use-autosave";
import SavedIndicator from "@/components/SavedIndicator";

const REGION_LABELS: Record<Region, string> = {
  england: "England", scotland: "Scotland", wales: "Wales", ni: "N. Ireland",
};

export default function ScenarioBar({ className }: { className?: string }) {
  const { scenario, setScenario, resetScenario, depositPct, ltv, loan, shareUrl } = useScenario();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) listScenarios().then(setSaved);
    else setSaved([]);
  }, [user]);

  async function onSaveScenario() {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give this scenario a short name." });
      return;
    }
    try {
      const s = await saveScenario(name.trim(), scenario);
      if (s) {
        setSaved((prev) => [s, ...prev]);
        setName("");
        toast({ title: "Scenario saved", description: s.name });
      }
    } catch (e) {
      toast({ title: "Could not save", description: String((e as Error).message), variant: "destructive" });
    }
  }

  async function onDeleteScenario(id: string) {
    await deleteScenario(id);
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }


  // Surface a "Saving… / Saved ✓" indicator any time the scenario changes.
  // The actual write is debounced by ScenarioContext; this just mirrors UX state.
  const saveStatus = useAutosave(scenario, async () => {
    // ScenarioContext persists to localStorage synchronously; this no-op is
    // a hook for future remote sync. Wrap in try so a failure surfaces a toast.
    try {
      // Reserved for remote sync; intentionally empty for now.
    } catch (e) {
      toast({ title: "Couldn't save scenario", description: String((e as Error).message), variant: "destructive" });
      throw e;
    }
  }, 700);

  // One-line human summary for mobile, e.g. "£350k · 10% deposit · £65k income"
  const summary = `${fmt(scenario.price)} · ${depositPct.toFixed(0)}% deposit · ${fmt(scenario.income)} income`;

  return (
    <div className={cn("border-b bg-card/80 backdrop-blur sticky top-14 z-20", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        {/* Mobile: collapsed pill — tap to expand */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="sm:hidden w-full flex items-center justify-between gap-2 text-xs"
          aria-expanded={open}
        >
          <Badge variant="outline" className="border-brand/30 text-brand gap-1.5 font-normal">
            <Sparkles className="w-3 h-3" /> Your scenario
          </Badge>
          <span className="font-mono truncate text-foreground flex-1 text-left">{summary}</span>
          {open ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
        </button>

        {/* Desktop: full inline strip */}
        <div className="hidden sm:flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <Badge variant="outline" className="border-brand/30 text-brand gap-1.5 font-normal">
            <Sparkles className="w-3 h-3" /> Live scenario
          </Badge>
          <Stat label="Price" value={fmtFull(scenario.price)} />
          <Stat label="Deposit" value={`${fmt(scenario.deposit)} · ${depositPct.toFixed(0)}%`} />
          <Stat label="Loan" value={`${fmt(loan)} · LTV ${ltv.toFixed(0)}%`} />
          <Stat label="Income" value={fmtFull(scenario.income)} />
          <Stat label="Rate / Term" value={`${scenario.rate}% · ${scenario.term}y`} />
          <Stat label="Region" value={REGION_LABELS[scenario.region]} />
          {scenario.isFTB && <Badge className="bg-success/15 text-success hover:bg-success/15 border-0 text-[10px]">FTB</Badge>}
          {scenario.tenure === "buy_to_let" && <Badge className="bg-accent/30 text-foreground hover:bg-accent/30 border-0 text-[10px]">BTL</Badge>}

          <div className="ml-auto flex items-center gap-1.5">
            <SavedIndicator status={saveStatus} className="mr-1" />
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                    <FolderOpen className="w-3 h-3 mr-1" /> Saved{saved.length > 0 ? ` (${saved.length})` : ""}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-3">
                  <p className="text-xs font-semibold mb-2">Save current scenario</p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="e.g. Crystal Palace 3-bed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button size="sm" className="h-8" onClick={onSaveScenario}>
                      <Save className="w-3 h-3 mr-1" /> Save
                    </Button>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs font-semibold mb-1">Your saved scenarios</p>
                    {saved.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">None yet.</p>
                    ) : (
                      <ul className="max-h-60 overflow-auto -mx-1">
                        {saved.map((s) => (
                          <li key={s.id} className="flex items-center gap-1 px-1 py-1 hover:bg-muted/50 rounded">
                            <button
                              type="button"
                              className="flex-1 text-left text-xs truncate"
                              onClick={() => { setScenario(s.data); toast({ title: "Loaded", description: s.name }); }}
                            >
                              {s.name}
                            </button>
                            <Button
                              size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                              onClick={() => onDeleteScenario(s.id)}
                              aria-label={`Delete ${s.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <Button
              size="sm" variant="ghost" className="h-7 px-2 text-xs text-brand hover:bg-brand-muted"
              onClick={() => copyText(shareUrl, "Scenario link copied")}
            >
              <LinkIcon className="w-3 h-3 mr-1" /> Copy link
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpen((o) => !o)}>
              {open ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              {open ? "Collapse" : "Edit"}
            </Button>
          </div>
        </div>

        {open && (
          <Card className="mt-2 p-4 shadow-soft">
            {/* Essentials — what almost everyone needs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NumberField label="Property price (£)" value={scenario.price} step={5000} onChange={(price) => setScenario({ price })} />
              <NumberField label="Deposit (£)" value={scenario.deposit} step={1000} onChange={(deposit) => setScenario({ deposit })} />
              <NumberField label="Income (£/yr)" value={scenario.income} step={1000} onChange={(income) => setScenario({ income })} />
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Region</Label>
                <Select value={scenario.region} onValueChange={(v) => setScenario({ region: v as Region })}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
                      <SelectItem key={r} value={r}>{REGION_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <details className="mt-3 group">
              <summary className="cursor-pointer text-xs text-brand font-semibold inline-flex items-center gap-1 list-none">
                <ChevronDown className="w-3 h-3 group-open:hidden" />
                <ChevronUp className="w-3 h-3 hidden group-open:inline" />
                Advanced (rate, term, hold period, purpose)
              </summary>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <NumberField label="Mortgage rate (%)" value={scenario.rate} step={0.05} onChange={(rate) => setScenario({ rate })} />
                <NumberField label="Term (years)" value={scenario.term} step={1} onChange={(term) => setScenario({ term })} />
                <NumberField label="Hold period (years)" value={scenario.holdYears} step={1} onChange={(holdYears) => setScenario({ holdYears })} />
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Purpose</Label>
                  <Select value={scenario.tenure} onValueChange={(v) => setScenario({ tenure: v as "buy_to_live" | "buy_to_let" })}>
                    <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy_to_live">Buy to live in</SelectItem>
                      <SelectItem value="buy_to_let">Buy to let / invest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2 h-9">
                    <Switch id="ftb" checked={scenario.isFTB} onCheckedChange={(isFTB) => setScenario({ isFTB })} />
                    <Label htmlFor="ftb" className="text-xs">First-time buyer</Label>
                  </div>
                </div>
              </div>
            </details>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
              <p className="text-[11px] text-muted-foreground">
                These figures flow into every tool.
                <Link to="/" className="ml-1 underline decoration-dotted hover:text-brand">Tour the toolkit</Link>
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={resetScenario}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                </Button>
                <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90"
                  onClick={() => copyText(shareUrl, "Scenario link copied")}>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share scenario
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="font-mono text-foreground">{value}</span>
  </span>
);

const NumberField = ({
  label, value, step, onChange,
}: { label: string; value: number; step: number; onChange: (n: number) => void }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
    <NumberInput
      className="h-9 mt-1 font-mono"
      value={value}
      step={step}
      onChange={onChange}
    />
  </div>
);
