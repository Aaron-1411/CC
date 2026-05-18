import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Faq = { q: string; a: string };

const FTB: Faq[] = [
  { q: "How much deposit do I really need?", a: "Most lenders ask for 5–10% of the price as a minimum. Bigger deposits unlock cheaper interest rates: the bands that matter are 90%, 85%, 80%, 75% and 60% loan-to-value (LTV). Aim for at least 10% if you can — you'll typically save 0.3–0.6% on the rate vs 95% products." },
  { q: "What is Stamp Duty / LBTT / LTT and do I have to pay it?", a: "It's a tax on the price you pay for a home. England & N. Ireland use SDLT, Scotland uses LBTT, Wales uses LTT. First-time buyers get relief on the first £425,000 in England (no tax up to that threshold, then reduced rates to £625k). Use the True Cost tool to see what you'd actually pay." },
  { q: "What's the difference between AIP, MIP, DIP and a mortgage offer?", a: "AIP (Agreement in Principle), MIP (Mortgage in Principle) and DIP (Decision in Principle) are the same thing — a soft check confirming a lender would lend you a rough amount. They're free, last 30–90 days, and are what estate agents ask for before booking viewings. A formal mortgage offer comes later, after a full underwrite on a specific property." },
  { q: "How long does buying actually take?", a: "From offer accepted to keys: typically 12–16 weeks in England & Wales, 6–8 weeks in Scotland (faster because of the missives system). New-build off-plan can be 6–12 months. The Journey tool maps every step and lets you generate calendar reminders." },
  { q: "What other costs are there beyond the deposit?", a: "Solicitor (£1,200–£1,800), searches (£300–£450), survey (£400–£1,200 depending on level), mortgage product fee (£0–£1,499), broker fee (£0–£500), removals (£500–£1,500), and ~2% contingency for the unexpected. The True Cost tool itemises every line and stress-tests with a contingency buffer." },
  { q: "Should I use a mortgage broker?", a: "For first-time buyers — almost always yes. A whole-of-market broker has access to lenders that don't sell direct, knows which lenders accept your circumstances (self-employed, contract work, gifted deposits, adverse credit), and the fee is usually offset by a better rate. Free brokers are paid by the lender; fee-based brokers are paid by you (£300–£600 typical)." },
  { q: "What schemes can help me buy?", a: "Lifetime ISA (25% government bonus on up to £4k/yr toward your deposit), Shared Ownership (buy 25–75% and rent the rest), First Homes (30–50% discount on selected new builds), and the Mortgage Guarantee Scheme (95% LTV mortgages backed by HM Treasury). The Schemes tool checks which you qualify for." },
];

const HUNTERS: Faq[] = [
  { q: "How do I tell if a property is overpriced?", a: "Use the AVM (automated valuation) tool to get a market estimate from comparable sales (Land Registry data), then compare against the asking price. Anything more than 5–8% above the AVM mid-point with no obvious justification (renovation, big garden, school catchment) is a red flag." },
  { q: "What should I look for at a viewing?", a: "Damp (smell, blown plaster, fresh paint in odd spots), window/door alignment (subsidence), boiler age, EPC rating, parking, mobile signal, and traffic noise at peak times. Use the Viewing Mode checklist — it walks you through 30+ checks and lets you photograph evidence per room." },
  { q: "How do I make an offer that gets accepted without overpaying?", a: "The Offer Strategy tool gives you a position-aware ladder: opening offer, walk-away price, and what proof of funds + chain status to show. Cash and chain-free buyers often beat higher offers from buyers in long chains." },
  { q: "What's the difference between freehold and leasehold?", a: "Freehold = you own the land and the building outright. Leasehold = you own the right to occupy for X years (typical flats are 99–125 years, sometimes 999). Watch for: short remaining lease (<80 years is expensive to extend), high or escalating ground rent, and service charges. Use the Lease Analysis tool to estimate extension cost." },
  { q: "Should I commission a full structural survey?", a: "RICS Level 2 (HomeBuyer) is fine for most modern homes in good condition. RICS Level 3 (Building Survey) for anything pre-1930, listed, with extensions, or visible defects. Skipping the survey to save £600 is the most expensive false economy in property." },
  { q: "How do I assess the area, not just the property?", a: "The Areas tool aggregates crime stats, school Ofsted ratings, transport links (TfL/National Rail times), flood risk, and 5-year price trend. Cross-reference with the Right Fit tool which scores commute, schools, green space, and amenities against your priorities." },
  { q: "What's a chain and why does it matter?", a: "A chain is a sequence of dependent transactions — your seller is buying somewhere else, whose seller is buying somewhere else, etc. Longer chains have higher fall-through rates (33% UK average). Chain-free properties (executor sales, BTL exits, new builds) complete faster and more reliably." },
];

const REMORTGAGE: Faq[] = [
  { q: "When should I start looking at remortgaging?", a: "6 months before your current deal ends. Most lenders let you book a new rate up to 6 months ahead — if rates fall, you can switch to a cheaper product before completion (usually free); if they rise, you've locked in. The Remortgage tool shows your booking window timeline." },
  { q: "Should I fix for 2, 5, or 10 years?", a: "Depends on rate-direction expectations and life plans. 2-year deals price the cheapest today but you re-do fees every 2 years. 5-year deals trade ~0.2–0.4% higher rate for stability. 10-year fixes are rare and only worth it if you're certain you'll stay. The tool's stress chart shows what each looks like if rates move ±2%." },
  { q: "What is an ERC (Early Repayment Charge)?", a: "A penalty for leaving your fixed deal early — typically 1–5% of the outstanding balance, tapering down each year. On a £200k mortgage a 3% ERC is £6,000. Always check whether the savings from switching cover the ERC over your chosen horizon. The Remortgage tool includes ERC in net cost." },
  { q: "Should I take a product fee or a fee-free deal?", a: "Run the maths over the fix length: a £999 fee with a 0.2% lower rate beats fee-free on loans above ~£100k for a 5-year fix, but loses for smaller loans or shorter fixes. The comparator does this automatically." },
  { q: "Can I overpay my mortgage?", a: "Most lenders allow 10% of the balance per year overpayment penalty-free during a fix. Overpayments are the single biggest interest-saver: an extra £200/month on a £200k 4.5% mortgage saves ~£35k interest over the term. The tool models recurring + lump-sum overpayments." },
  { q: "What is SVR and why does it matter?", a: "Standard Variable Rate — the lender's default rate after your fix ends, typically 7–9% (much higher than fixed deals). If you do nothing your payment will jump dramatically. The 'Stay' option in the comparator models this automatically." },
  { q: "Should I use my existing lender (product transfer) or remortgage to a new lender?", a: "Product transfers are faster (no legal work, no income re-check) but rates are often 0.1–0.3% worse than the open market. Remortgaging to a new lender takes 4–8 weeks and needs a fresh affordability check — but the rate gap usually pays for itself within 6 months." },
  { q: "Will I pass affordability if my circumstances changed?", a: "Lenders re-check income, expenses, dependents, and any new debts on a remortgage to a new lender. The Affordability Check on the Remortgage tool models stress headroom — if you're close to the edge, a product transfer (no re-check) may be safer." },
];

function Section({ items, query }: { items: Faq[]; query: string }) {
  const filtered = query
    ? items.filter((i) => (i.q + i.a).toLowerCase().includes(query.toLowerCase()))
    : items;
  if (filtered.length === 0) {
    return <p className="text-sm text-muted-foreground py-6">No questions match "{query}". Try a different word.</p>;
  }
  return (
    <Accordion type="multiple" className="w-full">
      {filtered.map((f, i) => (
        <AccordionItem key={i} value={`${i}`}>
          <AccordionTrigger className="text-left text-sm sm:text-base font-semibold">{f.q}</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function Faqs() {
  const [query, setQuery] = useState("");
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Frequently asked questions"
        description="Plain-English answers for first-time buyers, house hunters, and remortgagers — with pointers to the tools that calculate the maths for your situation."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs (e.g. deposit, ERC, survey)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs defaultValue="ftb" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="ftb" className="text-xs sm:text-sm">First-time buyers</TabsTrigger>
            <TabsTrigger value="hunters" className="text-xs sm:text-sm">House hunters</TabsTrigger>
            <TabsTrigger value="remo" className="text-xs sm:text-sm">Remortgagers</TabsTrigger>
          </TabsList>
          <TabsContent value="ftb"><Card className="p-4 sm:p-6"><Section items={FTB} query={query} /></Card></TabsContent>
          <TabsContent value="hunters"><Card className="p-4 sm:p-6"><Section items={HUNTERS} query={query} /></Card></TabsContent>
          <TabsContent value="remo"><Card className="p-4 sm:p-6"><Section items={REMORTGAGE} query={query} /></Card></TabsContent>
        </Tabs>
        <p className="text-xs text-muted-foreground text-center">
          Can't find what you need? Open Holly (the chat bubble bottom-right) — she's trained on every tool in the toolkit.
        </p>
      </div>
    </>
  );
}
