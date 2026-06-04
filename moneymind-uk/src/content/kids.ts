// ============================================================================
// MoneyMind Kids — money education for ages 5–16
// A separate, gentler track from the adult course. Maps loosely to what the UK
// curriculum expects children to learn about money at each Key Stage, written
// in plain, friendly language a child (or a parent reading along) can follow.
// No accounts, no jargon, nothing scary — just the building blocks, one idea at
// a time, each with something to TAP or PLAY with.
// ============================================================================

// Keys map to interactive widgets in features/kids/widgets.tsx. A topic without
// a widget is a read-and-reveal card.
export type KidWidget =
  | "coinCounter"
  | "wantsNeeds"
  | "savingsJar"
  | "priceCompare"
  | "interestGrower"
  | "borrowCost"
  | "payslipSplit"
  | "scamSpotter";

export interface KidTopic {
  id: string;
  icon: string; // lucide-react icon name (see components/Icon.tsx)
  title: string;
  intro: string; // one friendly line
  explain: string; // the idea, plainly
  whyTitle?: string; // label on the tap-to-reveal
  why?: string; // the "why it matters", revealed on tap
  remember: string; // the one thing to keep
  widget?: KidWidget;
}

export interface KidBand {
  id: string;
  ageLabel: string;
  keyStage: string;
  name: string;
  tagline: string;
  icon: string;
  // Per-band accent classes (kept to badges/accents; navy ink does the reading).
  theme: {
    chipBg: string;
    chipText: string;
    ring: string;
    dot: string;
    softBg: string;
    accentText: string;
  };
  topics: KidTopic[];
}

export const kidBands: KidBand[] = [
  {
    id: "ages-5-7",
    ageLabel: "Ages 5–7",
    keyStage: "Reception & KS1",
    name: "Money basics",
    tagline: "What money is, where it comes from, and keeping it safe.",
    icon: "PiggyBank",
    theme: {
      chipBg: "bg-sky-100",
      chipText: "text-sky-700",
      ring: "ring-sky-300",
      dot: "bg-sky-400",
      softBg: "bg-sky-50",
      accentText: "text-sky-600",
    },
    topics: [
      {
        id: "what-is-money",
        icon: "Banknote",
        title: "What is money?",
        intro: "Coins and notes we swap for things.",
        explain:
          "Money is what we use to **buy** things — sweets, toys, food, a bus ride. In the UK it comes as **coins** (1p up to £2) and **notes** (£5, £10, £20, £50). The more something costs, the more money you need to give for it.",
        whyTitle: "Why do we use money?",
        why: "Long ago people swapped things — two eggs for a loaf of bread. That's tricky if the baker doesn't want eggs! Money is something everyone agrees to take, so swapping is easy.",
        remember: "Money lets us swap for the things we need and want.",
        widget: "coinCounter",
      },
      {
        id: "where-money-comes-from",
        icon: "HandCoins",
        title: "Where does money come from?",
        intro: "Mostly from working — not a magic machine!",
        explain:
          "Grown-ups get money by **working** at a job. Some money comes as a **gift**, like birthday money from family. Money doesn't appear by itself — someone always did something to earn it.",
        remember: "Money is earned. It runs out if you don't get more.",
      },
      {
        id: "save-or-spend",
        icon: "PiggyBank",
        title: "Save it or spend it?",
        intro: "You can use money now, or keep it for later.",
        explain:
          "When you get money you have a choice. **Spend** it now on something small, or **save** it — keep it safe — until you have enough for something bigger you really want.",
        remember: "Saving a little now means a bigger treat later.",
        widget: "savingsJar",
      },
      {
        id: "wants-vs-needs",
        icon: "Heart",
        title: "Needs and wants",
        intro: "Some things we must have. Some are just nice.",
        explain:
          "A **need** is something we must have to be okay — food, water, a warm home, clothes. A **want** is something nice to have but we'd be fine without — a toy, sweets, a game. Needs come first.",
        remember: "Buy your needs first, then your wants if there's money left.",
        widget: "wantsNeeds",
      },
      {
        id: "keep-money-safe",
        icon: "Shield",
        title: "Keeping money safe",
        intro: "A piggy bank at home, a real bank for more.",
        explain:
          "Small amounts can live in a **piggy bank** or money box. When you have more, grown-ups keep it in a **bank** — a very safe place that looks after money for you until you need it.",
        remember: "Banks keep money safe so it can't get lost or taken.",
      },
    ],
  },
  {
    id: "ages-7-11",
    ageLabel: "Ages 7–11",
    keyStage: "KS2",
    name: "Smart with money",
    tagline: "Making choices, saving for goals, and spotting good value.",
    icon: "Calculator",
    theme: {
      chipBg: "bg-emerald-100",
      chipText: "text-emerald-700",
      ring: "ring-emerald-300",
      dot: "bg-emerald-400",
      softBg: "bg-emerald-50",
      accentText: "text-emerald-600",
    },
    topics: [
      {
        id: "you-cant-buy-everything",
        icon: "Scale",
        title: "You can't buy everything",
        intro: "Money runs out, so we choose.",
        explain:
          "Even grown-ups can't buy everything they'd like. When you pick one thing, you give up buying something else — that's called a **trade-off**. Good choices mean spending on what matters most to you.",
        whyTitle: "What's an 'opportunity cost'?",
        why: "It's a fancy way of saying: the thing you DIDN'T buy. If you spend your £5 on a comic, the opportunity cost is the ice cream you could have had instead.",
        remember: "Every time you spend, you give up something else.",
      },
      {
        id: "saving-for-a-goal",
        icon: "Target",
        title: "Saving for a goal",
        intro: "Big things take a few weeks of saving.",
        explain:
          "If a toy costs £20 and you get £2 pocket money a week, you can't buy it today — but in **10 weeks** you can. Setting a **goal** and saving a bit each week is how people afford bigger things.",
        remember: "A goal + a little each week = you get there.",
        widget: "savingsJar",
      },
      {
        id: "good-value",
        icon: "ShoppingCart",
        title: "Spotting good value",
        intro: "The bigger box isn't always cheaper.",
        explain:
          "Two shops sell the same sweets. One bag is bigger but costs more. To find the **best value** you work out the price for the same amount — then you can see which is really cheaper.",
        remember: "Compare the price for the SAME amount to find the best deal.",
        widget: "priceCompare",
      },
      {
        id: "what-is-a-bank",
        icon: "Landmark",
        title: "What a bank does",
        intro: "It keeps your money and helps it grow a little.",
        explain:
          "A **bank** keeps your money safe and gives you a card to spend it. If you leave savings in the bank, it pays you a small reward called **interest** — a thank-you for letting them look after it.",
        remember: "Money saved in a bank can slowly grow with interest.",
      },
      {
        id: "adverts",
        icon: "Lightbulb",
        title: "Adverts want your money",
        intro: "Ads are made to make you want things.",
        explain:
          "Adverts on TV, games and videos are designed to make things look amazing so you'll **want** to buy them. It's okay to enjoy them — but always ask: do I really need this, or does the advert just want my money?",
        remember: "Adverts are clever. Decide for yourself before you buy.",
      },
      {
        id: "simple-budget",
        icon: "ClipboardList",
        title: "A simple plan for money",
        intro: "Split your money into jobs.",
        explain:
          "A **budget** is just a plan. A great starter plan splits money three ways: some to **spend** now, some to **save** for a goal, and some to **give** to others or charity. Even £3 can be split £1 / £1 / £1.",
        remember: "Spend some, save some, share some.",
      },
    ],
  },
  {
    id: "ages-11-14",
    ageLabel: "Ages 11–14",
    keyStage: "KS3",
    name: "Money decisions",
    tagline: "Bank accounts, interest, borrowing, tax and staying safe online.",
    icon: "CreditCard",
    theme: {
      chipBg: "bg-violet-100",
      chipText: "text-violet-700",
      ring: "ring-violet-300",
      dot: "bg-violet-400",
      softBg: "bg-violet-50",
      accentText: "text-violet-600",
    },
    topics: [
      {
        id: "bank-accounts",
        icon: "CreditCard",
        title: "Bank accounts & cards",
        intro: "Your money, online, with a card to spend it.",
        explain:
          "From around age 11 you can have a **young person's bank account**. It comes with a **debit card** — tapping it spends YOUR own money straight from your account. That's different from a credit card, which spends the bank's money that you have to pay back.",
        whyTitle: "Debit vs credit — what's the difference?",
        why: "Debit = your money, spent now. Credit = borrowed money you pay back later, often with extra added on. Debit can't put you in debt; credit can.",
        remember: "A debit card spends money you already have.",
      },
      {
        id: "interest-saving",
        icon: "TrendingUp",
        title: "Interest: money that grows",
        intro: "Save it, and the bank adds a bit more.",
        explain:
          "**Interest** is a percentage the bank adds to your savings. Leave £100 at 5% for a year and you get £5 — for doing nothing. The longer you leave it, the more it grows, because you earn interest on your interest too.",
        remember: "Saving early gives interest the most time to work.",
        widget: "interestGrower",
      },
      {
        id: "borrowing-costs",
        icon: "ReceiptText",
        title: "Borrowing costs money",
        intro: "Borrow £100, pay back more than £100.",
        explain:
          "When you **borrow** money, you pay it back plus extra — that's interest working the other way. Borrow £100 and you might pay back £120. Borrowing isn't bad, but it always costs, so only borrow when it's really worth it.",
        remember: "What you borrow, you pay back — and then some.",
        widget: "borrowCost",
      },
      {
        id: "why-tax",
        icon: "Landmark",
        title: "Why we pay tax",
        intro: "A bit of everyone's money pays for everyone's stuff.",
        explain:
          "When grown-ups earn money, some of it goes to the government as **tax**. That money pays for things we all share — **schools**, **hospitals (the NHS)**, roads, police and libraries. You can't see your tax, but you use what it pays for every day.",
        remember: "Tax pays for the things we all share.",
      },
      {
        id: "online-safety",
        icon: "ShieldAlert",
        title: "Money safety online",
        intro: "If it seems too good to be true, it is.",
        explain:
          "Online there are **scams** — tricks to take your money or details. Free V-Bucks, a 'prize' you didn't enter for, a message saying 'pay now or else'. Real companies never rush you or ask for passwords. When unsure, ask a trusted adult.",
        remember: "Never share passwords. If it rushes you, it's a scam.",
        widget: "scamSpotter",
      },
    ],
  },
  {
    id: "ages-14-16",
    ageLabel: "Ages 14–16",
    keyStage: "KS4 / GCSE",
    name: "Real-world money",
    tagline: "Payslips, tax & NI, debt, saving and avoiding scams — for real life.",
    icon: "Briefcase",
    theme: {
      chipBg: "bg-amber-100",
      chipText: "text-amber-700",
      ring: "ring-amber-300",
      dot: "bg-amber-400",
      softBg: "bg-amber-50",
      accentText: "text-amber-600",
    },
    topics: [
      {
        id: "first-payslip",
        icon: "FileText",
        title: "Your first payslip",
        intro: "Gross is what you earn. Net is what you keep.",
        explain:
          "Your **gross pay** is the full amount before anything's taken off. From it comes **Income Tax** and **National Insurance**. What lands in your account is your **net pay** — your 'take-home'. That's why a £1,500 job doesn't put £1,500 in your pocket.",
        whyTitle: "When do I start paying tax?",
        why: "You can earn a chunk each year tax-free (the Personal Allowance). Earn above it and you pay Income Tax on the rest. Most part-time student jobs earn under it, so you often pay little or none.",
        remember: "Look at NET pay — that's the money you actually get.",
        widget: "payslipSplit",
      },
      {
        id: "budget-real-life",
        icon: "ClipboardList",
        title: "Budgeting for real life",
        intro: "Rent and bills come first, fun comes after.",
        explain:
          "Adult budgets start with **fixed costs** that don't change much — rent, phone, travel, food. Whatever's left is for **fun and saving**. A popular rule of thumb is **50/30/20**: half on needs, a third on wants, a fifth saved.",
        remember: "Cover needs first. Pay your future self by saving some.",
      },
      {
        id: "debt-and-apr",
        icon: "CreditCard",
        title: "Debt, credit & APR",
        intro: "Credit cards and 'buy now pay later' aren't free.",
        explain:
          "**Credit** lets you spend money you don't have yet. The cost is shown as **APR** — the yearly interest rate. A high APR means borrowing gets expensive fast. Pay credit cards off in full each month and they cost nothing; carry the debt and it grows.",
        remember: "Borrowing is fine — IF you can pay it back on time.",
        widget: "borrowCost",
      },
      {
        id: "saving-investing",
        icon: "PiggyBank",
        title: "Saving & investing basics",
        intro: "A savings account is safe; investing aims higher.",
        explain:
          "**Saving** keeps money safe and adds a little interest. **Investing** (like in shares) can grow more over many years but can go down too. In the UK an **ISA** lets you save or invest without paying tax on what it earns.",
        remember: "Save for soon. Invest for far-off goals — and for the long run.",
        widget: "interestGrower",
      },
      {
        id: "spot-the-scam",
        icon: "ShieldAlert",
        title: "Spotting scams for real",
        intro: "Scammers target teens with jobs and 'easy money'.",
        explain:
          "Watch for fake **job offers**, 'money mule' requests (letting cash pass through your account — that's a crime), and dodgy investment 'tips' on social media. Real opportunities don't need your password, an upfront fee, or a rushed yes.",
        remember: "Upfront fee, secrecy or pressure = walk away.",
        widget: "scamSpotter",
      },
      {
        id: "good-money-habits",
        icon: "Star",
        title: "Habits that pay off",
        intro: "Small habits now beat big effort later.",
        explain:
          "Check your balance before you spend. Save a fixed slice of any money you get — even 10%. Compare before you buy. Avoid borrowing for things you'll use up fast. These tiny habits, repeated, are what actually build money over a life.",
        remember: "Good money habits beat big incomes. Start them now.",
      },
    ],
  },
];

export function getKidBand(id: string): KidBand | undefined {
  return kidBands.find((b) => b.id === id);
}
