// First-time-buyer cost snapshot for one area. Indicative numbers only.
import { Card } from "@/components/ui/card";
import { PoundSterling, Wallet, Receipt, Home as HomeIcon } from "lucide-react";
import { ftbDeposit, ftbMonthly, ftbStampDuty, fmtGBP } from "@/lib/ftbArea";
import RegionTerm from "@/components/RegionTerm";

interface Props {
  medianPrice: number;
  region?: string;
  rate?: number; // current best-guess mortgage rate %
}

export default function AreaFtbSnapshot({ medianPrice, rate = 4.7 }: Props) {
  const deposit = ftbDeposit(medianPrice, 90);
  const monthly = ftbMonthly(medianPrice, rate, 30, 90);
  const sdlt = ftbStampDuty(medianPrice);

  const items = [
    { icon: HomeIcon, label: "Median asking", value: fmtGBP(medianPrice) },
    { icon: Wallet, label: "Deposit (10%)", value: fmtGBP(deposit) },
    { icon: PoundSterling, label: "Monthly (30y)", value: fmtGBP(monthly) },
    { icon: Receipt, label: <><RegionTerm term="stampDuty" /> (FTB)</>, value: sdlt === 0 ? "£0" : fmtGBP(sdlt) },
  ];

  return (
    <Card className="p-4 mt-5 bg-brand-muted/30 border-brand/20">
      <p className="text-[11px] uppercase tracking-widest text-brand font-semibold mb-2">
        First-time buyer snapshot
      </p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2">
            <it.icon className="w-3.5 h-3.5 text-brand mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{it.label}</p>
              <p className="font-mono font-bold text-sm text-foreground truncate">{it.value}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Indicative · 90% LTV · {rate}% rate · 30-year repayment. Your actual offer will differ.
      </p>
    </Card>
  );
}
