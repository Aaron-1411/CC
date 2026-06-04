import type { CourseModule } from "../../lib/types";
import { tutorPrompt } from "../tutor";

// ============================================================================
// TIER 3 — GROW: make your money work. Tax-free wrappers, sensible investing,
// the big housing decision, and locking in your retirement "free money".
// Play order: M9 ISAs · M10 Investing Fundamentals · M11 Renting & Buying ·
// M12 State Pension & Retirement. All figures verified for 2026/27.
// ============================================================================

export const tier3Modules: CourseModule[] = [
  {
    id: 9,
    code: "M9",
    tier: 3,
    level: 4,
    slug: "isas-explained",
    title: "ISAs Explained",
    icon: "Landmark",
    summary:
      "The UK's most powerful tax-free wrapper — which ISA, how much, and how to use the free money.",
    tldr: "An ISA is a tax-free wrapper, not an investment. £20,000 a year across all types, resetting each April. A Lifetime ISA adds a 25% bonus but punishes early withdrawals.",
    estMinutes: 18,
    lesson: [
      {
        heading: "What an ISA actually is",
        body: "An ISA isn't an investment itself — it's a *wrapper*. Anything held inside is free from Income Tax, Capital Gains Tax and Dividend Tax, and you never have to declare it. You can pay in up to **£20,000** across all your ISAs each tax year.",
        callout: {
          type: "figure",
          text: "The allowance is \"use it or lose it\" — it resets every 6 April and can't be carried forward.",
        },
        govLink: {
          label: "gov.uk — Individual Savings Accounts",
          url: "https://www.gov.uk/individual-savings-accounts",
        },
      },
      {
        heading: "The four main types",
        body: "**Cash ISA** (savings, safe); **Stocks & Shares ISA** (investments, for the long term); **Lifetime ISA** (first home or retirement, with a bonus); **Junior ISA** (£9,000/yr for under-18s). You can split your one £20,000 allowance across types in the same tax year.",
        callout: {
          type: "warning",
          text: "From April 2027 the cash-ISA portion is set to fall to £12,000/yr for under-65s — something to plan around.",
        },
      },
      {
        heading: "The Lifetime ISA bonus (free money, with strings)",
        body: "Open at 18–39, pay in up to **£4,000/yr**, and the government adds **25%** — up to **£1,000/yr free**. Use it for a first home up to £450,000, or from age 60.",
        callout: {
          type: "warning",
          text: "Take money out for any other reason and a 25% withdrawal charge applies — which can leave you with less than you put in. Only use a LISA for its intended purpose.",
        },
        govLink: { label: "gov.uk — Lifetime ISA", url: "https://www.gov.uk/lifetime-isa" },
      },
      {
        heading: "Making the most of it",
        body: "A common move is \"Bed & ISA\": moving existing investments into an ISA wrapper to shelter future gains (mind any CGT on the sale). Spouses can also inherit an ISA allowance. This is education, not advice — for your situation, speak to a regulated adviser.",
      },
    ],
    quiz: [
      {
        id: "m9q1",
        question: "The 2026/27 total ISA allowance is…",
        options: ["£10,000", "£15,000", "£20,000", "£25,000"],
        correctIndex: 2,
        explanation: "£20,000 across all ISA types combined, resetting each April.",
      },
      {
        id: "m9q2",
        question: "The LISA government bonus is…",
        options: [
          "10%, up to £400 a year",
          "25%, up to £1,000 a year",
          "50%, up to £2,000 a year",
          "5%, up to £200 a year",
        ],
        correctIndex: 1,
        explanation: "25% on contributions up to £4,000 a year — up to £1,000 free.",
      },
      {
        id: "m9q3",
        question: "Take LISA money out early (not for a first home or age 60+) and…",
        options: [
          "nothing happens",
          "you lose just the bonus",
          "a 25% withdrawal charge applies",
          "you pay income tax on it",
        ],
        correctIndex: 2,
        explanation: "The 25% charge can leave you with less than you paid in.",
      },
      {
        id: "m9q4",
        question: "True or false: gains inside a Stocks & Shares ISA are free from Capital Gains Tax.",
        options: ["True", "False"],
        correctIndex: 0,
        explanation: "Everything inside the ISA wrapper is tax-free.",
      },
    ],
    tool: {
      kind: "isaGrowth",
      title: "ISA growth projector",
      description:
        "Amount, ISA type and years (plus the LISA bonus when relevant) → projected tax-free growth, with the assumption stated.",
    },
    quest: {
      task: "Check how much of your £20,000 ISA allowance you've used so far this tax year.",
      xp: 75,
      moneyFound: 100,
      unlocksBadge: "isa-insider",
    },
    tutorSystemPrompt: tutorPrompt("ISAs Explained"),
    suggestedQuestions: [
      "Cash ISA or Stocks & Shares ISA?",
      "Is a Lifetime ISA worth it for a first home?",
      "What happens to my allowance if I don't use it?",
    ],
    badge: {
      id: "isa-insider",
      label: "ISA Insider",
      description: "Learned the ISA types and how to use the allowance.",
    },
  },

  {
    id: 10,
    code: "M10",
    tier: 3,
    level: 4,
    slug: "investing-fundamentals",
    title: "Investing Fundamentals",
    icon: "TrendingUp",
    summary: "The principles that matter — risk, diversification, fees and time — without the hype.",
    tldr: "Risk and reward go together. Diversify, keep fees low, and give it time. Index funds beat most active funds after fees. This is education, never advice — investments can fall as well as rise.",
    estMinutes: 20,
    lesson: [
      {
        heading: "Risk and reward go together",
        body: "Higher potential returns come with higher ups and downs. Cash is stable but loses to inflation over time; shares are volatile but have historically grown over long periods. Your time horizon matters more than almost anything.",
        callout: {
          type: "warning",
          text: "If you might need the money within ~5 years, investing is usually not the place for it.",
        },
      },
      {
        heading: "Diversification — don't bet on one horse",
        body: "Spreading money across many companies, sectors and countries reduces the damage any single failure can do. A global index fund holds thousands of companies at once.",
        callout: {
          type: "tip",
          text: "\"Don't put all your eggs in one basket\" is the whole of risk management in one sentence.",
        },
      },
      {
        heading: "Fees and time are the quiet giants",
        body: "A 1.5% annual fee vs 0.2% sounds tiny but compounds into a huge difference over decades. Look for the **Ongoing Charges Figure (OCF)**. And \"time in the market\" generally beats \"timing the market\" — regular investing (pound-cost averaging) avoids trying to guess the top and bottom.",
        callout: {
          type: "figure",
          text: "Timing the market means being right twice — when to sell and when to buy back. Most people, including professionals, get this wrong.",
        },
      },
      {
        heading: "Index funds vs picking stocks",
        body: "A low-cost index fund simply tracks a whole market; most actively managed funds fail to beat their index after fees over the long run. Stock-picking is higher-risk and time-intensive.",
        callout: {
          type: "warning",
          text: "\"Guaranteed high returns\" and pressure to act fast are hallmarks of scams (see the Scams module).",
        },
      },
      {
        heading: "What's protected",
        body: "Investments held with an FSCS-authorised firm are protected up to £85,000 if the *firm* fails — but this never protects you from the market falling. Use the Stocks & Shares ISA wrapper to keep gains tax-free.",
        govLink: {
          label: "MoneyHelper — investing basics",
          url: "https://www.moneyhelper.org.uk/en/savings/investing",
        },
      },
    ],
    quiz: [
      {
        id: "m10q1",
        question: "Diversification means…",
        options: [
          "putting everything in one strong company",
          "spreading money across many investments",
          "buying and selling often",
          "only investing in your own country",
        ],
        correctIndex: 1,
        explanation: "It reduces the impact of any single failure.",
      },
      {
        id: "m10q2",
        question: "Over the long term, fund fees…",
        options: [
          "barely matter",
          "compound and can significantly reduce your final pot",
          "only matter for large pots",
          "are always refunded",
        ],
        correctIndex: 1,
        explanation: "Small percentages add up over decades.",
      },
      {
        id: "m10q3",
        question: "\"Time in the market beats timing the market\" means…",
        options: [
          "trade as often as possible",
          "wait for a crash before investing",
          "staying invested usually beats trying to guess the highs and lows",
          "only invest for under a year",
        ],
        correctIndex: 2,
        explanation: "Consistent investing avoids costly mis-timing.",
      },
      {
        id: "m10q4",
        question: "Does FSCS protection cover investment losses if the market falls?",
        options: ["Yes, always", "No — only if the firm fails", "Only for ISAs", "Only over £85,000"],
        correctIndex: 1,
        explanation: "Market risk is never covered — FSCS covers firm failure only.",
      },
      {
        id: "m10q5",
        question: "A promise of \"guaranteed high returns\" is…",
        options: [
          "a normal investment feature",
          "a sign of a good fund",
          "a major red flag for a scam",
          "only possible with shares",
        ],
        correctIndex: 2,
        explanation: "Real investing never guarantees high returns.",
      },
    ],
    tool: {
      kind: "isaGrowth",
      title: "Investment growth projector",
      description:
        "Lump sum, monthly amount and years at a stated ~5% assumption → a projected range, with a prominent \"not a forecast / value can fall\" disclaimer.",
    },
    quest: {
      task: "Find the Ongoing Charges Figure (OCF) on any fund or pension you already hold.",
      xp: 75,
      unlocksBadge: "steady-investor",
    },
    tutorSystemPrompt: tutorPrompt(
      "Investing Fundamentals",
      " This module is education only: always stress that investments can fall as well as rise, that past performance is not a guide, and never recommend specific products or tell the user what to buy.",
    ),
    suggestedQuestions: [
      "What's an index fund?",
      "How much do fees really matter?",
      "Should I invest or keep saving in cash?",
    ],
    badge: {
      id: "steady-investor",
      label: "Steady Investor",
      description: "Learned the principles of sensible long-term investing.",
    },
  },

  {
    id: 11,
    code: "M11",
    tier: 3,
    level: 5,
    slug: "renting-and-buying",
    title: "Renting & Buying",
    icon: "Home",
    summary: "Your rights as a tenant, how mortgages work, and the real cost of buying.",
    tldr: "Your deposit must be protected within 30 days. Section 21 no-fault evictions ended in May 2026. First-time buyers pay no stamp duty up to £300,000. Buying has big upfront costs beyond the deposit.",
    estMinutes: 24,
    lesson: [
      {
        heading: "Renting — your rights got stronger",
        body: "Your deposit must be in a government-approved protection scheme within **30 days**. From **1 May 2026** the Renters' Rights Act ended **Section 21 \"no-fault\" evictions** and turned fixed-term tenancies into open-ended periodic ones — a landlord now needs a specific legal ground to seek possession. There are also new limits on rent increases and a ban on rental bidding.",
        callout: {
          type: "tip",
          text: "Check your deposit is protected — you can search the scheme directly, and there are penalties if a landlord hasn't done it.",
        },
        govLink: {
          label: "gov.uk — Deposit protection schemes",
          url: "https://www.gov.uk/deposit-protection-schemes",
        },
      },
      {
        heading: "How a mortgage works",
        body: "You borrow a multiple of your income, secured on the property. **Loan-to-Value (LTV)** is the loan as a percentage of the price; a bigger deposit means a lower LTV and usually a better rate. Lenders \"stress-test\" whether you could still pay if rates rose.",
        callout: {
          type: "figure",
          text: "The deposit isn't the only upfront cost — budget for stamp duty, surveys, legal fees and moving.",
        },
      },
      {
        heading: "Stamp Duty (England & NI)",
        body: "Standard buyers pay nothing up to £125,000, then 2% to £250,000, 5% to £925,000, and more above. **First-time buyers pay nothing up to £300,000** (and 5% on £300k–£500k), with no relief over £500,000. Wales and Scotland have their own versions.",
        govLink: {
          label: "gov.uk — Stamp Duty Land Tax",
          url: "https://www.gov.uk/stamp-duty-land-tax",
        },
      },
      {
        heading: "Help to buy your first home",
        body: "Lifetime ISA (25% bonus, see ISAs Explained), Shared Ownership (buy a share, rent the rest), and First Homes (a discount for local first-time buyers) can lower the barrier. Each has eligibility rules.",
        callout: {
          type: "warning",
          text: "Shared Ownership still involves rent, service charges and repair obligations — read the lease carefully.",
        },
      },
      {
        heading: "Rent vs buy isn't only about money",
        body: "Buying builds equity but ties up cash and reduces flexibility; renting is flexible but builds no equity. The \"right\" answer depends on how long you'll stay, local prices and your circumstances. Education only — speak to a mortgage broker/adviser for your situation.",
      },
    ],
    quiz: [
      {
        id: "m11q1",
        question: "Within how long must a deposit be protected in a scheme?",
        options: ["7 days", "14 days", "30 days", "90 days"],
        correctIndex: 2,
        explanation: "Landlords face penalties if they miss the 30-day deadline.",
      },
      {
        id: "m11q2",
        question: "From May 2026, Section 21 \"no-fault\" evictions are…",
        options: ["unchanged", "abolished", "made faster", "only for new tenancies"],
        correctIndex: 1,
        explanation: "Landlords must now use specific legal grounds to seek possession.",
      },
      {
        id: "m11q3",
        question: "A first-time buyer pays no stamp duty up to…",
        options: ["£125,000", "£250,000", "£300,000", "£500,000"],
        correctIndex: 2,
        explanation: "Then 5% on the slice to £500,000; no relief above that.",
      },
      {
        id: "m11q4",
        question: "A lower loan-to-value (LTV) usually means…",
        options: [
          "a worse mortgage rate",
          "a better mortgage rate",
          "no need for a deposit",
          "a longer mortgage term",
        ],
        correctIndex: 1,
        explanation: "A bigger deposit is less risk to the lender, so often a better rate.",
      },
    ],
    tool: {
      kind: "rentVsBuy",
      title: "Rent vs buy comparison",
      description:
        "Rent vs price, deposit and rate → a 10-year cost comparison including stamp duty and buying costs, with assumptions clearly stated.",
    },
    quest: {
      task: "If you rent, check your deposit is registered in a government-backed protection scheme.",
      xp: 75,
      unlocksBadge: "home-ready",
    },
    tutorSystemPrompt: tutorPrompt("Renting & Buying"),
    suggestedQuestions: [
      "How much stamp duty would I pay?",
      "What are my rights if my landlord wants me out?",
      "Is Shared Ownership a good idea?",
    ],
    badge: {
      id: "home-ready",
      label: "Home Ready",
      description: "Learned tenant rights, mortgages and the cost of buying.",
    },
  },

  {
    id: 12,
    code: "M12",
    tier: 3,
    level: 5,
    slug: "state-pension-retirement",
    title: "State Pension & Retirement",
    icon: "Umbrella",
    summary: "The State Pension, your workplace pension, and the \"free money\" most people leave behind.",
    tldr: "The full new State Pension is £241.30/week and needs 35 NI years. Your workplace pension's employer match is free money — taking it is often a guaranteed 100% return. Check your forecast at gov.uk.",
    estMinutes: 22,
    lesson: [
      {
        heading: "The State Pension",
        body: "The full new State Pension is **£241.30/week (£12,547.60/yr)** for 2026/27. You need **35 qualifying years** of National Insurance for the full amount, and at least 10 to get anything. State Pension age is 66, **rising to 67** between May 2026 and 2028.",
        callout: {
          type: "tip",
          text: "Check your forecast and NI record free at gov.uk/check-state-pension — it's the single most useful 5 minutes in this whole course.",
        },
        govLink: {
          label: "gov.uk — Check your State Pension forecast",
          url: "https://www.gov.uk/check-state-pension",
        },
      },
      {
        heading: "Filling gaps in your record",
        body: "Years caring for children (via Child Benefit), illness or time abroad can leave gaps. You can sometimes pay **voluntary Class 3 contributions** (£18.40/week) to fill them — often excellent value, but check it'll actually increase your pension first.",
        callout: {
          type: "figure",
          text: "One missing year can cost roughly £329/year of State Pension for life — so a small top-up can pay back many times over.",
        },
      },
      {
        heading: "Your workplace pension — don't leave free money",
        body: "If you're 22+ and earn over £10,000, you're auto-enrolled. The minimum is **8% of qualifying earnings**, with your **employer paying at least 3%**. Many employers will *match* extra contributions you make.",
        callout: {
          type: "warning",
          text: "If your employer matches more when you pay more, not doing so is turning down a guaranteed pay rise — often an instant 100% return before any growth.",
        },
      },
      {
        heading: "Tax relief and salary sacrifice",
        body: "Pension contributions get tax relief at your marginal rate (a basic-rate taxpayer's £80 becomes £100 in the pot). **Salary sacrifice**, if offered, also saves your 8% employee NI.",
        callout: {
          type: "warning",
          text: "The Autumn 2025 Budget announced a future cap on the NI saving from salary-sacrifice pension contributions — check the current rules before relying on it.",
        },
        govLink: {
          label: "MoneyHelper — pensions and tax relief",
          url: "https://www.moneyhelper.org.uk/en/pensions-and-retirement/tax-and-pensions",
        },
      },
      {
        heading: "SIPPs and taking control",
        body: "A Self-Invested Personal Pension lets you choose your own investments and consolidate old pots — more flexibility, more responsibility. The annual allowance for tax-relieved contributions is £60,000 (or 100% of earnings if lower). Education only — for your retirement plan, see a regulated adviser.",
        govLink: {
          label: "gov.uk — Personal pensions",
          url: "https://www.gov.uk/personal-pensions-your-rights",
        },
      },
    ],
    quiz: [
      {
        id: "m12q1",
        question: "How many NI qualifying years for the full new State Pension?",
        options: ["10", "25", "35", "45"],
        correctIndex: 2,
        explanation: "35 years, with a minimum of 10 to receive anything at all.",
      },
      {
        id: "m12q2",
        question: "Minimum your employer must pay into your auto-enrolment pension?",
        options: [
          "1% of qualifying earnings",
          "3% of qualifying earnings",
          "5% of qualifying earnings",
          "8% of qualifying earnings",
        ],
        correctIndex: 1,
        explanation: "3% of qualifying earnings, out of the 8% total minimum.",
      },
      {
        id: "m12q3",
        question: "Why is the employer match described as \"free money\"?",
        options: [
          "the government pays it",
          "they add money only if you contribute",
          "it's tax-free forever",
          "it never has to be repaid",
        ],
        correctIndex: 1,
        explanation: "Not contributing enough to get the full match leaves guaranteed money behind.",
      },
      {
        id: "m12q4",
        question: "For a basic-rate taxpayer, £80 contributed becomes…",
        options: [
          "£80 in the pension",
          "£90 in the pension",
          "£100 in the pension (with tax relief)",
          "£120 in the pension",
        ],
        correctIndex: 2,
        explanation: "Tax relief tops the £80 up to the £100 gross amount.",
      },
      {
        id: "m12q5",
        question: "Where can you check your State Pension forecast?",
        options: [
          "your bank app",
          "gov.uk/check-state-pension",
          "your payslip",
          "the Money Saving Expert forum",
        ],
        correctIndex: 1,
        explanation: "It reads your real NI record and shows your forecast.",
      },
    ],
    tool: {
      kind: "pensionProjector",
      title: "Pension projector",
      description:
        "Age, current pot, monthly contribution and retirement age → projected pot assuming ~5% growth (stated), with a \"not a forecast\" note.",
    },
    quest: {
      task: "Check your State Pension forecast at gov.uk/check-state-pension.",
      xp: 75,
      moneyFound: 329,
      unlocksBadge: "pension-detective",
    },
    tutorSystemPrompt: tutorPrompt("State Pension & Retirement"),
    suggestedQuestions: [
      "How do I check my State Pension forecast?",
      "Should I pay more into my workplace pension?",
      "What is salary sacrifice and does it help me?",
    ],
    badge: {
      id: "future-proofed",
      label: "Future Proofed",
      description: "Understood the State Pension and workplace pension and checked your forecast.",
    },
  },
];
