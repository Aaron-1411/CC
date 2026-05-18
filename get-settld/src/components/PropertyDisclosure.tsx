// Rightmove-parity disclosure panel — surfaces the fields Rightmove shows
// that buyers usually have to hunt for. Anything undefined is shown as
// "Not disclosed" so buyers know exactly what to ask the agent.

import { Property } from "@/data/properties";
import { Wifi, Signal, Receipt, Trees as Tree, Car, Home, FileText, History, Droplets, Flame, Landmark } from "lucide-react";
import { fmtFull } from "@/lib/format";

const Row = ({ icon: Icon, label, value, warn }: { icon: typeof Wifi; label: string; value: React.ReactNode; warn?: boolean }) => (
  <div className="flex items-center justify-between gap-2 py-1.5 text-xs border-b last:border-0">
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="w-3 h-3" /> {label}
    </span>
    <span className={`font-mono font-semibold ${warn ? "text-warning" : value === "Not disclosed" ? "text-muted-foreground italic font-normal" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

const NA = "Not disclosed";

export default function PropertyDisclosure({ p }: { p: Property }) {
  const lease = p.tenure === "Leasehold"
    ? p.leaseYearsRemaining != null
      ? <span className={p.leaseYearsRemaining < 90 ? "text-warning" : ""}>{p.leaseYearsRemaining} yrs left</span>
      : NA
    : "Freehold (n/a)";

  return (
    <div className="mt-5 pt-5 border-t">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Full disclosure</p>
      <div className="space-y-0.5">
        <Row icon={Home}    label="Property type"   value={p.propertyType ?? NA} />
        <Row icon={FileText} label="Lease"          value={lease} warn={p.tenure === "Leasehold" && (p.leaseYearsRemaining ?? 999) < 90} />
        {p.tenure === "Leasehold" && (
          <Row icon={Receipt} label="Ground rent"   value={p.groundRent != null ? `${fmtFull(p.groundRent)}/yr` : NA} warn={(p.groundRent ?? 0) > 250} />
        )}
        <Row icon={Receipt} label="Council tax"     value={p.councilTaxBand ? `Band ${p.councilTaxBand}${p.councilTaxAnnual ? ` · ${fmtFull(p.councilTaxAnnual)}/yr` : ""}` : NA} />
        <Row icon={Wifi}    label="Broadband"       value={p.broadbandMbps != null ? `${p.broadbandMbps} Mbps` : NA} warn={(p.broadbandMbps ?? 999) < 50} />
        <Row icon={Signal}  label="Mobile signal"   value={p.mobileSignal ?? NA} warn={p.mobileSignal === "Poor"} />
        <Row icon={Car}     label="Parking"         value={p.parking ?? NA} />
        <Row icon={Tree}    label="Garden"          value={p.garden ?? NA} />
        <Row icon={Flame}   label="Heating"         value={p.heating ?? NA} />
        <Row icon={Droplets} label="Flood risk"     value={p.floodRisk ?? NA} warn={p.floodRisk === "High" || p.floodRisk === "Medium"} />
        <Row icon={Landmark} label="Listed / conservation"
          value={p.listedBuilding || p.conservationArea
            ? [p.listedBuilding && "Listed", p.conservationArea && "Conservation area"].filter(Boolean).join(" · ")
            : "No"} />
        <Row icon={History} label="Chain"           value={p.chainStatus ?? NA} />
        {p.daysOnMarket != null && (
          <Row icon={History} label="Days on market" value={`${p.daysOnMarket} days`} warn={p.daysOnMarket > 60} />
        )}
      </div>

      {p.priceHistory && p.priceHistory.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Price history</p>
          <ul className="text-xs space-y-0.5">
            {p.priceHistory.map((h, i) => (
              <li key={i} className="flex justify-between">
                <span className="text-muted-foreground">{h.date} · {h.event}</span>
                <span className="font-mono">{fmtFull(h.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
