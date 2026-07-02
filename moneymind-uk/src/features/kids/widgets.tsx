import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, RotateCcw, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { clsx } from "clsx";
import type { KidWidget } from "../../content/kids";
import { CountUp } from "../../components/CountUp";
import { Confetti } from "../../components/Confetti";

const gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const gbp2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });

// Router: maps a widget key from content/kids.ts to its component.
export function KidWidgetView({ kind, accentText }: { kind: KidWidget; accentText: string }) {
  switch (kind) {
    case "coinCounter":
      return <CoinCounter accentText={accentText} />;
    case "wantsNeeds":
      return <WantsNeeds />;
    case "savingsJar":
      return <SavingsJar accentText={accentText} />;
    case "priceCompare":
      return <PriceCompare />;
    case "interestGrower":
      return <InterestGrower accentText={accentText} />;
    case "borrowCost":
      return <BorrowCost />;
    case "payslipSplit":
      return <PayslipSplit accentText={accentText} />;
    case "scamSpotter":
      return <ScamSpotter />;
    default:
      return null;
  }
}

// Shared shell so every widget reads the same: a soft tray with a "TRY IT" tag.
function Tray({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-navy-50/60 p-4">
      <div className="mb-3 text-[0.7rem] font-bold uppercase tracking-wider text-navy-400">{label}</div>
      {children}
    </div>
  );
}

// ── Coin counter (ages 5–7) ──────────────────────────────────────────────────
const COINS = [
  { label: "1p", value: 1 },
  { label: "2p", value: 2 },
  { label: "5p", value: 5 },
  { label: "10p", value: 10 },
  { label: "20p", value: 20 },
  { label: "50p", value: 50 },
  { label: "£1", value: 100 },
  { label: "£2", value: 200 },
];

function CoinCounter({ accentText }: { accentText: string }) {
  const [pence, setPence] = useState(0);
  const text = pence >= 100 ? gbp2.format(pence / 100) : `${pence}p`;
  return (
    <Tray label="Tap the coins — watch the total add up">
      <div className="flex flex-wrap gap-2">
        {COINS.map((c) => (
          <button
            key={c.label}
            onClick={() => setPence((p) => p + c.value)}
            className="grid h-12 w-12 place-items-center rounded-full border-2 border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 text-sm font-bold text-amber-800 shadow-sm transition-transform duration-100 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label={`Add ${c.label}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold text-navy-400">Total</div>
          <div className={clsx("text-4xl font-bold tabular-nums", accentText)}>{text}</div>
        </div>
        <button
          onClick={() => setPence(0)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 transition-[background-color,transform] duration-150 ease-out hover:bg-navy-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-1"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
        </button>
      </div>
    </Tray>
  );
}

// ── Wants vs needs sorter (ages 5–7) ─────────────────────────────────────────
const SORT_ITEMS = [
  { label: "Food", need: true },
  { label: "A new toy", need: false },
  { label: "Warm coat", need: true },
  { label: "Sweets", need: false },
  { label: "A home", need: true },
  { label: "Video game", need: false },
  { label: "Clean water", need: true },
  { label: "Shoes", need: true },
];

function WantsNeeds() {
  const [placed, setPlaced] = useState<Record<string, "need" | "want">>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const allDone = Object.keys(placed).length === SORT_ITEMS.length;

  function place(label: string, isNeed: boolean, choice: "need" | "want") {
    const correct = isNeed ? "need" : "want";
    if (choice !== correct) {
      setWrong(label);
      setTimeout(() => setWrong((w) => (w === label ? null : w)), 700);
      return;
    }
    setPlaced((p) => ({ ...p, [label]: choice }));
  }

  const remaining = SORT_ITEMS.filter((i) => !placed[i.label]);

  return (
    <Tray label="Is it a need or a want? Tap to sort">
      {allDone && <Confetti count={22} />}
      <div className="flex flex-wrap gap-2">
        {remaining.map((item) => (
          <motion.div
            key={item.label}
            layout
            animate={wrong === item.label ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={clsx(
              "flex items-center gap-1 rounded-full border bg-white px-2 py-1 text-sm font-medium text-navy-700 shadow-sm",
              wrong === item.label ? "border-red-300" : "border-navy-200",
            )}
          >
            <span className="px-1">{item.label}</span>
            <button
              onClick={() => place(item.label, item.need, "need")}
              className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 transition-[background-color,transform] duration-150 ease-out hover:bg-emerald-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
            >
              Need
            </button>
            <button
              onClick={() => place(item.label, item.need, "want")}
              className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700 transition-[background-color,transform] duration-150 ease-out hover:bg-sky-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
            >
              Want
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <SortColumn title="Needs" tone="emerald" items={Object.entries(placed).filter(([, v]) => v === "need").map(([k]) => k)} />
        <SortColumn title="Wants" tone="sky" items={Object.entries(placed).filter(([, v]) => v === "want").map(([k]) => k)} />
      </div>
      {allDone && (
        <p className="mt-3 text-center text-sm font-semibold text-emerald-700">
          All sorted! Needs always come first.
        </p>
      )}
    </Tray>
  );
}

function SortColumn({ title, tone, items }: { title: string; tone: "emerald" | "sky"; items: string[] }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50",
    sky: "border-sky-200 bg-sky-50",
  };
  return (
    <div className={clsx("min-h-[5rem] rounded-xl border-2 border-dashed p-2", tones[tone])}>
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-navy-500">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence>
          {items.map((label) => (
            <motion.span
              key={label}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-navy-700 shadow-sm"
            >
              {label}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Savings jar (ages 5–7 / 7–11) ────────────────────────────────────────────
function SavingsJar({ accentText }: { accentText: string }) {
  const reduce = useReducedMotion();
  const goal = 20;
  const [saved, setSaved] = useState(0);
  const pct = Math.min(100, (saved / goal) * 100);
  const reached = saved >= goal;
  return (
    <Tray label="Save up for a £20 toy — tap to add coins">
      {reached && <Confetti count={26} />}
      <div className="flex items-center gap-4">
        {/* Jar */}
        <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-b-3xl rounded-t-lg border-2 border-navy-300 bg-white">
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-400 to-emerald-300"
            initial={false}
            animate={{ height: `${pct}%` }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-lg font-bold text-navy-900 tabular-nums">{gbp0.format(saved)}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 5].map((n) => (
              <button
                key={n}
                onClick={() => setSaved((s) => Math.min(goal, s + n))}
                disabled={reached}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white shadow-sm transition-[background-color,transform] duration-150 ease-out hover:bg-emerald-600 active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                +£{n}
              </button>
            ))}
            <button
              onClick={() => setSaved(0)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-navy-500 transition-[background-color,transform] duration-150 ease-out hover:bg-navy-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-1"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
            </button>
          </div>
          <p className={clsx("mt-3 text-sm font-semibold", reached ? "text-emerald-700" : accentText)}>
            {reached ? "Goal reached — you can buy the toy!" : `${gbp0.format(goal - saved)} to go`}
          </p>
        </div>
      </div>
    </Tray>
  );
}

// ── Price compare (ages 7–11) ────────────────────────────────────────────────
function PriceCompare() {
  const [revealed, setRevealed] = useState(false);
  // Option A: 200g for £1.50 → 0.75p/g. Option B: 350g for £2.10 → 0.6p/g (better).
  const a = { name: "Small bag", grams: 200, price: 150 };
  const b = { name: "Big bag", grams: 350, price: 210 };
  const aPer = a.price / a.grams; // pence per gram
  const bPer = b.price / b.grams;
  const better = bPer < aPer ? "b" : "a";
  return (
    <Tray label="Same sweets, two bags — which is better value?">
      <div className="grid grid-cols-2 gap-3">
        {[{ key: "a", o: a, per: aPer }, { key: "b", o: b, per: bPer }].map(({ key, o, per }) => (
          <div
            key={key}
            className={clsx(
              "rounded-xl border-2 bg-white p-3 transition-colors",
              revealed && better === key ? "border-emerald-400 ring-2 ring-emerald-200" : "border-navy-200",
            )}
          >
            <div className="font-bold text-navy-900">{o.name}</div>
            <div className="text-sm text-navy-500">{o.grams}g for {gbp2.format(o.price / 100)}</div>
            {revealed && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm font-semibold text-navy-700">
                {per.toFixed(2)}p per gram
                {better === key && <span className="ml-1 text-emerald-600">· best value</span>}
              </motion.div>
            )}
          </div>
        ))}
      </div>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 w-full rounded-xl bg-navy-900 py-2.5 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-navy-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Work out the price per gram
        </button>
      ) : (
        <p className="mt-3 text-center text-sm font-semibold text-emerald-700">
          The big bag is cheaper per gram — that's the better deal.
        </p>
      )}
    </Tray>
  );
}

// ── Interest grower (ages 11–14 / 14–16) ─────────────────────────────────────
function InterestGrower({ accentText }: { accentText: string }) {
  const [years, setYears] = useState(5);
  const principal = 100;
  const rate = 0.05;
  const total = principal * Math.pow(1 + rate, years);
  const earned = total - principal;
  return (
    <Tray label="£100 saved at 5% a year — drag to see it grow">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold text-navy-400">After {years} {years === 1 ? "year" : "years"}</div>
          <div className={clsx("text-4xl font-bold tabular-nums", accentText)}>
            <CountUp value={total} format={(v) => gbp2.format(v)} duration={0.5} />
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold text-emerald-600">+{gbp2.format(earned)}</div>
          <div className="text-navy-400">free, from interest</div>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={20}
        value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        className="mt-4 w-full accent-emerald-500"
        aria-label="Number of years"
      />
      <div className="flex justify-between text-xs text-navy-400">
        <span>1 yr</span>
        <span>20 yrs</span>
      </div>
    </Tray>
  );
}

// ── Borrow cost (ages 11–14 / 14–16) ─────────────────────────────────────────
function BorrowCost() {
  const [amount, setAmount] = useState(100);
  const rate = 0.2; // 20% — illustrative
  const repay = amount * (1 + rate);
  const extra = repay - amount;
  return (
    <Tray label="Borrow money at 20% — see what you pay back">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-navy-600">You borrow</span>
        <span className="text-lg font-bold text-navy-900 tabular-nums">{gbp0.format(amount)}</span>
      </div>
      <input
        type="range"
        min={50}
        max={1000}
        step={50}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="mt-2 w-full accent-amber-500"
        aria-label="Amount borrowed"
      />
      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="text-xs font-semibold text-navy-400">You pay back</div>
          <div className="text-2xl font-bold text-navy-900 tabular-nums">
            <CountUp value={repay} format={(v) => gbp0.format(v)} duration={0.4} />
          </div>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 shadow-sm">
          <div className="text-xs font-semibold text-amber-600">Extra it cost you</div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums">
            <CountUp value={extra} format={(v) => gbp0.format(v)} duration={0.4} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-navy-500">
        That extra is the price of borrowing — money you don't keep.
      </p>
    </Tray>
  );
}

// ── Payslip split (ages 14–16) ───────────────────────────────────────────────
function PayslipSplit({ accentText }: { accentText: string }) {
  const reduce = useReducedMotion();
  const [gross, setGross] = useState(1500); // monthly
  const monthlyPA = 12570 / 12; // tax-free slice per month (simplified)
  const taxable = Math.max(0, gross - monthlyPA);
  const tax = taxable * 0.2;
  const ni = Math.max(0, gross - monthlyPA) * 0.08;
  const net = gross - tax - ni;
  const bar = (v: number) => `${(v / gross) * 100}%`;
  return (
    <Tray label="Drag your monthly pay — see tax & take-home (simplified)">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-navy-600">Gross pay (per month)</span>
        <span className="text-lg font-bold text-navy-900 tabular-nums">{gbp0.format(gross)}</span>
      </div>
      <input
        type="range"
        min={500}
        max={4000}
        step={50}
        value={gross}
        onChange={(e) => setGross(Number(e.target.value))}
        className="mt-2 w-full accent-emerald-500"
        aria-label="Monthly gross pay"
      />
      {/* Stacked bar */}
      <div className="mt-4 flex h-7 w-full overflow-hidden rounded-lg">
        <motion.div className="bg-emerald-500" animate={{ width: bar(net) }} initial={false} transition={reduce ? { duration: 0 } : undefined} title="Take-home" />
        <motion.div className="bg-navy-400" animate={{ width: bar(tax) }} initial={false} transition={reduce ? { duration: 0 } : undefined} title="Income Tax" />
        <motion.div className="bg-amber-400" animate={{ width: bar(ni) }} initial={false} transition={reduce ? { duration: 0 } : undefined} title="National Insurance" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="Take-home" value={net} className={accentText} dot="bg-emerald-500" big />
        <Stat label="Income Tax" value={tax} dot="bg-navy-400" />
        <Stat label="Nat. Insurance" value={ni} dot="bg-amber-400" />
      </div>
    </Tray>
  );
}

function Stat({ label, value, dot, className, big }: { label: string; value: number; dot: string; className?: string; big?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-xs font-medium text-navy-400">
        <span className={clsx("h-2 w-2 rounded-full", dot)} /> {label}
      </div>
      <div className={clsx("font-bold tabular-nums", big ? "text-xl" : "text-base text-navy-700", className)}>
        <CountUp value={value} format={(v) => gbp0.format(v)} duration={0.35} />
      </div>
    </div>
  );
}

// ── Scam spotter (ages 11–14 / 14–16) ────────────────────────────────────────
const MESSAGES = [
  { text: "WINNER! You've won a £500 voucher. Click here and enter your bank PIN to claim now.", scam: true, why: "Real prizes never need your PIN. Pressure + 'click now' = scam." },
  { text: "Your school trip payment of £45 is due Friday — pay via the school app.", scam: false, why: "Expected, specific, and through an official app you know. Looks genuine." },
  { text: "Make £300/week from home! Just let us send money through your bank account.", scam: true, why: "That's a 'money mule' — it's illegal and they keep you on the hook." },
  { text: "Hi, it's Mum on a new number. I've lost my phone — send £100 to this account quick.", scam: true, why: "Classic trick. Always check by calling the person on their known number." },
];

function ScamSpotter() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState<null | boolean>(null);
  const [score, setScore] = useState(0);
  const m = MESSAGES[i];
  const done = i >= MESSAGES.length;

  function answer(guessScam: boolean) {
    if (answered !== null) return;
    const right = guessScam === m.scam;
    if (right) setScore((s) => s + 1);
    setAnswered(right);
  }

  if (done) {
    return (
      <Tray label="Spot the scam">
        <Confetti count={20} />
        <div className="py-2 text-center">
          <div className="text-3xl font-bold text-navy-900 tabular-nums">{score}/{MESSAGES.length}</div>
          <p className="mt-1 text-sm text-navy-500">scams spotted. The trick is always: pressure, secrecy, or asking for details.</p>
          <button
            onClick={() => { setI(0); setAnswered(null); setScore(0); }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-navy-500 transition-[background-color,transform] duration-150 ease-out hover:bg-navy-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-1"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Play again
          </button>
        </div>
      </Tray>
    );
  }

  return (
    <Tray label={`Safe or scam? (${i + 1}/${MESSAGES.length})`}>
      <motion.div
        key={i}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-navy-200 bg-white p-3 text-sm text-navy-700"
      >
        {m.text}
      </motion.div>

      {answered === null ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={() => answer(false)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-emerald-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden /> Safe
          </button>
          <button
            onClick={() => answer(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-red-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <ShieldAlert className="h-4 w-4" aria-hidden /> Scam
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
          <div className={clsx("flex items-center gap-2 text-sm font-bold", answered ? "text-emerald-700" : "text-red-600")}>
            {answered ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
            {answered ? "Correct!" : "Not quite —"} this one is {m.scam ? "a scam" : "safe"}.
          </div>
          <p className="mt-1 text-sm text-navy-600">{m.why}</p>
          <button
            onClick={() => { setI((n) => n + 1); setAnswered(null); }}
            className="mt-3 w-full rounded-xl bg-navy-900 py-2 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-navy-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Next message
          </button>
        </motion.div>
      )}
    </Tray>
  );
}
