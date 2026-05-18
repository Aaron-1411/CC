import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import LiveOverlaysCard from "@/components/LiveOverlaysCard";
import Jargon from "@/components/Jargon";
import ConfidenceMeter from "@/components/ConfidenceMeter";

type Risk = "low" | "med" | "high";
const tone: Record<Risk, string> = { low: "bg-success/15 text-success", med: "bg-accent/20 text-foreground", high: "bg-destructive/15 text-destructive" };

export default function RiskReport() {
  const [address, setAddress] = useState("Apt 4, The Foundry, Peckham SE15");
  const [postcode, setPostcode] = useState("SE15 5JR");
  const [tenure, setTenure] = useState<"freehold" | "leasehold">("leasehold");
  const [leaseYrs, setLeaseYrs] = useState(84);
  const [floodZone, setFloodZone] = useState<"1" | "2" | "3">("1");
  const [storeys, setStoreys] = useState(6);
  const [cladding, setCladding] = useState<"none" | "unknown" | "ews1">("unknown");
  const [knotweed, setKnotweed] = useState(false);
  const [subsidence, setSubsidence] = useState(false);
  // Enterprise additions
  const [epc, setEpc] = useState<"A" | "B" | "C" | "D" | "E" | "F" | "G">("D");
  const [groundRent, setGroundRent] = useState(250);          // £/yr
  const [serviceCharge, setServiceCharge] = useState(2400);    // £/yr
  const [serviceChargeGrowth, setServiceChargeGrowth] = useState(7); // %/yr
  const [planning, setPlanning] = useState<"none" | "minor" | "major">("minor");
  const [conservation, setConservation] = useState(false);

  const checks = useMemo(() => {
    const items: { label: string; risk: Risk; note: string }[] = [];
    items.push({
      label: "Lease length",
      risk: tenure === "freehold" ? "low" : leaseYrs < 80 ? "high" : leaseYrs < 90 ? "med" : "low",
      note: tenure === "freehold" ? "Freehold - no lease concerns." : `${leaseYrs} years remaining. ${leaseYrs < 80 ? "Below 80 - extension required, lender risk." : leaseYrs < 90 ? "Plan to extend within 5 years." : "Healthy term."}`,
    });
    items.push({
      label: "Flood risk",
      risk: floodZone === "3" ? "high" : floodZone === "2" ? "med" : "low",
      note: `Environment Agency Zone ${floodZone}. ${floodZone === "3" ? "High probability - insurance loaded." : floodZone === "2" ? "Medium probability - verify insurance." : "Low probability."}`,
    });
    items.push({
      label: "Cladding / EWS1",
      risk: storeys < 5 ? "low" : cladding === "ews1" ? "low" : cladding === "none" ? "low" : "high",
      note: storeys < 5 ? "Under 5 storeys - EWS1 not typically required." : cladding === "ews1" ? "Valid EWS1 form supplied." : "Building 5+ storeys without EWS1 - mortgage risk.",
    });
    items.push({
      label: "Japanese Knotweed",
      risk: knotweed ? "high" : "low",
      note: knotweed ? "Declared - requires management plan & treatment guarantee." : "Not declared in TA6.",
    });
    items.push({
      label: "Subsidence history",
      risk: subsidence ? "high" : "low",
      note: subsidence ? "Past subsidence - request engineer's report." : "No declared history.",
    });
    items.push({
      label: "EPC trajectory",
      risk: ["A", "B", "C"].includes(epc) ? "low" : epc === "D" ? "med" : "high",
      note: ["A", "B", "C"].includes(epc)
        ? `Current EPC ${epc} - meets proposed 2030 MEES standard for rentals.`
        : `Current EPC ${epc} - likely retrofit needed (£8k–£20k) to meet upcoming MEES rules; affects mortgage pricing & rental viability.`,
    });
    items.push({
      label: "Service charge inflation",
      risk: serviceChargeGrowth >= 8 ? "high" : serviceChargeGrowth >= 5 ? "med" : "low",
      note: `Current ${new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(serviceCharge)}/yr growing at ${serviceChargeGrowth}%. In 10 yrs: ${new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(serviceCharge * Math.pow(1 + serviceChargeGrowth / 100, 10))}/yr.`,
    });
    items.push({
      label: "Ground rent",
      risk: tenure === "freehold" ? "low" : groundRent === 0 ? "low" : groundRent > 250 ? "high" : "med",
      note: tenure === "freehold" ? "N/A - freehold." : groundRent === 0 ? "Peppercorn - Leasehold Reform aligned." : groundRent > 250 ? `${groundRent}/yr - onerous, lender concerns above £250 outside London.` : `${groundRent}/yr - within typical lender tolerance.`,
    });
    items.push({
      label: "Local planning pressure",
      risk: planning === "major" ? "high" : planning === "minor" ? "med" : "low",
      note: planning === "major" ? "Major nearby developments - possible disruption + view loss." : planning === "minor" ? "Minor applications nearby - monitor."  : "No active applications within 200m.",
    });
    items.push({
      label: "Conservation / listing",
      risk: conservation ? "med" : "low",
      note: conservation ? "Property in conservation area - alterations require consent (may protect value)." : "Not in conservation area or listed.",
    });
    return items;
  }, [tenure, leaseYrs, floodZone, storeys, cladding, knotweed, subsidence, epc, groundRent, serviceCharge, serviceChargeGrowth, planning, conservation]);

  const score = useMemo(() => {
    const weights = { low: 100, med: 60, high: 20 } as const;
    return Math.round(checks.reduce((s, c) => s + weights[c.risk], 0) / checks.length);
  }, [checks]);

  return (
    <>
      <PageHeader
        eyebrow="Due diligence"
        title="Property Risk Report"
        description="Spot the deal-breakers before you instruct a survey - flood, lease, cladding, knotweed and subsidence."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4 h-fit">
          <h2 className="font-serif text-xl font-bold text-brand">Property details</h2>
          <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div><Label>Postcode</Label><Input value={postcode} onChange={(e) => setPostcode(e.target.value.toUpperCase())} maxLength={10} placeholder="SE15 5JR" /></div>
          <div><Label>Tenure</Label>
            <Select value={tenure} onValueChange={(v: any) => setTenure(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="freehold">Freehold</SelectItem><SelectItem value="leasehold">Leasehold</SelectItem></SelectContent>
            </Select>
          </div>
          {tenure === "leasehold" && (
            <div><Label>Lease years remaining</Label><NumberInput value={leaseYrs} onChange={setLeaseYrs} /></div>
          )}
          <div><Label>Flood zone</Label>
            <Select value={floodZone} onValueChange={(v: any) => setFloodZone(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="1">Zone 1 (low)</SelectItem><SelectItem value="2">Zone 2 (medium)</SelectItem><SelectItem value="3">Zone 3 (high)</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Storeys</Label><NumberInput value={storeys} onChange={setStoreys} /></div>
            <div><Label className="text-xs">Cladding/EWS1</Label>
              <Select value={cladding} onValueChange={(v: any) => setCladding(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">No cladding</SelectItem><SelectItem value="ews1">Has EWS1</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm pt-2"><input type="checkbox" checked={knotweed} onChange={(e) => setKnotweed(e.target.checked)} /> Japanese knotweed declared</div>
          <div className="flex items-center gap-2 text-sm"><input type="checkbox" checked={subsidence} onChange={(e) => setSubsidence(e.target.checked)} /> Past subsidence</div>
          <div className="flex items-center gap-2 text-sm"><input type="checkbox" checked={conservation} onChange={(e) => setConservation(e.target.checked)} /> Conservation area / listed</div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div><Label className="text-xs">EPC</Label>
              <Select value={epc} onValueChange={(v: any) => setEpc(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["A","B","C","D","E","F","G"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Planning pressure</Label>
              <Select value={planning} onValueChange={(v: any) => setPlanning(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="minor">Minor nearby</SelectItem>
                  <SelectItem value="major">Major nearby</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {tenure === "leasehold" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><Label className="text-xs">Ground rent £/yr</Label><NumberInput value={groundRent} onChange={setGroundRent} /></div>
              <div><Label className="text-xs">Service £/yr</Label><NumberInput value={serviceCharge} onChange={setServiceCharge} /></div>
              <div><Label className="text-xs">Growth %</Label><NumberInput value={serviceChargeGrowth} onChange={setServiceChargeGrowth} /></div>
            </div>
          )}
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6 bg-gradient-warm flex items-center justify-between">
            <div>
              <Badge className="bg-brand-muted text-brand border-0 mb-2">Risk score</Badge>
              <p className="font-serif text-4xl font-bold text-brand">{score}<span className="text-base text-muted-foreground font-sans">/100</span></p>
              <p className="text-sm text-muted-foreground mt-1">{score >= 80 ? "Low overall risk" : score >= 60 ? "Moderate - investigate flagged items" : "Significant risks - proceed with caution"}</p>
              <div className="mt-3 max-w-xs">
                <ConfidenceMeter
                  checks={[
                    { id: "pc", label: "Postcode entered", complete: postcode.length >= 5, hint: "Helps target overlays" },
                    { id: "tenure", label: "Tenure & lease length", complete: tenure === "freehold" || leaseYrs > 0 },
                    { id: "epc", label: <><Jargon term="EPC" /> band</>, complete: !!epc },
                    { id: "flood", label: "Flood zone", complete: !!floodZone },
                    { id: "ews1", label: <><Jargon term="EWS1" /> (if 5+ storeys)</>, complete: storeys < 5 || cladding !== "unknown" },
                  ]}
                />
              </div>
            </div>
            {score >= 80 ? <ShieldCheck className="w-12 h-12 text-success" /> : <ShieldAlert className="w-12 h-12 text-destructive" />}
          </Card>
          <LiveOverlaysCard postcode={postcode} showInput={false} />
          {checks.map((c) => (
            <Card key={c.label} className="p-5 flex items-start gap-4">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${c.risk === "high" ? "text-destructive" : c.risk === "med" ? "text-foreground" : "text-success"}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-brand">{c.label}</h3>
                  <Badge className={`${tone[c.risk]} border-0 capitalize`}>{c.risk}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{c.note}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
