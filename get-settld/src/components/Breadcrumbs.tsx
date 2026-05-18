// Breadcrumbs derived from the current route + PILLARS. Sits under the header
// on every internal page so users always know where they are.
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home as HomeIcon } from "lucide-react";
import { PILLARS } from "@/lib/pillars";

interface Crumb { label: string; to?: string }

const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/mortgage": "Affordability",
  "/mip": "Mortgage in Principle",
  "/deposit": "Deposit & LISA",
  "/true-cost": "True cost",
  "/schemes": "Help-to-buy schemes",
  "/areas": "Areas",
  "/data-twin": "Cheaper lookalike areas",
  "/avm": "What's it worth",
  "/right-fit": "Right-fit",
  "/appreciation": "Appreciation",
  "/investment": "Investment / IRR",
  "/portfolio": "Portfolio compare",
  "/properties": "Property compare",
  "/lease": "Lease deep-dive",
  "/risk": "Risk report",
  "/journey": "Buying plan",
  "/co-buyer": "Co-buyer",
  "/alerts": "Alerts",
  "/viewings": "Viewings",
  "/offer": "Offer strategy",
  "/report": "PDF report",
  "/decide": "Should I buy it?",
  "/shortlist": "Saved properties",
};

function pillarFor(path: string) {
  return PILLARS.find((p) => p.to === path || p.more.some((m) => m.to === path));
}

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  if (pathname === "/" || pathname.startsWith("/start/") || pathname === "/auth") return null;

  const here = ROUTE_LABELS[pathname] ?? pathname.replace("/", "");
  const pillar = pillarFor(pathname);

  const crumbs: Crumb[] = [{ label: "Home", to: "/" }];
  if (pillar && pillar.to !== pathname) {
    crumbs.push({ label: pillar.title, to: pillar.to });
  }
  crumbs.push({ label: here });

  return (
    <nav aria-label="Breadcrumb" className="border-b bg-background/60">
      <ol className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-1 text-[11px] text-muted-foreground overflow-x-auto whitespace-nowrap">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />}
              {c.to && !isLast ? (
                <Link to={c.to} className="hover:text-brand inline-flex items-center gap-1">
                  {i === 0 && <HomeIcon className="h-3 w-3" aria-hidden />}
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground inline-flex items-center gap-1" aria-current="page">
                  {i === 0 && <HomeIcon className="h-3 w-3" aria-hidden />}
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
