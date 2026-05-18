// Plain-English explainer for jargon terms (LTV, MIP, AVM, IRR, EPC, HPI, …).
// Wrap any acronym/label and a (?) icon appears that opens a short, friendly
// explanation on hover/tap. Centralised glossary keeps wording consistent.
import { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const GLOSSARY: Record<string, { short: string; long?: string }> = {
  LTV: { short: "Loan-to-value — how much you're borrowing as a % of the price.", long: "If a £400k home has a £40k deposit, the bank lends £360k → LTV is 90%. Lower LTV usually = cheaper rate." },
  MIP: { short: "Mortgage in Principle — a lender's written estimate of what they'd lend you, valid for 60–90 days.", long: "Estate agents take you more seriously when you have one. A soft credit check, no commitment." },
  AVM: { short: "Automated Valuation Model — a price estimate from recent sales nearby.", long: "Used as a sanity check, not a formal valuation. We blend ONS HPI, sold-price comparables and listing data." },
  IRR: { short: "Internal Rate of Return — the annual % return on your invested cash.", long: "Includes capital growth, rental income, costs and fees over the hold period. A 10-year IRR of 8% beats keeping cash in the bank." },
  EPC: { short: "Energy Performance Certificate — a band A–G showing how energy-efficient the home is.", long: "A 'D' or worse usually means higher bills and could limit lender choice on green mortgages." },
  HPI: { short: "House Price Index — official ONS measure of price changes over time.", long: "We use it to anchor area trends. Lags 2–3 months but is the most reliable national source." },
  FTB: { short: "First-time buyer — never owned property anywhere in the world.", long: "Unlocks Stamp Duty relief, LISA bonus and 95% LTV schemes." },
  SDLT: { short: "Stamp Duty Land Tax (England & N. Ireland) — tax paid when you buy.", long: "Different bands for first-time buyers, second homes and buy-to-let." },
  LBTT: { short: "Land & Buildings Transaction Tax — Scotland's version of Stamp Duty." },
  LTT: { short: "Land Transaction Tax — Wales's version of Stamp Duty." },
  ICR: { short: "Interest Coverage Ratio — for buy-to-let, rent ÷ interest payment.", long: "Lenders typically want 125–145%. Below that and they'll cap how much they'll lend." },
  DSCR: { short: "Debt Service Coverage Ratio — net rent ÷ mortgage payment." },
  LISA: { short: "Lifetime ISA — save up to £4k/year, government adds 25% bonus, must be used for first home up to £450k." },
  EWS1: { short: "External Wall System form — a fire-safety sign-off for flats in tall buildings (post-Grenfell)." },
  HPC: { short: "Help-to-Buy / shared ownership — government schemes that lower the deposit needed." },
  Yield: { short: "Annual rent ÷ price — a quick BTL profitability gauge.", long: "Gross yield ignores costs; net yield strips out tax, voids, management. Aim for >5% gross outside London." },
  Leasehold: { short: "You own the home but not the land — typically a flat with a 99–999 year lease.", long: "Short leases (<80 years) are expensive to extend and can stop a sale. Always check the years remaining." },
  Freehold: { short: "You own the building and the land outright. Most houses are freehold." },
  Conveyancing: { short: "The legal work to transfer ownership — searches, contracts, exchange and completion." },
  SVR: { short: "Standard Variable Rate — the lender's default rate you fall on to when your fixed deal ends.", long: "Almost always much higher than market fixes. Most people remortgage before reverting to SVR." },
  ERC: { short: "Early Repayment Charge — a penalty (typically 1–5% of balance) for leaving a fixed deal early.", long: "Tapers down over the deal. Most lenders waive it in the last 6 months — that's your booking window." },
  AIP: { short: "Agreement in Principle — same thing as a Mortgage in Principle. A lender's written estimate of what they'd lend.", long: "Estate agents call it different things; it's the same document." },
  DIP: { short: "Decision in Principle — same as MIP/AIP. A lender's pre-approval based on a soft credit check." },
  Gazumping: { short: "When the seller accepts a higher offer from someone else after already accepting yours, before contracts exchange.", long: "Most common in England/Wales. Almost impossible to stop. Pace, paperwork-readiness, and a clean chain are your best defences." },
  Gazundering: { short: "When the buyer reduces their offer at the last minute, often days before exchange.", long: "Legal and grim. Mostly happens in falling markets when sellers are desperate." },
  Chain: { short: "A line of buyers and sellers all dependent on each other to complete on the same day.", long: "A 4-link chain has 8 people who must agree everything. The longer the chain, the more likely it falls through." },
  Exchange: { short: "The point where contracts are legally binding — neither party can pull out without major penalty.", long: "Typically 1–2 weeks before completion. Deposit (10% of price) is paid at exchange." },
  Completion: { short: "The day you actually own the home and get the keys.", long: "Money moves between solicitors via CHAPS in the morning; keys are released once funds arrive (usually by 2pm)." },
  Bridging: { short: "Short-term loan (3–12 months) used when you need to buy before selling. Expensive — 0.5–1%/month.", long: "Useful at auction or when chains break. Always have a clear exit (sale or remortgage) before signing." },
  Disbursements: { short: "Third-party fees your solicitor pays on your behalf — searches, Land Registry, AML checks.", long: "Listed separately on your solicitor's invoice. Typically £400–£700 in total." },
  CHAPS: { short: "Same-day bank transfer used to send large sums between solicitors at exchange and completion.", long: "Costs £25–£50. Faster Payments are too slow / capped for property transactions." },
  Equity: { short: "The portion of the home you own outright — price minus mortgage balance.", long: "Grows as you pay down the mortgage and as the home appreciates." },
  Remortgage: { short: "Switching to a new mortgage deal — usually with a different lender — at the end of your fixed term.", long: "Done to avoid your lender's expensive Standard Variable Rate. Start shopping 6 months before your deal ends." },
  ProductTransfer: { short: "Switching to a new deal with your existing lender — no new affordability check, no legal work." },
  Underwriting: { short: "The lender's deep credit and affordability check after you've applied. Triggers further document requests.", long: "Takes 1–3 weeks. The most common stage where mortgages get delayed or refused." },
  Searches: { short: "Checks your solicitor runs against the property — local authority, water/drainage, environmental, sometimes mining.", long: "Take 2–6 weeks. Reveal road schemes, flood risk, contaminated land and other surprises." },
  ServiceCharge: { short: "Annual fee leaseholders pay for building maintenance, insurance, cleaning of common areas.", long: "Typical flat: £1,500–£3,500/yr. Always ask for a 3-year history before offering." },
  GroundRent: { short: "Annual fee leaseholders pay to the freeholder. New leases (post-2022 in England) cap this at £0." },
  Title: { short: "Legal proof of ownership of a property, registered with HM Land Registry." },
  Vendor: { short: "Estate-agent jargon for the seller. Just means 'the person selling the home'." },
  STC: { short: "Sold Subject to Contract — an offer has been accepted but contracts haven't exchanged. Not yet binding on either side." },
};

export interface JargonProps {
  /** The acronym/label as displayed to the user */
  term: string;
  /** Optional override key into the glossary (defaults to `term` upper-cased) */
  glossaryKey?: string;
  /** Children to render as the visible label (defaults to `term`) */
  children?: ReactNode;
  /** Inline button = small (?) icon next to label; default `inline` */
  variant?: "inline" | "icon-only";
  className?: string;
}

export default function Jargon({ term, glossaryKey, children, variant = "inline", className }: JargonProps) {
  const key = (glossaryKey ?? term).toUpperCase();
  const entry = GLOSSARY[key];
  const isMobile = useIsMobile();

  if (!entry) return <span className={className}>{children ?? term}</span>;

  const body = (
    <div className="space-y-1.5 max-w-[260px] text-xs leading-relaxed">
      <p className="font-semibold text-foreground">{term}</p>
      <p className="text-muted-foreground">{entry.short}</p>
      {entry.long && <p className="text-muted-foreground">{entry.long}</p>}
    </div>
  );

  const trigger =
    variant === "icon-only" ? (
      <button type="button" aria-label={`What is ${term}?`} className={cn("inline-flex items-center text-muted-foreground hover:text-brand", className)}>
        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
      </button>
    ) : (
      <button
        type="button"
        aria-label={`What is ${term}?`}
        className={cn("inline-flex items-baseline gap-1 underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 hover:decoration-brand hover:text-brand cursor-help", className)}
      >
        {children ?? term}
        <HelpCircle className="h-3 w-3 text-muted-foreground" aria-hidden />
      </button>
    );

  // Touch devices fire tooltips awkwardly; use a Popover so a tap reveals it.
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3">{body}</PopoverContent>
      </Popover>
    );
  }
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="top" className="bg-popover text-popover-foreground border p-3 shadow-md">
        {body}
      </TooltipContent>
    </Tooltip>
  );
}
