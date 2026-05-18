// Six user-facing surfaces. Every other tool is reachable via "More in this pillar"
// or the existing deep routes — but the front door stays simple.
import {
  Zap, Calculator, MapPinned, Home as HomeIcon, ShieldAlert, ListChecks,
  PiggyBank, Receipt, Landmark, Sparkles, Target, Heart, TrendingUp,
  LineChart, Wallet, GitCompareArrows, ClipboardList, Handshake, FileDown,
  Users, Bell, Scroll, ShieldCheck, RefreshCw,
  type LucideIcon,
} from "lucide-react";

export interface Pillar {
  id: string;
  title: string;
  tagline: string;
  to: string;
  icon: LucideIcon;
  more: { title: string; to: string; icon: LucideIcon; advanced?: boolean }[];
}

export const PILLARS: Pillar[] = [
  {
    id: "affordability",
    title: "Can I afford it?",
    tagline: "Deposit, monthly cost and stamp duty for first-time buyers — in plain English.",
    to: "/mortgage",
    icon: Calculator,
    more: [
      { title: "Mortgage in Principle", to: "/mip", icon: ShieldCheck },
      { title: "Deposit & LISA planner", to: "/deposit", icon: PiggyBank },
      { title: "True cost & year-1 bills", to: "/true-cost", icon: Receipt },
      { title: "Help-to-buy schemes", to: "/schemes", icon: Landmark },
      { title: "Remortgage comparator", to: "/remortgage", icon: RefreshCw, advanced: true },
    ],
  },
  {
    id: "area",
    title: "Is the area right?",
    tagline: "Schools, transport, crime and what it actually costs to live there.",
    to: "/areas",
    icon: MapPinned,
    more: [
      { title: "Cheaper lookalike areas", to: "/data-twin", icon: Sparkles },
    ],
  },
  {
    id: "verdict",
    title: "Should I buy it?",
    tagline: "Paste a listing — get a green/amber/red answer in under a minute.",
    to: "/decide",
    icon: Zap,
    more: [],
  },
  {
    id: "property",
    title: "What's it worth?",
    tagline: "Is the price fair? Does it fit your life?",
    to: "/avm",
    icon: HomeIcon,
    more: [
      { title: "Right-fit score", to: "/right-fit", icon: Heart },
      { title: "Appreciation outlook", to: "/appreciation", icon: TrendingUp },
      { title: "Property compare", to: "/properties", icon: GitCompareArrows },
      { title: "Investment / IRR", to: "/investment", icon: LineChart, advanced: true },
      { title: "Portfolio compare", to: "/portfolio", icon: Wallet, advanced: true },
      { title: "Lease deep-dive", to: "/lease", icon: Scroll, advanced: true },
    ],
  },
  {
    id: "risk",
    title: "What could go wrong?",
    tagline: "Flood, lease, cladding, knotweed and subsidence — surfaced before you pay for a survey.",
    to: "/risk",
    icon: ShieldAlert,
    more: [],
  },
  {
    id: "plan",
    title: "How do I buy it?",
    tagline: "Step-by-step from offer to keys — with viewing notes, offer strategy and a final report.",
    to: "/journey",
    icon: ListChecks,
    more: [
      { title: "Buy with someone", to: "/co-buyer", icon: Users },
      { title: "Alerts & verdict history", to: "/alerts", icon: Bell },
      { title: "Viewing tracker", to: "/viewings", icon: ClipboardList },
      { title: "Offer strategy", to: "/offer", icon: Handshake },
      { title: "PDF report", to: "/report", icon: FileDown },
    ],
  },
];
