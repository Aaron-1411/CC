// Journey model - 4 phases, each containing existing tools mapped as ordered steps.
// Progress is tracked in localStorage so first-time buyers always have a clear "next step".

import {
  PiggyBank, Receipt, Landmark, Calculator,
  MapPinned, Sparkles, Bookmark, GitCompareArrows, Target, Heart, TrendingUp,
  ClipboardList, ShieldAlert, Handshake, LineChart, Wallet,
  ListChecks, FileDown,
  type LucideIcon,
} from "lucide-react";

export type PhaseId = "plan" | "search" | "decide" | "buy";

export interface JourneyStep {
  id: string;          // stable id for progress tracking
  title: string;
  blurb: string;       // one-line "why this matters" for a first-time buyer
  to: string;          // existing tool route
  icon: LucideIcon;
  optional?: boolean;
}

export interface JourneyPhase {
  id: PhaseId;
  number: number;
  title: string;
  tagline: string;     // short headline
  description: string; // 1-2 sentences
  outcome: string;     // what you walk away with
  estimate: string;    // rough time
  steps: JourneyStep[];
}

export const phases: JourneyPhase[] = [
  {
    id: "plan",
    number: 1,
    title: "Plan",
    tagline: "Work out what you can afford",
    description:
      "Before you fall in love with a home, get clear on the deposit, the monthly payment and the schemes you qualify for.",
    outcome: "A realistic budget and a target deposit date.",
    estimate: "~20 min",
    steps: [
      { id: "plan.deposit",   title: "Deposit & LISA Planner",  blurb: "How long until you've saved your deposit - bonus included.", to: "/deposit",   icon: PiggyBank },
      { id: "plan.true-cost", title: "True Cost of Buying",     blurb: "All the cash you'll actually need on completion day.",       to: "/true-cost", icon: Receipt },
      { id: "plan.schemes",   title: "Schemes Eligibility",     blurb: "LISA, First Homes, Shared Ownership, SDLT relief and more.", to: "/schemes",   icon: Landmark },
      { id: "plan.mortgage",  title: "Mortgage Calculator",     blurb: "What the monthly payment looks like at different LTVs.",     to: "/mortgage",  icon: Calculator },
    ],
  },
  {
    id: "search",
    number: 2,
    title: "Search",
    tagline: "Find the right area, then the right home",
    description:
      "Pick neighbourhoods that match your life and budget, then build a shortlist of homes worth viewing.",
    outcome: "2–3 areas you trust and a shortlist of properties.",
    estimate: "ongoing",
    steps: [
      { id: "search.areas",     title: "Area Compare",      blurb: "Schools, crime, transport and price growth side-by-side.", to: "/areas",     icon: MapPinned },
      { id: "search.data-twin", title: "Area Data Twin",    blurb: "Find cheaper neighbourhoods with the same DNA as the one you love.", to: "/data-twin", icon: Sparkles },
      { id: "search.shortlist", title: "Save Properties",   blurb: "Drop in screenshots, links or details from any portal.", to: "/shortlist", icon: Bookmark },
      { id: "search.compare",   title: "Property Compare",  blurb: "Stack your shortlist against each other on what matters.", to: "/properties", icon: GitCompareArrows },
    ],
  },
  {
    id: "decide",
    number: 3,
    title: "Decide",
    tagline: "Pressure-test your favourites",
    description:
      "For each home you're seriously considering, check the price, the long-term value and how well it actually fits you.",
    outcome: "A confident shortlist of 1–2 homes worth offering on.",
    estimate: "~30 min per home",
    steps: [
      { id: "decide.avm",          title: "Property AVM",        blurb: "Is the asking price fair? See comparables and a price range.", to: "/avm",         icon: Target },
      { id: "decide.right-fit",    title: "Right-fit Score",     blurb: "How well this home matches what you actually need.",            to: "/right-fit",   icon: Heart },
      { id: "decide.appreciation", title: "Appreciation Score",  blurb: "Predict 5- and 10-year value growth for the area.",            to: "/appreciation", icon: TrendingUp },
      { id: "decide.investment",   title: "Investment / IRR",    blurb: "If this is also an investment, what's the return?",             to: "/investment",   icon: LineChart, optional: true },
      { id: "decide.portfolio",    title: "Portfolio View",      blurb: "Compare the financial story of every home you're weighing.",   to: "/portfolio",    icon: Wallet, optional: true },
    ],
  },
  {
    id: "buy",
    number: 4,
    title: "Buy",
    tagline: "View, offer, complete",
    description:
      "Run viewings without mixing homes up, surface risks before survey, and put in an offer backed by data.",
    outcome: "Keys in your hand.",
    estimate: "8–16 weeks",
    steps: [
      { id: "buy.viewings", title: "Viewing Tracker",  blurb: "Score every viewing the same way so you can compare fairly.", to: "/viewings", icon: ClipboardList },
      { id: "buy.risk",     title: "Risk Report",      blurb: "Flood, lease, cladding, knotweed - flagged before you spend on survey.", to: "/risk",     icon: ShieldAlert },
      { id: "buy.offer",    title: "Offer Strategy",   blurb: "A defensible offer range based on comparables and leverage.", to: "/offer",    icon: Handshake },
      { id: "buy.journey",  title: "Buying Checklist", blurb: "Step-by-step from offer accepted to keys.",                  to: "/journey",  icon: ListChecks },
      { id: "buy.report",   title: "PDF Report",       blurb: "Export everything you've learned about the home.",            to: "/report",   icon: FileDown, optional: true },
    ],
  },
];

export const getPhase = (id: string): JourneyPhase | undefined =>
  phases.find((p) => p.id === id);

// ───── progress (localStorage) ────────────────────────────────────────────────

const KEY = "homestead.journey.progress.v1";

interface Progress {
  done: string[];          // step ids
  currentPhase?: PhaseId;  // last phase the user opened
}

function read(): Progress {
  if (typeof window === "undefined") return { done: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { done: [] };
    const p = JSON.parse(raw);
    return { done: Array.isArray(p.done) ? p.done : [], currentPhase: p.currentPhase };
  } catch {
    return { done: [] };
  }
}

function write(p: Progress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("journey:progress"));
}

export const loadProgress = (): Progress => read();

export function toggleStep(stepId: string, done: boolean) {
  const p = read();
  const set = new Set(p.done);
  if (done) set.add(stepId); else set.delete(stepId);
  write({ ...p, done: Array.from(set) });
}

export function setCurrentPhase(phase: PhaseId) {
  const p = read();
  write({ ...p, currentPhase: phase });
}

export function resetProgress() {
  write({ done: [] });
}

export function phaseProgress(phase: JourneyPhase, done: string[]) {
  const required = phase.steps.filter((s) => !s.optional);
  const completed = required.filter((s) => done.includes(s.id)).length;
  return {
    completed,
    total: required.length,
    pct: required.length === 0 ? 0 : Math.round((completed / required.length) * 100),
  };
}

// Suggest the next phase to open: first phase that isn't 100% complete,
// otherwise the last phase.
export function suggestedNextPhase(done: string[]): JourneyPhase {
  for (const p of phases) {
    const { completed, total } = phaseProgress(p, done);
    if (completed < total) return p;
  }
  return phases[phases.length - 1];
}

// Suggest the next step inside a given phase.
export function nextStepInPhase(phase: JourneyPhase, done: string[]): JourneyStep | undefined {
  return phase.steps.find((s) => !s.optional && !done.includes(s.id))
      ?? phase.steps.find((s) => !done.includes(s.id));
}
