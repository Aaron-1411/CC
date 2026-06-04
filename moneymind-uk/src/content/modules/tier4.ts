import type { CourseModule } from "../../lib/types";
import { tutorPrompt } from "../tutor";

// ============================================================================
// TIER 4 — OPTIMISE & SPECIALISE (optional capstone): keep more of what you
// earn, legally. Self-assessment & missed reliefs, the wrapper hierarchy,
// the hidden cliff-edges, capital/legacy allowances, and wills & LPAs.
// Play order: M13 Hidden Tax · M15 Tax-Efficiency Playbook ·
// M16 Thresholds & Couples · M17 Capital & Legacy · M14 Wills & Estate.
// All figures verified for 2026/27.
// ============================================================================

export const tier4Modules: CourseModule[] = [
  {
    id: 13,
    code: "M13",
    tier: 4,
    level: 6,
    slug: "hidden-tax",
    title: "Tax You Might Not Know About",
    icon: "FileText",
    summary:
      "Self-assessment, the allowances people miss, and the legal ways to keep more of your money.",
    tldr: "Know if you must file (deadline 31 January). Use the £1,000 trading and property allowances. Claim Marriage Allowance (£252/yr, backdatable), Gift Aid and R40 — legal wins people leave unclaimed.",
    estMinutes: 22,
    lesson: [
      {
        heading: "Do you need to file a tax return?",
        body: "Most employees don't, but you may need to if you're self-employed, have untaxed income, are a higher earner with savings/dividends, or have to pay the High Income Child Benefit Charge. The online deadline is **31 January**, and penalties for missing it start at £100.",
        callout: {
          type: "warning",
          text: "Register early — you can't file at the last minute if you've never registered for Self Assessment.",
        },
        govLink: {
          label: "gov.uk — Check if you need to send a tax return",
          url: "https://www.gov.uk/check-if-you-need-tax-return",
        },
      },
      {
        heading: "The £1,000 allowances",
        body: "You can earn up to **£1,000 of trading income** (side hustles, selling online) and up to **£1,000 of property income** tax-free each year, without even reporting it.",
        callout: {
          type: "tip",
          text: "A small side income under £1,000 generally doesn't need declaring — but keep records in case.",
        },
        govLink: {
          label: "gov.uk — Tax-free allowances on property and trading income",
          url: "https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income",
        },
      },
      {
        heading: "Capital Gains Tax",
        body: "On profits from selling assets (shares outside an ISA, a second property, valuables) above the **£3,000** annual exemption. Rates are 18% (within the basic band) and 24% (above). Using your ISA and the annual exemption each year keeps gains efficient.",
        govLink: { label: "gov.uk — Capital Gains Tax", url: "https://www.gov.uk/capital-gains-tax" },
      },
      {
        heading: "Inheritance Tax basics",
        body: "No tax on the first **£325,000** of an estate, plus up to **£175,000** more if a home passes to direct descendants (so up to £500,000, or £1m for a couple). 40% above that. From 2027/28, unused pensions start counting toward the estate.",
        callout: {
          type: "figure",
          text: "Most estates pay no IHT at all — but the thresholds are frozen until 2030, so more families will be drawn in over time.",
        },
        govLink: { label: "gov.uk — Inheritance Tax", url: "https://www.gov.uk/inheritance-tax" },
      },
      {
        heading: "Easy wins people miss",
        body: "**Marriage Allowance** (a non-taxpayer transfers £1,260 of allowance to a basic-rate spouse — worth £252/yr, backdatable up to 4 years); **Gift Aid** (charities reclaim 25%, higher-rate donors claim more back); **R40** (non-taxpayers can reclaim tax wrongly deducted from savings interest).",
        callout: {
          type: "tip",
          text: "These are legal, official and often unclaimed — exactly the \"Money Found\" wins this app celebrates.",
        },
        govLink: { label: "gov.uk — Marriage Allowance", url: "https://www.gov.uk/marriage-allowance" },
      },
    ],
    quiz: [
      {
        id: "m13q1",
        question: "The online Self Assessment deadline is…",
        options: ["5 April", "31 October", "31 December", "31 January"],
        correctIndex: 3,
        explanation: "Late filing starts at a £100 penalty.",
      },
      {
        id: "m13q2",
        question: "How much side/trading income is tax-free per year?",
        options: ["£500", "£1,000", "£2,500", "£5,000"],
        correctIndex: 1,
        explanation: "The trading allowance; a separate £1,000 applies to property.",
      },
      {
        id: "m13q3",
        question: "Marriage Allowance is worth up to…",
        options: [
          "£100 a year",
          "£252 a year (and can be backdated)",
          "£1,260 a year",
          "£500 a year",
        ],
        correctIndex: 1,
        explanation: "A non-taxpayer transfers £1,260 of allowance to a basic-rate spouse.",
      },
      {
        id: "m13q4",
        question: "The CGT annual exemption for 2026/27 is…",
        options: ["£1,000", "£3,000", "£6,000", "£12,300"],
        correctIndex: 1,
        explanation: "Gains above it are taxed at 18%/24%.",
      },
      {
        id: "m13q5",
        question: "True or false: most estates pay Inheritance Tax.",
        options: ["True", "False"],
        correctIndex: 1,
        explanation: "The £325k (+£175k) thresholds mean most estates pay none.",
      },
    ],
    tool: {
      kind: "selfAssessmentChecker",
      title: "Do I need to file?",
      description:
        "Six yes/no questions → whether you likely must register for Self Assessment, and why.",
    },
    quest: {
      task: "Check whether you or your partner could claim Marriage Allowance (one a non-taxpayer, the other basic-rate).",
      xp: 75,
      moneyFound: 252,
      unlocksBadge: "tax-savvy",
    },
    tutorSystemPrompt: tutorPrompt("Tax You Might Not Know About"),
    suggestedQuestions: [
      "Do I need to file a tax return?",
      "Can I claim Marriage Allowance?",
      "How does the £1,000 trading allowance work?",
    ],
    badge: {
      id: "tax-savvy",
      label: "Tax Savvy",
      description: "Learned the allowances and reliefs most people miss.",
    },
  },

  {
    id: 15,
    code: "M15",
    tier: 4,
    level: 7,
    slug: "tax-efficiency-playbook",
    title: "The Tax-Efficiency Playbook",
    icon: "Target",
    summary: "Where your next pound should go — and how to claim every bit of relief you're owed.",
    tldr: "There are no loopholes, only allowances. Send your next £100 down the wrapper hierarchy (employer match → high-APR debt → buffer → LISA → pension → ISA). Higher-rate taxpayers must claim the extra pension relief themselves.",
    estMinutes: 22,
    lesson: [
      {
        heading: "There are no loopholes — only allowances",
        body: "ISAs, pension relief, the CGT exemption and gift allowances exist *by design* to encourage saving, investing and giving. Using them fully is expected, not sneaky. What gets you into trouble is contrived \"schemes\" — and those get unwound (see Capital, Legacy & The Honest Limits). The genuine edge is orchestration.",
        callout: {
          type: "tip",
          text: "You don't need to be clever or wealthy to be tax-efficient — you need to use the ordinary allowances in the right order.",
        },
      },
      {
        heading: "The wrapper hierarchy — where should your next £100 go?",
        body: "A sensible default order: (1) **employer pension match** (free money), (2) clear **high-APR debt**, (3) **emergency fund**, (4) **LISA** if saving for a first home (25% bonus), (5) **pension** for higher-rate relief or to escape a cliff-edge, (6) **ISA**, (7) a general investment account.",
        callout: {
          type: "figure",
          text: "The employer match and clearing a 24% APR card beat almost any investment return — guaranteed, and tax-free.",
        },
      },
      {
        heading: "Claim the relief you're actually owed",
        body: "Many personal/SIPP pensions only add basic-rate (20%) relief at source automatically. **Higher- and additional-rate taxpayers must claim the extra 20%/25%** via Self Assessment or by contacting HMRC — and huge numbers never do.",
        callout: {
          type: "warning",
          text: "A 40% taxpayer paying into a personal pension and not claiming the extra relief is leaving real money with HMRC every year — and you can usually backdate claims.",
        },
        govLink: {
          label: "gov.uk — Tax on private pension contributions",
          url: "https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief",
        },
      },
      {
        heading: "Carry forward and tax-free cash",
        body: "You can use **unused pension annual allowance from the previous 3 years** (after this year's), and normally take **25% of a pension tax-free**, capped by the £268,275 Lump Sum Allowance. Useful after a bonus or a good self-employed year.",
      },
      {
        heading: "The use-it-or-lose-it rhythm",
        body: "Most allowances reset every 6 April and can't be carried (ISA £20,000, CGT £3,000, the £3,000 IHT gift — bar a one-year carry, Marriage Allowance, LISA top-up).",
        callout: {
          type: "tip",
          text: "Diary a \"March money review\" — the end-of-tax-year allowance sweep is built for exactly this.",
        },
      },
    ],
    quiz: [
      {
        id: "m15q1",
        question: "Where should a typical person's next £100 usually go first?",
        options: [
          "a Stocks & Shares ISA",
          "into the pension up to the employer match",
          "premium bonds",
          "a general investment account",
        ],
        correctIndex: 1,
        explanation: "It's free money — an instant guaranteed return.",
      },
      {
        id: "m15q2",
        question: "A higher-rate taxpayer in a relief-at-source personal pension should…",
        options: [
          "do nothing, it's automatic",
          "claim the extra 20% relief from HMRC",
          "wait until retirement",
          "stop contributing",
        ],
        correctIndex: 1,
        explanation: "Only basic-rate relief is added automatically — the rest you must claim.",
      },
      {
        id: "m15q3",
        question: "Carry forward lets you use unused pension allowance from…",
        options: [
          "the previous tax year only",
          "the previous 3 tax years",
          "any year ever",
          "the next 3 years",
        ],
        correctIndex: 1,
        explanation: "After using the current year's allowance first.",
      },
      {
        id: "m15q4",
        question: "Most ISA, CGT and gift allowances at year-end are…",
        options: ["carried forward", "use it or lose it", "doubled next year", "refundable"],
        correctIndex: 1,
        explanation: "They don't roll over, with limited exceptions.",
      },
      {
        id: "m15q5",
        question: "True or false: cutting tax is mostly about clever loopholes.",
        options: ["True", "False"],
        correctIndex: 1,
        explanation: "It's about using ordinary allowances in the right order and at the right time.",
      },
    ],
    tool: {
      kind: "pensionProjector",
      title: "Pension relief booster",
      description:
        "See how tax relief and the employer match boost a pension contribution. (The Tax-Year Allowance Sweep is delivered as a seasonal challenge.)",
    },
    quest: {
      task: "If you're a higher-rate taxpayer paying into a personal pension or SIPP, check whether you've claimed the extra tax relief — and backdate it if not.",
      xp: 75,
      moneyFound: 200,
      unlocksBadge: "optimiser",
    },
    tutorSystemPrompt: tutorPrompt("The Tax-Efficiency Playbook"),
    suggestedQuestions: [
      "Where should my next £100 go?",
      "How do I claim higher-rate pension tax relief?",
      "What can I still use before 5 April?",
    ],
    badge: {
      id: "optimiser",
      label: "The Optimiser",
      description: "Learned the wrapper hierarchy and how to claim every relief you are owed.",
    },
  },

  {
    id: 16,
    code: "M16",
    tier: 4,
    level: 7,
    slug: "thresholds-and-couples",
    title: "Threshold Management & Couples",
    icon: "Users",
    summary: "Beat the hidden tax cliff-edges — and use both partners' allowances as a team.",
    tldr: "Watch the 60% trap (£100k–£125,140), the HICBC (£60k–£80k) and the £100k childcare cliff. A pension contribution lowers adjusted net income to dodge them. Couples get two of every allowance.",
    estMinutes: 22,
    lesson: [
      {
        heading: "Your real marginal rate isn't what you think",
        body: "Hidden cliff-edges: the **£100,000–£125,140** band carries an effective **~60%** rate as the Personal Allowance is withdrawn; the **HICBC** bites between **£60,000 and £80,000** if you get Child Benefit; crossing **£100,000** removes Tax-Free Childcare and free childcare hours entirely; a student loan adds 9% on top.",
        callout: {
          type: "figure",
          text: "Just over £100,000 with young children, losing childcare support, the effective rate on a slice of income can exceed 100% — a genuine \"earn more, keep less\" trap.",
        },
      },
      {
        heading: "Pensions are the lever",
        body: "A pension contribution reduces your **adjusted net income**, which can restore the Personal Allowance, remove the HICBC, and keep free childcare.",
        callout: {
          type: "tip",
          text: "For someone at £110,000 with young children, redirecting the excess over £100k into a pension can be close to free once you count tax relief, the restored allowance and retained childcare.",
        },
        govLink: {
          label: "gov.uk — Adjusted net income",
          url: "https://www.gov.uk/guidance/adjusted-net-income",
        },
      },
      {
        heading: "Two people, double everything",
        body: "Between spouses and civil partners there's **no CGT or IHT on transfers**, so a couple can use **two ISA allowances (£40,000)**, **two CGT exemptions (£6,000)**, two dividend and savings allowances, **two basic-rate bands** (hold savings/investments in the lower earner's name), and two sets of nil-rate bands.",
        callout: {
          type: "warning",
          text: "The transfer must be a genuine, outright gift — not just a paper arrangement.",
        },
      },
      {
        heading: "Inheriting, and low-income wins",
        body: "A surviving spouse gets an **inherited-ISA allowance** (the Additional Permitted Subscription, equal to the deceased's ISA) on top of their own. And the **starting rate for savings** (up to £5,000 at 0% for those with low other income), stacked with the £1,000 Personal Savings Allowance, lets a low earner or early retiree receive substantial interest tax-free.",
      },
    ],
    quiz: [
      {
        id: "m16q1",
        question: "The effective tax rate between £100,000 and £125,140 is about…",
        options: ["20%", "40%", "60%", "45%"],
        correctIndex: 2,
        explanation: "The Personal Allowance is withdrawn £1 for every £2 over £100,000.",
      },
      {
        id: "m16q2",
        question: "Earning just over £100,000 with young children can be especially costly because…",
        options: [
          "you pay the additional rate",
          "you lose Tax-Free Childcare and free hours (a cliff-edge)",
          "your pension stops",
          "you lose your ISA allowance",
        ],
        correctIndex: 1,
        explanation: "The childcare support disappears entirely above £100k.",
      },
      {
        id: "m16q3",
        question: "A legitimate way to drop your adjusted net income below a threshold is…",
        options: [
          "being paid in cash",
          "making a pension contribution",
          "delaying your payslip",
          "moving abroad for a week",
        ],
        correctIndex: 1,
        explanation: "It reduces the income these thresholds are tested against.",
      },
      {
        id: "m16q4",
        question: "Transfers between spouses/civil partners are…",
        options: [
          "taxed at 40%",
          "free of CGT and IHT",
          "limited to £3,000",
          "only allowed once",
        ],
        correctIndex: 1,
        explanation: "Which lets a couple use both sets of allowances.",
      },
      {
        id: "m16q5",
        question: "How much can a couple shelter in ISAs each year?",
        options: ["£20,000", "£30,000", "£40,000 (£20,000 each)", "£60,000"],
        correctIndex: 2,
        explanation: "Allowances are per person.",
      },
    ],
    tool: {
      kind: "payslip",
      title: "Marginal-rate explorer",
      description:
        "See take-home and the effect of a pension contribution around the £100k / £60k thresholds.",
    },
    quest: {
      task: "Work out your \"adjusted net income\" for the year and check whether you're near a cliff-edge (£60,000 or £100,000).",
      xp: 75,
      unlocksBadge: "cliff-climber",
    },
    tutorSystemPrompt: tutorPrompt("Threshold Management & Couples"),
    suggestedQuestions: [
      "What's the 60% tax trap?",
      "I'm near £100k with kids — what are my options?",
      "How can my partner and I share our allowances?",
    ],
    badge: {
      id: "cliff-climber",
      label: "Cliff Climber",
      description:
        "Learned to manage the hidden tax thresholds and use a couple's combined allowances.",
    },
  },

  {
    id: 17,
    code: "M17",
    tier: 4,
    level: 7,
    slug: "capital-legacy-limits",
    title: "Capital, Legacy & The Honest Limits",
    icon: "ShieldCheck",
    summary:
      "Use your capital-gains and inheritance allowances well — and know exactly where the legal line is.",
    tldr: "Harvest your £3,000 CGT exemption each year (Bed & ISA). Use the IHT gifting toolkit and 7-year rule. Venture schemes are high-risk despite the relief. Aggressive avoidance gets unwound — sensible reliefs don't.",
    estMinutes: 20,
    lesson: [
      {
        heading: "Capital Gains — use it every year",
        body: "The **£3,000** exemption doesn't carry forward, so realising gains up to it each year (\"harvesting\") is tax-free. **Bed & ISA** (sell, then rebuy inside an ISA) and **Bed & Spouse** shelter future gains; offset losses; and spread a big disposal across two tax years.",
        callout: {
          type: "tip",
          text: "Selling on 5 April and again on 6 April straddles two tax years and uses two years' exemptions.",
        },
        govLink: { label: "gov.uk — Capital Gains Tax", url: "https://www.gov.uk/capital-gains-tax" },
      },
      {
        heading: "Passing it on, lawfully",
        body: "The gifting toolkit is immediately exempt: **£3,000/yr** annual exemption, **£250** small gifts, **wedding gifts**, and **gifts out of surplus income**. Bigger gifts rely on the **7-year rule** (with taper relief). Leaving **10%+ to charity** cuts the IHT rate from 40% to 36%.",
        callout: {
          type: "figure",
          text: "A couple each gifting £3,000 a year removes £6,000/yr from their estate — around £2,400/yr of potential IHT — quietly and immediately.",
        },
        govLink: { label: "gov.uk — Inheritance Tax", url: "https://www.gov.uk/inheritance-tax" },
      },
      {
        heading: "Rent a Room and the small wins",
        body: "**£7,500/yr tax-free** from a lodger in your main home; the **£1,000** trading and property allowances (see Hidden Tax); and everyday employee claims (mileage at HMRC's approved rates, working-from-home costs, professional subscriptions).",
      },
      {
        heading: "Venture schemes — eyes open",
        body: "**EIS (30%)**, **SEIS (50%)** and **VCT (20% from April 2026)** give generous upfront income-tax relief — but they invest in small, often illiquid, high-risk companies. They make sense only *after* ISA and pension allowances are full, and with regulated advice.",
        callout: {
          type: "warning",
          text: "The tax relief exists to compensate for a real risk of losing everything. Never let the tax tail wag the investment dog.",
        },
      },
      {
        heading: "The honest line — planning vs avoidance",
        body: "Using allowances Parliament created is fine and expected. Schemes that contrive an artificial result get unwound by HMRC's **General Anti-Abuse Rule**, may have to be disclosed under **DOTAS**, and often end in penalties and interest.",
        callout: {
          type: "warning",
          text: "Evasion is illegal; aggressive \"avoidance schemes\" are dangerous; sensible use of reliefs is neither. If a tax scheme sounds too good to be true or is sold with urgency, treat it exactly like a scam.",
        },
      },
    ],
    quiz: [
      {
        id: "m17q1",
        question: "The £3,000 CGT exemption…",
        options: [
          "carries forward indefinitely",
          "must be used each year — it can't be carried forward",
          "only applies to property",
          "is shared with your ISA allowance",
        ],
        correctIndex: 1,
        explanation: "So harvesting gains annually is tax-efficient.",
      },
      {
        id: "m17q2",
        question: "\"Bed & ISA\" means…",
        options: [
          "borrowing against your ISA",
          "selling an asset and rebuying it inside an ISA",
          "withdrawing from an ISA overnight",
          "a type of mortgage",
        ],
        correctIndex: 1,
        explanation: "It shelters future gains and income from tax.",
      },
      {
        id: "m17q3",
        question: "Leaving 10%+ of your estate to charity…",
        options: [
          "has no tax effect",
          "cuts the IHT rate on the rest from 40% to 36%",
          "removes all IHT",
          "increases the IHT rate",
        ],
        correctIndex: 1,
        explanation: "A deliberate incentive for charitable legacies.",
      },
      {
        id: "m17q4",
        question: "EIS/SEIS/VCT income-tax relief exists to…",
        options: [
          "guarantee a return",
          "compensate for the high risk of investing in small companies",
          "replace your ISA allowance",
          "avoid all tax legally",
        ],
        correctIndex: 1,
        explanation: "High relief signals high risk, not a free lunch.",
      },
      {
        id: "m17q5",
        question: "A \"tax scheme\" promising a too-good-to-be-true result is…",
        options: [
          "always legal",
          "a red flag — HMRC can unwind aggressive avoidance",
          "the same as an ISA",
          "guaranteed by gov.uk",
        ],
        correctIndex: 1,
        explanation: "The same instinct as spotting a scam applies.",
      },
    ],
    tool: null,
    quest: {
      task: "Use one allowance you're entitled to — e.g. make a £3,000 annual IHT gift, or realise a gain within your £3,000 CGT exemption — if it's relevant to you.",
      xp: 75,
      moneyFound: 300,
      unlocksBadge: "tax-strategist",
    },
    tutorSystemPrompt: tutorPrompt(
      "Capital, Legacy & The Honest Limits",
      " Most decisions here need a regulated adviser or solicitor — educate and signpost only, and never recommend a specific scheme, product or avoidance arrangement.",
    ),
    suggestedQuestions: [
      "What's Bed & ISA?",
      "How much can I gift each year tax-free?",
      "Are EIS or VCT schemes worth the risk?",
    ],
    badge: {
      id: "tax-strategist",
      label: "Tax Strategist",
      description: "Learned to use capital and legacy allowances well — and where the legal line is.",
    },
  },

  {
    id: 14,
    code: "M14",
    tier: 4,
    level: 6,
    slug: "wills-and-estate",
    title: "Wills & Estate Basics",
    icon: "Scroll",
    summary: "Make sure your wishes are followed and the people you love are looked after.",
    tldr: "Without a will, the intestacy rules decide — and unmarried partners can get nothing. An LPA covers decisions while you're alive but unable; a will covers after death. Most people benefit from both.",
    estMinutes: 14,
    lesson: [
      {
        heading: "Why a will matters",
        body: "A will says who gets what, who looks after children, and who sorts out your affairs. Without one, the **intestacy rules** decide — which may not match your wishes, and unmarried partners can be left with nothing.",
        callout: {
          type: "warning",
          text: "Living together doesn't create \"common-law\" inheritance rights — unmarried partners are not automatically provided for.",
        },
        govLink: { label: "gov.uk — Make a will", url: "https://www.gov.uk/make-will" },
      },
      {
        heading: "Keeping it valid",
        body: "A will must be signed and properly witnessed; marriage or divorce can revoke or affect it. Review it after big life events (children, property, relationships). Free or low-cost will-writing schemes exist at certain times of year (e.g. charity will months).",
      },
      {
        heading: "Lasting Power of Attorney (LPA)",
        body: "An LPA lets someone you trust make decisions if you lose capacity — one for property & finances, one for health & welfare. Setting it up while well avoids costly court applications later.",
        callout: {
          type: "tip",
          text: "An LPA is for while you're alive but unable to decide — a will is for after death. Most people benefit from both.",
        },
        govLink: { label: "gov.uk — Power of attorney", url: "https://www.gov.uk/power-of-attorney" },
      },
      {
        heading: "The pensions-in-IHT change",
        body: "From **2027/28**, unused pension pots start counting toward your estate for Inheritance Tax — a meaningful change for estate planning that's worth watching. As ever, this module educates only; for a plan, use a solicitor or regulated adviser.",
        govLink: { label: "gov.uk — Inheritance Tax", url: "https://www.gov.uk/inheritance-tax" },
      },
    ],
    quiz: [
      {
        id: "m14q1",
        question: "Without a will, who decides where your estate goes?",
        options: ["your bank", "the intestacy rules", "the government keeps it", "your employer"],
        correctIndex: 1,
        explanation: "They may not reflect your wishes.",
      },
      {
        id: "m14q2",
        question: "Do unmarried partners automatically inherit?",
        options: ["Yes", "No", "Only after 2 years", "Only if they have children"],
        correctIndex: 1,
        explanation: "There's no \"common-law\" inheritance right.",
      },
      {
        id: "m14q3",
        question: "A Lasting Power of Attorney is used…",
        options: [
          "after death",
          "while you're alive but unable to make decisions",
          "only for business owners",
          "to avoid Inheritance Tax",
        ],
        correctIndex: 1,
        explanation: "A will deals with after death; an LPA with incapacity while alive.",
      },
    ],
    tool: null,
    quest: {
      task: "Note whether you have a valid, up-to-date will and an LPA — and diarise sorting them if not.",
      xp: 75,
      unlocksBadge: "affairs-in-order",
    },
    tutorSystemPrompt: tutorPrompt("Wills & Estate Basics"),
    suggestedQuestions: [
      "What happens if I die without a will?",
      "What's the difference between a will and power of attorney?",
      "How does the pension change from 2027 affect inheritance tax?",
    ],
    badge: {
      id: "affairs-in-order",
      label: "Affairs in Order",
      description: "Learned why a will and LPA matter and what intestacy means.",
    },
  },
];
