import type { CourseModule } from "../../lib/types";
import { tutorPrompt } from "../tutor";

// ============================================================================
// TIER 1 — SURVIVE: the money survival kit, fast easy wins.
// Play order: M0 Mindset · M2 Budgeting · M18 Banking · M19 Bills · M6 Scams ·
// M22 When Money Is Tight · M8 Emergency Fund.
// All figures verified for 2026/27 and mirror UK_FIGURES / the curriculum.
// ============================================================================

export const tier1Modules: CourseModule[] = [
  {
    id: 0,
    code: "M0",
    tier: 1,
    level: 0,
    slug: "money-mindset",
    title: "Money Mindset & Goals",
    icon: "Compass",
    summary: "Get your head straight and set one real goal before touching the numbers.",
    tldr: "Money is emotional, not just maths. Set one specific, dated goal and follow the 'order of operations' — buffer and clearing expensive debt come before investing. Free UK money help always exists.",
    estMinutes: 12,
    lesson: [
      {
        heading: "Why money feels stressful (and why that's normal)",
        body: "Money is emotional, not just mathematical. Avoidance, shame and \"I'm just bad with money\" are learned habits — not fixed parts of who you are. The good news: small habits, repeated, quietly compound into big change.",
        callout: {
          type: "tip",
          text: "The goal isn't to become a different person — it's to build a few small habits that stick.",
        },
      },
      {
        heading: "The order of operations",
        body: "There's a sensible order to money: understand your income → clear expensive debt and claim what you're owed → build a buffer → grow savings and investments → make big decisions → optimise tax. Each MoneyMind tier is one rung of that ladder.",
        callout: {
          type: "figure",
          text: "Most people jump straight to \"should I invest?\" — but a £2,000 buffer and clearing a 39% APR card beats almost any investment return.",
        },
      },
      {
        heading: "Goals that actually work",
        body: "Vague goals (\"save more\") rarely happen; specific ones do. Compare \"save more\" with \"£1,000 emergency fund by December, £85 a month\". Write down three things: the **amount**, the **date**, and the **monthly figure**.",
      },
      {
        heading: "The free-help principle",
        body: "You never have to pay for money guidance in the UK. **MoneyHelper** (government-backed) and **Citizens Advice** are free and impartial. Anyone who charges you for basic money or debt help is best avoided.",
        govLink: { label: "MoneyHelper — free money guidance", url: "https://www.moneyhelper.org.uk" },
      },
    ],
    quiz: [
      {
        id: "m0q1",
        question: "Which should usually come first?",
        options: ["Investing in shares", "Building a small emergency fund", "Buying a home", "Opening a pension"],
        correctIndex: 1,
        explanation: "A buffer stops a surprise bill becoming new debt; it's the foundation everything else sits on.",
      },
      {
        id: "m0q2",
        question: "Which is a \"good\" money goal?",
        options: ["\"Save more money\"", "\"Be better with cash\"", "\"£1,000 saved by 31 December, £85/month\"", "\"Spend less\""],
        correctIndex: 2,
        explanation: "Specific, measurable and dated goals are far likelier to actually happen.",
      },
      {
        id: "m0q3",
        question: "True or false: you sometimes have to pay for trustworthy money guidance in the UK.",
        options: ["True", "False"],
        correctIndex: 1,
        explanation: "MoneyHelper and Citizens Advice are free and impartial — you never have to pay for basic money guidance.",
      },
    ],
    tool: null,
    quest: {
      task: "Write down one money goal — the amount, the deadline and the monthly figure — and keep it somewhere you'll see it.",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt("Money Mindset & Goals"),
    suggestedQuestions: [
      "How do I stop avoiding my bank balance?",
      "What's a realistic first money goal?",
      "Why shouldn't I just start investing now?",
    ],
    badge: { id: "first-steps", label: "First Steps", description: "Set your first money goal and learned the order of operations." },
  },

  {
    id: 2,
    code: "M2",
    tier: 1,
    level: 1,
    slug: "budgeting",
    title: "Budgeting & Cashflow",
    icon: "Wallet",
    summary: "Know what's coming in and going out — and make a plan you'll actually stick to.",
    tldr: "Track one month of spending, use 50/30/20 as a flexible guide, automate saving on payday, and use sinking funds for annual bills.",
    estMinutes: 15,
    lesson: [
      {
        heading: "You can't manage what you can't see",
        body: "One month of honest tracking beats any app forever. Pull three months of bank statements and group your spending into **needs**, **wants** and **savings**. No shame allowed — this is just information.",
        callout: {
          type: "tip",
          text: "Look for \"zombie\" subscriptions and forgotten direct debits first — they're the easiest wins.",
        },
      },
      {
        heading: "A budget that survives real life",
        body: "The **50/30/20** starting point: roughly 50% on needs, 30% on wants, 20% on savings and debt. It's a guide, not a rule — in many UK cities housing alone eats more than 50%, so adjust it to your reality.",
      },
      {
        heading: "Pay yourself first",
        body: "Set a standing order to savings for the day after payday, so saving happens *before* spending. Even £25 a month builds the habit.",
        callout: {
          type: "figure",
          text: "Automating beats willpower: people who move savings on payday save roughly twice as much as those who \"save what's left\".",
        },
      },
      {
        heading: "Handling irregular income and big bills",
        body: "Use **sinking funds**: divide annual bills (car, Christmas, insurance) by 12 and set that amount aside each month, so they never blindside you. The free MoneyHelper budget planner is a good place to start.",
        govLink: { label: "MoneyHelper budget planner", url: "https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner" },
      },
    ],
    quiz: [
      {
        id: "m2q1",
        question: "What's the first practical step to budgeting?",
        options: ["Download a budgeting app", "Track where your money actually goes for a month", "Cut up your cards", "Open a new savings account"],
        correctIndex: 1,
        explanation: "Awareness comes before any plan — you can't manage money you can't see.",
      },
      {
        id: "m2q2",
        question: "In the 50/30/20 guide, what is the 20?",
        options: ["Wants", "Needs", "Savings and debt repayment", "Tax"],
        correctIndex: 2,
        explanation: "Needs 50, wants 30, and 20 for future-you: savings and clearing debt.",
      },
      {
        id: "m2q3",
        question: "\"Pay yourself first\" means…",
        options: ["Spend on treats before bills", "Move money to savings automatically on payday", "Pay your biggest bill first", "Save whatever is left at month-end"],
        correctIndex: 1,
        explanation: "Saving before spending removes the reliance on willpower.",
      },
    ],
    tool: {
      kind: "payslip",
      title: "Where does my money go?",
      description: "Enter your salary to see your take-home, then picture it as a rough 50/30/20 split.",
    },
    quest: {
      task: "Cancel or list one subscription you'd forgotten, and set up one standing order to savings.",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt("Budgeting & Cashflow"),
    suggestedQuestions: [
      "How do I budget on an irregular income?",
      "What's a sinking fund?",
      "How much should I really be saving?",
    ],
    badge: { id: "budget-builder", label: "Budget Builder", description: "Built a budget and automated your first savings." },
  },

  {
    id: 18,
    code: "M18",
    tier: 1,
    level: 1,
    slug: "banking-and-switching",
    title: "Banking & Switching",
    icon: "Building2",
    summary: "Get the right account, dodge overdraft fees, and bag a switching bonus.",
    tldr: "Most UK banking is free — avoid fees, treat overdrafts as expensive short-term borrowing, and use the 7-working-day switch guarantee (often with a £100+ bonus). FSCS protects £120,000 per banking licence.",
    estMinutes: 14,
    lesson: [
      {
        heading: "Your current account is the hub",
        body: "Most everyday banking in the UK is free. What matters is avoiding fees and picking features that suit you — fee-free vs packaged accounts, joint accounts, and app quality.",
        callout: {
          type: "tip",
          text: "\"Packaged\" accounts charging a monthly fee for insurance bundles are often poor value — only worth it if you'd genuinely use the perks.",
        },
      },
      {
        heading: "Overdrafts are expensive borrowing",
        body: "Arranged overdrafts now typically charge around **35–40% EAR** — pricier than many credit cards. Treat an overdraft as short-term only, and move ongoing borrowing to something cheaper.",
        callout: {
          type: "warning",
          text: "Living permanently in your overdraft is a quiet, costly debt — flag it as a priority to clear.",
        },
      },
      {
        heading: "Switching is easy and can pay",
        body: "The **Current Account Switch Service** moves everything — direct debits, salary, balance — in **7 working days**, guaranteed, and refunds any errors. Banks regularly offer **switch bonuses** (often £100–£175) to win your custom.",
        callout: {
          type: "figure",
          text: "Switching takes minutes and is one of the fastest \"Money Found\" wins there is.",
        },
        govLink: { label: "Current Account Switch Service", url: "https://www.currentaccountswitch.co.uk" },
      },
      {
        heading: "Your money is protected",
        body: "Up to **£120,000** per banking licence is covered by the **FSCS** if a bank fails. If you hold more than that, spread it across separate banking licences (some brands share one — check).",
        govLink: { label: "FSCS — protected money", url: "https://www.fscs.org.uk" },
      },
    ],
    quiz: [
      {
        id: "m18q1",
        question: "The Current Account Switch Service completes a switch in…",
        options: ["24 hours", "7 working days", "30 days", "3 months"],
        correctIndex: 1,
        explanation: "And it's guaranteed, with any errors refunded.",
      },
      {
        id: "m18q2",
        question: "An arranged overdraft is usually…",
        options: ["The cheapest way to borrow", "Interest-free", "An expensive way to borrow (~35–40% EAR)", "Free if repaid within a year"],
        correctIndex: 2,
        explanation: "Often pricier than a credit card — use it only short-term.",
      },
      {
        id: "m18q3",
        question: "A monthly-fee \"packaged\" account is worth it only if…",
        options: ["You want a debit card", "You'd actually use the bundled perks", "You have a big balance", "You're a new customer"],
        correctIndex: 1,
        explanation: "Otherwise the monthly fee is money wasted.",
      },
    ],
    tool: null,
    quest: {
      task: "Compare your current account against switch deals — and switch if a better one (or a bonus) is worth it.",
      xp: 75,
      moneyFound: 150,
      unlocksBadge: "switcher",
    },
    tutorSystemPrompt: tutorPrompt("Banking & Switching"),
    suggestedQuestions: [
      "Is it worth switching banks for a bonus?",
      "How do I get out of my overdraft?",
      "Are packaged accounts worth the fee?",
    ],
    badge: { id: "account-ace", label: "Account Ace", description: "Chose the right account and learned how to switch and save." },
  },

  {
    id: 19,
    code: "M19",
    tier: 1,
    level: 1,
    slug: "bills-and-cutting-costs",
    title: "Bills & Cutting Costs",
    icon: "PlugZap",
    summary: "Cut the big recurring bills — energy, broadband, mobile, council tax — without changing your life.",
    tldr: "Beat the loyalty penalty: diary renewals and switch or haggle. The energy price cap (~£1,641/yr typical use, rising to £1,862 from July 2026) caps rates not your bill; check the Warm Home Discount, social tariffs and your council tax band.",
    estMinutes: 16,
    lesson: [
      {
        heading: "The loyalty penalty is real",
        body: "Staying put usually costs more: insurers, broadband and energy firms quietly raise prices for loyal customers. Diarising renewals and switching or haggling is where mass-market money is found.",
        callout: {
          type: "tip",
          text: "Set a phone reminder two weeks before any contract ends — that's your moment to switch or haggle.",
        },
      },
      {
        heading: "Energy",
        body: "The **Ofgem price cap** limits unit rates and standing charges for a typical direct-debit home — it's **not** a cap on your total bill — and changes every three months. It's about **£1,641/yr** for typical use to June 2026, rising to **£1,862** from July 2026. A fixed deal can beat it; submit meter readings; and check the **Warm Home Discount (£150)** if you're on a low income.",
        callout: {
          type: "figure",
          text: "Quoted cap figures are \"for typical use\" — your bill depends on what you actually use.",
        },
        govLink: { label: "Ofgem — energy price cap", url: "https://www.ofgem.gov.uk/energy-price-cap" },
      },
      {
        heading: "Broadband, mobile & TV",
        body: "Out of contract, you're usually overpaying — switch or haggle (the **One Touch Switch** process makes broadband easy). New contracts must now show rises in **pounds and pence**, not inflation-linked. **Social tariffs** for those on Universal Credit or PIP are much cheaper.",
        govLink: { label: "Ofcom — costs and bills", url: "https://www.ofcom.org.uk/phones-and-broadband" },
      },
      {
        heading: "Council tax & water",
        body: "You can challenge your **council tax band** if it looks wrong, and check whether you qualify for **Council Tax Reduction**. Water meters help low-use households, and social tariffs exist for water too.",
      },
    ],
    quiz: [
      {
        id: "m19q1",
        question: "The energy price cap is…",
        options: ["A cap on your total annual bill", "A cap on unit rates and standing charges for typical use, not your total bill", "A fixed price everyone pays", "Only for prepayment meters"],
        correctIndex: 1,
        explanation: "Your bill depends on how much energy you actually use.",
      },
      {
        id: "m19q2",
        question: "Best time to switch or haggle a broadband/mobile deal?",
        options: ["Mid-contract", "When you're out of contract", "Right after signing", "Never — it's not allowed"],
        correctIndex: 1,
        explanation: "No exit fees, and you have leverage to negotiate.",
      },
      {
        id: "m19q3",
        question: "The \"loyalty penalty\" means…",
        options: ["Loyal customers get discounts", "Long-standing customers often pay more than new ones", "You're fined for switching", "Banks reward you for staying"],
        correctIndex: 1,
        explanation: "Which is exactly why switching and haggling pays.",
      },
    ],
    tool: null,
    quest: {
      task: "Pick one bill — energy, broadband or mobile — and either switch or call to haggle it down.",
      xp: 75,
      moneyFound: 200,
      unlocksBadge: "switcher",
    },
    tutorSystemPrompt: tutorPrompt("Bills & Cutting Costs"),
    suggestedQuestions: [
      "How does the energy price cap actually work?",
      "How do I haggle my broadband bill?",
      "Can I challenge my council tax band?",
    ],
    badge: { id: "bill-buster", label: "Bill Buster", description: "Learned to cut the big recurring bills and beat the loyalty penalty." },
  },

  {
    id: 6,
    code: "M6",
    tier: 1,
    level: 2,
    slug: "scams-fraud",
    title: "Scams & Fraud",
    icon: "ShieldAlert",
    summary: "Spot the cons, protect your money, and know exactly what to do if you're hit.",
    tldr: "Your bank, HMRC and the police will never ask you to move money to a \"safe account\" or read out a code. Urgency is the manipulation. If hit, call your bank, report to Action Fraud, and forward scam texts to 7726.",
    estMinutes: 14,
    lesson: [
      {
        heading: "The one rule that stops most scams",
        body: "Your bank, HMRC or the police will **never** ask you to move money to a \"safe account\", read out a code, or pay in gift cards. Anyone who does is a scammer.",
        callout: {
          type: "warning",
          text: "Stop. Hang up. Call back on the number on your card or the official website — never a number someone gives you.",
        },
      },
      {
        heading: "Today's common cons",
        body: "Watch for **Authorised Push Payment (APP)** fraud (you're tricked into sending money yourself), fake delivery and parcel texts, \"your account is compromised\" calls, romance scams, crypto and investment \"too good to be true\" returns, and HMRC refund or threat texts.",
      },
      {
        heading: "Protect yourself",
        body: "Use strong unique passwords, turn on two-factor authentication, and never click links in unexpected messages. Money you're pressured to send *urgently* is the reddest flag of all.",
        callout: {
          type: "tip",
          text: "Genuine opportunities don't expire in ten minutes. Urgency is a manipulation tactic.",
        },
      },
      {
        heading: "If it happens to you",
        body: "Contact your bank immediately (APP fraud is often reimbursable), report to **Action Fraud** (or Police Scotland), and forward scam texts to **7726**. It is not your fault — reporting it helps you and others.",
        govLink: { label: "Action Fraud — report fraud", url: "https://www.actionfraud.police.uk" },
      },
    ],
    quiz: [
      {
        id: "m6q1",
        question: "A caller says your account is at risk and you must move money to a \"safe account\". This is…",
        options: ["Normal bank procedure", "A scam — banks never do this", "Only a scam if they ask for a PIN", "Fine if they know your name"],
        correctIndex: 1,
        explanation: "No legitimate bank ever asks you to move money to a \"safe account\".",
      },
      {
        id: "m6q2",
        question: "Best response to an unexpected \"urgent\" payment request?",
        options: ["Pay quickly before the deadline", "Stop, and verify via an official number you find yourself", "Reply asking for proof", "Forward it to friends"],
        correctIndex: 1,
        explanation: "Urgency is the manipulation; verifying independently defeats it.",
      },
      {
        id: "m6q3",
        question: "Where do you forward a suspicious scam text?",
        options: ["999", "101", "7726", "Your bank's social media"],
        correctIndex: 2,
        explanation: "7726 is the free reporting shortcode for spam and scam texts.",
      },
    ],
    tool: null,
    quest: {
      task: "Turn on two-factor authentication for your main bank or email account.",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt("Scams & Fraud"),
    suggestedQuestions: [
      "Is this text from my bank real?",
      "I think I've been scammed — what do I do?",
      "How do I spot an investment scam?",
    ],
    badge: { id: "scam-spotter", label: "Scam Spotter", description: "Learned to spot the cons and protect your money." },
  },

  {
    id: 22,
    code: "M22",
    tier: 1,
    level: 3,
    slug: "money-is-tight",
    title: "When Money Is Tight",
    icon: "LifeBuoy",
    summary: "A calm, practical plan for when there's more month than money — and where to get free help fast.",
    tldr: "Pay priority debts first (rent, council tax, energy). Breathing Space gives a 60-day freeze on interest and enforcement via a free debt adviser. Check benefits, the Household Support Fund and Turn2Us. Never pay for debt help.",
    estMinutes: 16,
    lesson: [
      {
        heading: "First, breathe — and triage",
        body: "When money's short, pay **priority debts first**: rent or mortgage, council tax, energy, court fines and your TV licence — because the consequences (eviction, bailiffs, disconnection) are the most serious. Credit cards, loans, overdrafts and BNPL are **non-priority** and come after.",
        callout: {
          type: "tip",
          text: "Contact creditors early — most have hardship teams and would rather agree a plan than chase you.",
        },
      },
      {
        heading: "Breathing Space",
        body: "If debts feel unmanageable, the **Debt Respite Scheme** gives a **60-day** freeze on interest, fees and most enforcement while you get help. You apply **through a free FCA-authorised debt adviser**, not directly.",
        callout: {
          type: "warning",
          text: "It's a pause, not a write-off — but it stops things getting worse while you make a plan.",
        },
        govLink: { label: "GOV.UK — options for dealing with debt", url: "https://www.gov.uk/options-for-dealing-with-your-debts" },
      },
      {
        heading: "Get the help you're owed",
        body: "Check what benefits you can get, the **Household Support Fund** and local welfare help via your council, and charity grants (search **Turn2Us**). Foodbanks (via a referral) are there if you need them — there's no shame in using support that exists.",
        govLink: { label: "GOV.UK — check what benefits you can get", url: "https://www.gov.uk/check-benefits-financial-support" },
      },
      {
        heading: "Free, regulated debt advice — never pay",
        body: "**StepChange**, **National Debtline** and **Citizens Advice** are free and confidential. Avoid any firm that charges for debt help or cold-calls promising to \"write off\" your debt.",
        callout: {
          type: "tip",
          text: "Acting early gives you the most options — the worst step is no step.",
        },
      },
    ],
    quiz: [
      {
        id: "m22q1",
        question: "Which should you pay first when money is short?",
        options: ["Credit cards", "Priority debts (rent, council tax, energy)", "Buy Now Pay Later", "The smallest balance"],
        correctIndex: 1,
        explanation: "Their consequences — eviction, bailiffs, disconnection — are the most serious.",
      },
      {
        id: "m22q2",
        question: "Breathing Space gives you…",
        options: ["A debt write-off", "A 60-day freeze on interest and enforcement while you get advice", "Free money from the government", "A new loan"],
        correctIndex: 1,
        explanation: "It's a pause, not a write-off, and you apply for it via a debt adviser.",
      },
      {
        id: "m22q3",
        question: "Where should you get debt advice?",
        options: ["A firm that charges a fee", "Free services like StepChange or Citizens Advice", "A company that cold-called you", "Nowhere — sort it alone"],
        correctIndex: 1,
        explanation: "Never pay for debt help — the best help is free and regulated.",
      },
    ],
    tool: null,
    quest: {
      task: "If money is tight, contact one free debt-advice service or run a benefits check — take one step today.",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt(
      "When Money Is Tight",
      " Be warm and non-judgemental, never alarmist, and signpost heavily to free, regulated help.",
    ),
    suggestedQuestions: [
      "I can't pay all my bills — what do I do first?",
      "What is Breathing Space?",
      "Where can I get free debt help?",
    ],
    badge: { id: "back-on-track", label: "Back on Track", description: "Learned how to triage tight months and find free help." },
  },

  {
    id: 8,
    code: "M8",
    tier: 1,
    level: 3,
    slug: "savings-emergency-fund",
    title: "Savings & Emergency Fund",
    icon: "PiggyBank",
    summary: "Build the buffer that stops a surprise becoming a crisis — and earn the right interest on it.",
    tldr: "Aim for a £1,000 starter buffer, then 3–6 months of essentials, in easy-access savings. Compare on AER, beat inflation, and remember FSCS protects £120,000 per bank. Premium Bonds pay tax-free prizes, not guaranteed interest.",
    estMinutes: 16,
    lesson: [
      {
        heading: "Why the buffer comes first",
        body: "An emergency fund turns a car repair or boiler breakdown from a debt event into a mere annoyance. Aim for a starter **£1,000**, then build toward **3–6 months** of essential outgoings.",
        callout: {
          type: "tip",
          text: "Keep it in a separate, easy-access account so it isn't \"accidentally\" spent.",
        },
      },
      {
        heading: "AER vs gross, and not losing to inflation",
        body: "**AER** (Annual Equivalent Rate) shows the true yearly return including compounding — use it to compare accounts fairly. If your savings rate is below inflation, your money slowly loses buying power, so shop around.",
        govLink: { label: "MoneyHelper — savings basics", url: "https://www.moneyhelper.org.uk/en/savings" },
      },
      {
        heading: "Where to keep it",
        body: "Use easy-access for the emergency fund and a fixed-rate or notice account for money you won't touch for a year or more. Your **Personal Savings Allowance** (£1,000 basic / £500 higher rate) shelters interest from tax outside an ISA.",
        callout: {
          type: "figure",
          text: "Your money is protected up to £120,000 per authorised bank by the FSCS — spread larger balances across separate licences.",
        },
      },
      {
        heading: "Premium Bonds & Help to Save",
        body: "**Premium Bonds** (NS&I) pay no interest but offer tax-free prize draws with 100% government-backed capital — fine for some, though average returns can trail a good savings account. **Help to Save** gives a **50% bonus** to eligible people on Universal Credit.",
        govLink: { label: "GOV.UK — Help to Save", url: "https://www.gov.uk/help-to-save" },
      },
    ],
    quiz: [
      {
        id: "m8q1",
        question: "A sensible emergency fund target is…",
        options: ["One week's pay", "3–6 months of essential outgoings (after a £1,000 starter)", "A full year's salary", "£100"],
        correctIndex: 1,
        explanation: "Enough to absorb a job loss or a big unexpected bill.",
      },
      {
        id: "m8q2",
        question: "AER is useful because…",
        options: ["It hides fees", "It lets you compare accounts on a true yearly basis", "It's always higher than gross", "It guarantees your return"],
        correctIndex: 1,
        explanation: "It accounts for how often interest is paid and compounded.",
      },
      {
        id: "m8q3",
        question: "How much of your cash is FSCS-protected per authorised bank?",
        options: ["£85,000", "£120,000", "Unlimited", "£50,000"],
        correctIndex: 1,
        explanation: "Cash deposits are protected up to £120,000 — spread larger sums across different banking licences.",
      },
      {
        id: "m8q4",
        question: "Premium Bonds pay…",
        options: ["Guaranteed interest", "Tax-free prizes, not guaranteed interest", "A fixed 5% return", "Nothing at all"],
        correctIndex: 1,
        explanation: "Your capital is safe and 100% government-backed, but returns aren't guaranteed.",
      },
    ],
    tool: {
      kind: "isaGrowth",
      title: "Savings projector",
      description: "Enter an amount, monthly top-up and rate to see how your buffer could grow. Rates change, so this isn't a forecast.",
    },
    quest: {
      task: "Open or top up an easy-access savings account and set a standing order — even if it's small.",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt("Savings & Emergency Fund"),
    suggestedQuestions: [
      "How big should my emergency fund be?",
      "What's the difference between AER and gross?",
      "Are Premium Bonds worth it?",
    ],
    badge: { id: "safety-net", label: "Safety Net", description: "Sized your emergency fund and started building it." },
  },
];
