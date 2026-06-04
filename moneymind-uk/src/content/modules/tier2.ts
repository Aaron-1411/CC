import type { CourseModule } from "../../lib/types";
import { tutorPrompt } from "../tutor";

// ============================================================================
// TIER 2 — STABILISE: understand your income, rights and debts.
// Play order: M1 Pay · M3 Rights · M4 Benefits · M7 Debt · M20 Consumer Rights ·
// M21 Student Loans · M5 Insurance. Figures verified for 2026/27.
// ============================================================================

export const tier2Modules: CourseModule[] = [
  {
    id: 1,
    code: "M1",
    tier: 2,
    level: 1,
    slug: "your-pay-explained",
    title: "Your Pay Explained",
    icon: "ReceiptText",
    summary: "Decode your payslip: gross vs net, tax, NI and what your employer pays on top.",
    tldr: "Tax is marginal — a pay rise only taxes the slice above each threshold. Income tax: 0% to £12,570, 20% to £50,270, 40% to £125,140. Employee NI is 8% then 2%. Check your tax code (usually 1257L) — a wrong one can cost you.",
    estMinutes: 18,
    lesson: [
      {
        heading: "Gross vs net",
        body: "Gross is the headline salary; net (\"take-home\") is what lands after Income Tax, National Insurance and pension. *Example:* Sarah earns **£28,000**. After her Personal Allowance she pays 20% tax on £15,430 and 8% NI on the slice above £12,570, leaving take-home of roughly **£23,800/yr** — about **£1,983/month** before pension.",
        callout: {
          type: "figure",
          text: "Income tax is \"marginal\" — a pay rise into the 40% band only taxes the slice above £50,270 at 40%, never your whole salary.",
        },
        govLink: { label: "GOV.UK — Income Tax rates", url: "https://www.gov.uk/income-tax-rates" },
      },
      {
        heading: "How Income Tax is taken (PAYE)",
        body: "Bands for 2026/27: **0%** to £12,570, **20%** to £50,270, **40%** to £125,140, **45%** above. These bands are frozen to 2031, so pay rises quietly cost more in tax over time — that's \"fiscal drag\".",
        govLink: { label: "GOV.UK — Income Tax rates", url: "https://www.gov.uk/income-tax-rates" },
      },
      {
        heading: "National Insurance",
        body: "Employee Class 1 NI is **8%** on earnings between £12,570 and £50,270, then **2%** above. NI buys your State Pension and some benefits; earning above the Lower Earnings Limit (£129/wk) credits your record even when you pay nothing.",
        govLink: { label: "GOV.UK — National Insurance", url: "https://www.gov.uk/national-insurance" },
      },
      {
        heading: "Your tax code",
        body: "**1257L** means £12,570 tax-free spread across the year. Watch for **BR** (everything taxed at basic — common on a second job), **0T**, **K** codes, and \"emergency\" codes after a job change.",
        callout: {
          type: "warning",
          text: "A wrong tax code is common and can cost you hundreds. Check it against your payslip and reclaim overpaid tax via gov.uk.",
        },
        govLink: { label: "GOV.UK — what your tax code means", url: "https://www.gov.uk/tax-codes" },
      },
      {
        heading: "What your employer pays on top",
        body: "Employer NI (**15%** above the £5,000 secondary threshold) and pension contributions are real costs of employing you — useful context when you negotiate a salary or weigh up a salary-sacrifice pension.",
      },
    ],
    quiz: [
      {
        id: "m1q1",
        question: "You get a pay rise from £49,000 to £52,000. How is the extra £3,000 taxed?",
        options: ["All of it at 40%", "Only the part above £50,270 at 40%; the rest at 20%", "All of it at 20%", "It's tax-free"],
        correctIndex: 1,
        explanation: "Tax is marginal; you never pay the higher rate on your whole salary.",
      },
      {
        id: "m1q2",
        question: "What does the \"L\" in 1257L roughly mean?",
        options: ["You owe extra tax", "You get the standard tax-free Personal Allowance", "You're on an emergency code", "You have a second job"],
        correctIndex: 1,
        explanation: "1257 ≈ £12,570 tax-free; L is the standard marker.",
      },
      {
        id: "m1q3",
        question: "Above which amount do most employees pay 2% NI instead of 8%?",
        options: ["£12,570", "£50,270", "£100,000", "£125,140"],
        correctIndex: 1,
        explanation: "£50,270 is the Upper Earnings Limit for 2026/27.",
      },
      {
        id: "m1q4",
        question: "True/false: a BR code on a second job means all of it is taxed at basic rate.",
        options: ["True", "False"],
        correctIndex: 0,
        explanation: "BR assumes your Personal Allowance is already used by your main job.",
      },
    ],
    tool: {
      kind: "payslip",
      title: "Payslip decoder",
      description: "Enter your salary to estimate Income Tax, employee NI, take-home and employer NI. Assumes a standard tax code with no student loan or pension unless you add them.",
    },
    quest: {
      task: "Find your latest payslip and check your tax code matches 1257L (or makes sense for your situation).",
      xp: 75,
      unlocksBadge: "code-cracker",
    },
    tutorSystemPrompt: tutorPrompt("Your Pay Explained"),
    suggestedQuestions: [
      "Why is my take-home less than I expected?",
      "What does my tax code mean?",
      "Will a pay rise push all my money into the 40% band?",
    ],
    badge: { id: "payslip-pro", label: "Payslip Pro", description: "Decoded a payslip and understood tax, NI and tax codes." },
  },

  {
    id: 3,
    code: "M3",
    tier: 2,
    level: 2,
    slug: "rights-at-work",
    title: "Your Rights at Work",
    icon: "Scale",
    summary: "Minimum wage, sick pay, parental pay, holiday and redundancy — what you're legally owed.",
    tldr: "From April 2026: minimum wage £12.71 (21+); SSP £123.25/wk from day one; 5.6 weeks' paid holiday; statutory redundancy after 2 years with a week's pay capped at £751 (max £22,530), first £30,000 tax-free.",
    estMinutes: 20,
    lesson: [
      {
        heading: "The wage floor",
        body: "From April 2026: **£12.71** (21+), **£10.85** (18–20), **£8.00** (16–17 and apprentices). It's illegal to pay less, and deductions can't push you below it.",
        callout: {
          type: "warning",
          text: "\"Self-employed\" status is sometimes used wrongly to dodge the minimum wage and holiday pay — your actual working arrangement decides your rights, not the label.",
        },
        govLink: { label: "GOV.UK — National Minimum Wage rates", url: "https://www.gov.uk/national-minimum-wage-rates" },
      },
      {
        heading: "When you're off sick",
        body: "Statutory Sick Pay is **£123.25/wk** and, from April 2026, is payable from your **first day** off sick — the old three \"waiting days\" are gone, and it now covers all employees regardless of income. Many employers pay more under company sick pay — check your contract.",
        govLink: { label: "GOV.UK — Statutory Sick Pay", url: "https://www.gov.uk/statutory-sick-pay" },
      },
      {
        heading: "Having a baby",
        body: "Statutory Maternity/Adoption Pay is 90% of pay for 6 weeks, then **£194.32/wk** or 90% (whichever is lower) for up to 33 more weeks. Paternity and Shared Parental Pay are **£194.32/wk** or 90% (whichever is lower).",
        govLink: { label: "GOV.UK — Maternity pay and leave", url: "https://www.gov.uk/maternity-pay-leave" },
      },
      {
        heading: "Holiday maths",
        body: "The statutory minimum is **5.6 weeks/year** (28 days for a 5-day week). *Example:* work 3 days a week and you get 3 × 5.6 = **16.8 days**.",
        govLink: { label: "GOV.UK — Holiday entitlement", url: "https://www.gov.uk/holiday-entitlement-rights" },
      },
      {
        heading: "Redundancy",
        body: "After **2 years'** service, statutory redundancy is 0.5 / 1 / 1.5 weeks' pay per full year (by age band under 22 / 22–40 / 41+), capped at 20 years, with a week's pay capped at **£751** (a maximum of **£22,530**). The first **£30,000** is tax-free, and you also have rights to notice and consultation.",
        callout: {
          type: "tip",
          text: "Free, confidential help is available from ACAS and Citizens Advice.",
        },
        govLink: { label: "GOV.UK — Redundancy pay", url: "https://www.gov.uk/redundancy-pay" },
      },
    ],
    quiz: [
      {
        id: "m3q1",
        question: "Legal minimum hourly pay for a 25-year-old from April 2026?",
        options: ["£10.85", "£11.44", "£12.71", "£13.45"],
        correctIndex: 2,
        explanation: "£12.71 is the National Living Wage for those aged 21 and over.",
      },
      {
        id: "m3q2",
        question: "Statutory holiday for a full-time 5-day worker?",
        options: ["20 days", "25 days", "28 days (5.6 weeks)", "30 days"],
        correctIndex: 2,
        explanation: "5.6 weeks, which can include bank holidays.",
      },
      {
        id: "m3q3",
        question: "Statutory redundancy uses which factors?",
        options: ["Just your salary", "Age, length of service and (capped) weekly pay", "Only how long you've worked", "Your job title"],
        correctIndex: 1,
        explanation: "Half/one/one-and-a-half weeks per year by age band, max 20 years, week's pay capped at £751.",
      },
      {
        id: "m3q4",
        question: "True/false: being called \"self-employed\" automatically removes your right to the minimum wage.",
        options: ["True", "False"],
        correctIndex: 1,
        explanation: "Your real working relationship decides your rights, not the label your employer uses.",
      },
    ],
    tool: {
      kind: "holidayRedundancy",
      title: "Holiday & redundancy calculator",
      description: "Enter salary, years of service, age and contract type to estimate your statutory holiday and redundancy. Uses the capped week's pay assumption.",
    },
    quest: {
      task: "Work out your statutory holiday entitlement and check it against your contract.",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt("Your Rights at Work"),
    suggestedQuestions: [
      "How much redundancy am I owed?",
      "What sick pay can I get?",
      "How many holiday days am I entitled to part-time?",
    ],
    badge: { id: "know-your-rights", label: "Know Your Rights", description: "Learned your core legal entitlements at work." },
  },

  {
    id: 4,
    code: "M4",
    tier: 2,
    level: 2,
    slug: "benefits",
    title: "Benefits You're Entitled To",
    icon: "HandHelping",
    summary: "Universal Credit, Child Benefit, Pension Credit and more — what you can claim and how.",
    tldr: "Billions in benefits go unclaimed. UC tapers at 55% so work always pays. Register for Child Benefit even over £60k to protect NI credits. Pension Credit is badly under-claimed and unlocks other help. Use a free calculator.",
    estMinutes: 22,
    lesson: [
      {
        heading: "Benefits aren't charity — they're part of the system you pay into",
        body: "Billions of pounds go unclaimed each year. Checking what you might get takes minutes and is free.",
        callout: {
          type: "tip",
          text: "Use a free benefits calculator (Turn2Us or entitledto) — it's anonymous and impartial.",
        },
        govLink: { label: "GOV.UK — check what benefits you can get", url: "https://www.gov.uk/check-benefits-financial-support" },
      },
      {
        heading: "Universal Credit",
        body: "A monthly payment for people on a low income or out of work. Your maximum is a standard allowance (single 25+ is **£424.90/mo**) plus elements for children, housing, childcare or disability. Earnings above a work allowance reduce UC by **55p per £1** — the \"taper\".",
        callout: {
          type: "figure",
          text: "The 55% taper means work always leaves you better off overall — the myth that earning more \"isn't worth it\" is wrong.",
        },
        govLink: { label: "GOV.UK — Universal Credit", url: "https://www.gov.uk/universal-credit" },
      },
      {
        heading: "Child Benefit & the HICBC trap",
        body: "**£27.05/wk** for the first child, **£17.90** for each more. If you or your partner earns over **£60,000**, some is clawed back (gone at **£80,000**), assessed on the *individual*, not the household. Always register even if you opt out of payment.",
        callout: {
          type: "warning",
          text: "Missing a year of NI credits can cost roughly £329/year of State Pension for life. Register the claim even if you opt out of the money.",
        },
        govLink: { label: "GOV.UK — Child Benefit", url: "https://www.gov.uk/child-benefit" },
      },
      {
        heading: "Pensioners & carers",
        body: "**Pension Credit** tops up low pensioner income and unlocks other help (Council Tax, sometimes a free TV licence) — it's badly under-claimed. **Carer's Allowance** is **£86.45/wk** if you care 35+ hours a week and earn under £204/wk.",
        govLink: { label: "GOV.UK — Pension Credit", url: "https://www.gov.uk/pension-credit" },
      },
      {
        heading: "Local & in-kind help",
        body: "**Council Tax Reduction**, **Free School Meals**, **Healthy Start** vouchers and the benefit cap all vary by council — check locally as well as nationally.",
        govLink: { label: "GOV.UK — Council Tax Reduction", url: "https://www.gov.uk/apply-council-tax-reduction" },
      },
    ],
    quiz: [
      {
        id: "m4q1",
        question: "Above what income does the High Income Child Benefit Charge start (2026/27)?",
        options: ["£50,000", "£60,000", "£80,000", "£100,000"],
        correctIndex: 1,
        explanation: "It starts at £60,000 and is fully withdrawn at £80,000, assessed on the individual.",
      },
      {
        id: "m4q2",
        question: "Why register for Child Benefit even if you'll opt out of payments?",
        options: ["To get a tax rebate", "To protect NI credits and get your child an NI number", "It's a legal requirement", "To increase your salary"],
        correctIndex: 1,
        explanation: "Those NI credits protect your State Pension.",
      },
      {
        id: "m4q3",
        question: "The UC taper means…",
        options: ["UC stops as soon as you work", "UC reduces by 55p for each £1 earned above the work allowance", "You lose 100% of extra earnings", "Earnings don't affect UC"],
        correctIndex: 1,
        explanation: "You keep 45p of every extra pound — work pays.",
      },
      {
        id: "m4q4",
        question: "Which is widely under-claimed by pensioners?",
        options: ["State Pension", "Pension Credit", "Winter Fuel Payment", "Bus pass"],
        correctIndex: 1,
        explanation: "Pension Credit is badly under-claimed and is a gateway to other support too.",
      },
    ],
    tool: {
      kind: "benefitsChecker",
      title: "Benefits signpost",
      description: "Answer a few questions about your household to see benefits worth exploring, each with an official link. A signpost, not a decision — always check the official calculator.",
    },
    quest: {
      task: "Run a free benefits calculator (Turn2Us or entitledto) to see what you might be missing.",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt("Benefits You're Entitled To"),
    suggestedQuestions: [
      "Could I be eligible for Universal Credit?",
      "Should I still claim Child Benefit if I earn over £60k?",
      "What is Pension Credit and who gets it?",
    ],
    badge: { id: "entitlement-expert", label: "Entitlement Expert", description: "Learned what you can claim and checked your eligibility." },
  },

  {
    id: 7,
    code: "M7",
    tier: 2,
    level: 3,
    slug: "debt-and-credit",
    title: "Debt & Credit",
    icon: "CreditCard",
    summary: "How credit really works, how to beat expensive debt, and where to get free help.",
    tldr: "Each agency scores you differently; pay on time and keep utilisation low. APR compounds against you, and minimum payments keep you in debt longest. Avalanche (highest APR) is cheapest; snowball (smallest balance) motivates. Free regulated help only.",
    estMinutes: 22,
    lesson: [
      {
        heading: "What a credit score actually is",
        body: "There's no single official number — each agency (Experian, Equifax, TransUnion) scores you differently. What moves it: paying on time, low credit utilisation, length of history, and being on the electoral roll.",
        callout: {
          type: "tip",
          text: "Checking your own report is a \"soft\" search and never harms your score — do it free and regularly.",
        },
        govLink: { label: "GOV.UK — your credit report rights", url: "https://www.gov.uk/credit-score" },
      },
      {
        heading: "Good debt vs bad debt",
        body: "Debt that buys an appreciating asset or boosts your earnings (a sensible mortgage, sometimes a student loan) differs from high-interest debt on depreciating things (payday loans, credit-card balances you can't clear). The cost is the interest rate, not the borrowing itself.",
      },
      {
        heading: "APR and compound interest working against you",
        body: "APR is the yearly cost including fees. *Example:* a **£2,000** balance at 24.9% APR paying only the minimum can take many years and cost well over **£1,000** in interest, while the same £2,000 cleared in 12 months costs a fraction of that. Interest charged on interest is compounding in reverse.",
        callout: {
          type: "warning",
          text: "Minimum payments are designed to keep you in debt longest. Pay more than the minimum wherever you can.",
        },
      },
      {
        heading: "Two payoff strategies",
        body: "**Avalanche:** attack the highest-APR debt first (cheapest mathematically). **Snowball:** clear the smallest balance first (best for motivation). Both work — pick the one you'll actually stick to.",
        callout: {
          type: "figure",
          text: "A 0% balance-transfer card can pause interest while you clear the balance — but only if you clear it before the deal ends and avoid new spending.",
        },
      },
      {
        heading: "When debt feels unmanageable",
        body: "Free, confidential, regulated help exists: **StepChange**, **National Debtline** and **Citizens Advice**. Options include a Debt Management Plan, an IVA, a Debt Relief Order or bankruptcy — each has serious long-term consequences, so get free advice first.",
        callout: {
          type: "warning",
          text: "Never pay a company that charges for debt help. Avoid firms that cold-call promising to \"write off\" debt.",
        },
        govLink: { label: "GOV.UK — options for dealing with debt", url: "https://www.gov.uk/options-for-dealing-with-your-debts" },
      },
    ],
    quiz: [
      {
        id: "m7q1",
        question: "Which most improves a credit score over time?",
        options: ["Checking it often", "Paying bills on time and keeping balances low", "Having lots of cards", "Earning a high salary"],
        correctIndex: 1,
        explanation: "Payment history and low utilisation are the biggest factors.",
      },
      {
        id: "m7q2",
        question: "Does checking your own credit report lower your score?",
        options: ["Yes, a lot", "No", "Only once a year", "Only if you're refused credit"],
        correctIndex: 1,
        explanation: "It's a soft search, invisible to lenders.",
      },
      {
        id: "m7q3",
        question: "The \"avalanche\" method targets…",
        options: ["The smallest balance first", "The highest-interest debt first", "The newest debt first", "Whatever has the biggest minimum"],
        correctIndex: 1,
        explanation: "It minimises the total interest you pay.",
      },
      {
        id: "m7q4",
        question: "Best first step if debt feels unmanageable?",
        options: ["Take out another loan", "Get free advice from StepChange/Citizens Advice", "Pay a firm to write it off", "Ignore it"],
        correctIndex: 1,
        explanation: "Free regulated help beats paid firms every time.",
      },
      {
        id: "m7q5",
        question: "True/false: paying only the minimum clears a card fastest.",
        options: ["True", "False"],
        correctIndex: 1,
        explanation: "Minimums are set to keep you paying interest for years.",
      },
    ],
    tool: {
      kind: "debtStrategy",
      title: "Debt payoff planner",
      description: "Enter each debt (balance, APR, minimum) to compare snowball vs avalanche — payoff order, total interest and time. An estimate that ignores future spending.",
    },
    quest: {
      task: "Get your credit report free from one agency and check there are no mistakes or accounts you don't recognise.",
      xp: 75,
      unlocksBadge: "credit-aware",
    },
    tutorSystemPrompt: tutorPrompt("Debt & Credit"),
    suggestedQuestions: [
      "Snowball or avalanche — which is better for me?",
      "Will a 0% balance transfer card help?",
      "I'm struggling with repayments — what should I do first?",
    ],
    badge: { id: "debt-slayer", label: "Debt Slayer", description: "Learned how credit works and built a debt payoff plan." },
  },

  {
    id: 20,
    code: "M20",
    tier: 2,
    level: 2,
    slug: "consumer-rights",
    title: "Consumer Rights & Protection",
    icon: "ShieldCheck",
    summary: "Know your refund rights, when the bank must back you, and how to get your money back.",
    tldr: "Consumer Rights Act: 30-day right to reject faulty goods. Section 75 makes your card firm jointly liable on credit-card buys £100–£30,000. BNPL has no Section 75. If refused, escalate free to the Financial Ombudsman.",
    estMinutes: 15,
    lesson: [
      {
        heading: "The Consumer Rights Act 2015",
        body: "Goods must be of satisfactory quality, fit for purpose and as described. If not, you have a **30-day right to reject** for a full refund; after that, the seller gets one chance to repair or replace. Services must be done with reasonable care.",
        callout: {
          type: "tip",
          text: "You claim from the retailer who sold it to you — not the manufacturer.",
        },
        govLink: { label: "GOV.UK — consumer rights", url: "https://www.gov.uk/consumer-protection-rights" },
      },
      {
        heading: "Section 75 — your credit card has your back",
        body: "Pay by **credit card** for something over **£100 and up to £30,000** and the card provider is **jointly liable** with the seller if things go wrong — even on a deposit, even abroad, even if the firm collapses.",
        callout: {
          type: "figure",
          text: "Paying just the deposit on a £2,000 sofa by credit card protects the whole £2,000.",
        },
        govLink: { label: "MoneyHelper — Section 75", url: "https://www.moneyhelper.org.uk/en/everyday-money/buying-and-running-a-car/section-75-of-the-consumer-credit-act" },
      },
      {
        heading: "Chargeback — for debit cards and small buys",
        body: "A card-scheme process (not a law) covering debit cards or purchases under £100, usually within around 120 days. It's weaker than Section 75, but still useful.",
      },
      {
        heading: "BNPL — convenient, but protect yourself",
        body: "Buy Now Pay Later is interest-free if you pay on time, but missed payments bring fees and can hit your credit file, it's easy to over-commit across several apps, and it carries **no Section 75 protection**.",
        callout: {
          type: "warning",
          text: "Spreading one purchase across several BNPL plans can quietly become unaffordable — track what you owe.",
        },
      },
      {
        heading: "If they won't play ball",
        body: "Complain in writing; the firm has 8 weeks; then escalate **free** to the **Financial Ombudsman Service**, which often upholds claims that banks first refuse.",
        govLink: { label: "Financial Ombudsman Service", url: "https://www.financial-ombudsman.org.uk" },
      },
    ],
    quiz: [
      {
        id: "m20q1",
        question: "Under the Consumer Rights Act, your right to reject faulty goods for a full refund lasts…",
        options: ["14 days", "30 days", "6 months", "1 year"],
        correctIndex: 1,
        explanation: "After 30 days, the seller can repair or replace first.",
      },
      {
        id: "m20q2",
        question: "Section 75 applies to credit-card purchases…",
        options: ["Under £100", "Over £100 and up to £30,000", "Of any size", "Only abroad"],
        correctIndex: 1,
        explanation: "The card firm is jointly liable with the seller.",
      },
      {
        id: "m20q3",
        question: "Does BNPL carry Section 75 protection?",
        options: ["Yes", "No", "Only over £100", "Only for big retailers"],
        correctIndex: 1,
        explanation: "It's weaker than paying by credit card.",
      },
      {
        id: "m20q4",
        question: "If a firm rejects your claim after 8 weeks, you can…",
        options: ["Do nothing", "Escalate free to the Financial Ombudsman", "Only go to court", "Pay a claims firm"],
        correctIndex: 1,
        explanation: "The Ombudsman is independent and free to use.",
      },
    ],
    tool: null,
    quest: {
      task: "Next time you make a big purchase (£100+), pay at least the deposit by credit card to get Section 75 cover.",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt("Consumer Rights & Protection"),
    suggestedQuestions: [
      "My new appliance broke — what are my rights?",
      "When does Section 75 protect me?",
      "Is Buy Now Pay Later safe?",
    ],
    badge: { id: "rights-defender", label: "Rights Defender", description: "Learned your refund rights and how to get your money back." },
  },

  {
    id: 21,
    code: "M21",
    tier: 2,
    level: 2,
    slug: "student-loans",
    title: "Student Loans",
    icon: "GraduationCap",
    summary: "Why your student loan works more like a graduate tax than a normal debt.",
    tldr: "You repay 9% of income above your plan's threshold (6% postgrad), it's not on your credit file, and it's written off (Plan 5 after 40 years, Plan 2 after 30). Overpaying usually only helps high earners who'll clear it.",
    estMinutes: 16,
    lesson: [
      {
        heading: "It's not a normal debt",
        body: "You repay **9% of income above your plan's threshold** (6% for postgraduate), taken automatically through payroll. If your income drops, repayments drop; if you stop earning, they stop. It doesn't appear on your credit file.",
        callout: {
          type: "tip",
          text: "Think of it as a time-limited \"graduate contribution\", not a loan that follows you like a credit card.",
        },
      },
      {
        heading: "Which plan are you on?",
        body: "2026/27 thresholds: Plan 1 **£26,900**, Plan 2 **£29,385**, Plan 4 (Scotland) **£33,795**, Plan 5 **£25,000**, Postgraduate **£21,000**. Your payslip shows your plan. *Example:* Plan 2 earning £35,000 → 9% of (£35,000 − £29,385) ≈ **£505/year** (about £42/month).",
        govLink: { label: "GOV.UK — repaying your student loan", url: "https://www.gov.uk/repaying-your-student-loan" },
      },
      {
        heading: "Interest vs repayment",
        body: "Interest (linked to RPI) changes how fast the balance grows but **not** your monthly payment. For many people the balance is irrelevant, because it's written off before they ever clear it.",
        callout: {
          type: "figure",
          text: "Plan 5 loans are written off after 40 years; Plan 2 after 30. Most Plan 2/5 borrowers never repay in full.",
        },
      },
      {
        heading: "Should you overpay?",
        body: "Usually **no** — overpaying only helps if you're a high earner certain to clear the loan before write-off. For most people, voluntary overpayments are money given away.",
        callout: {
          type: "warning",
          text: "This is education, not advice — model your own situation before overpaying.",
        },
      },
    ],
    quiz: [
      {
        id: "m21q1",
        question: "Student loan repayments are…",
        options: ["A fixed monthly amount", "9% of income above a threshold (6% postgrad)", "20% of your salary", "Interest-only"],
        correctIndex: 1,
        explanation: "They're income-contingent, not a fixed monthly debt.",
      },
      {
        id: "m21q2",
        question: "Does your student loan appear on your credit file?",
        options: ["Yes", "No", "Only Plan 2", "Only if you default"],
        correctIndex: 1,
        explanation: "It doesn't, though lenders may consider the repayment in affordability checks.",
      },
      {
        id: "m21q3",
        question: "Overpaying your student loan usually makes sense only if…",
        options: ["You're on a low income", "You're a high earner who'll clear it before write-off", "You're on Plan 1", "Never"],
        correctIndex: 1,
        explanation: "Otherwise it's written off and you've overpaid for nothing.",
      },
      {
        id: "m21q4",
        question: "Plan 5 loans are written off after…",
        options: ["25 years", "30 years", "40 years", "Never"],
        correctIndex: 2,
        explanation: "Plan 2 is written off after 30 years; most borrowers never fully repay.",
      },
    ],
    tool: null,
    quest: {
      task: "Check which plan you're on (your payslip or SLC account) and work out your monthly repayment.",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt("Student Loans"),
    suggestedQuestions: [
      "Which student loan plan am I on?",
      "Should I overpay my student loan?",
      "When is my loan written off?",
    ],
    badge: { id: "loan-literate", label: "Loan Literate", description: "Understood how your student loan really works." },
  },

  {
    id: 5,
    code: "M5",
    tier: 2,
    level: 2,
    slug: "insurance-protection",
    title: "Insurance & Protection",
    icon: "Shield",
    summary: "Which insurance is worth it, which isn't, and what protects your income if things go wrong.",
    tldr: "Insure what you couldn't afford to lose; self-insure small annoyances. SSP alone (£123.25/wk) is far below most outgoings — income protection and life cover fill the gap. Building and car insurance are usually required.",
    estMinutes: 16,
    lesson: [
      {
        heading: "Insurance = transferring a risk you can't afford to carry",
        body: "It's worth it for catastrophic, unlikely events, and usually not worth it for small, affordable ones (extended warranties, gadget cover).",
        callout: {
          type: "tip",
          text: "A rule of thumb: insure what would be a financial disaster, self-insure what would only be an annoyance.",
        },
      },
      {
        heading: "Protecting your income",
        body: "If you couldn't work, what would you live on? Statutory Sick Pay is **£123.25/wk** — far below most people's outgoings. Income protection and critical-illness cover fill that gap, and many people already have some through work, so check first.",
      },
      {
        heading: "Life cover",
        body: "It matters most when someone depends on your income — children, a partner, a mortgage. It's often cheaper than people expect when you're young and healthy.",
        callout: {
          type: "warning",
          text: "Whole-of-life and \"investment-linked\" policies are often costly and over-sold — understand exactly what you're buying.",
        },
      },
      {
        heading: "Required vs optional",
        body: "Buildings insurance is usually a mortgage condition and car insurance is a legal minimum. Beyond that, prioritise income and life cover over gadget and warranty add-ons. This module educates only — for tailored cover, speak to a regulated adviser or broker.",
        govLink: { label: "MoneyHelper — insurance", url: "https://www.moneyhelper.org.uk/en/everyday-money/insurance" },
      },
    ],
    quiz: [
      {
        id: "m5q1",
        question: "Insurance is usually worth buying for…",
        options: ["Small, affordable repairs", "Rare events you couldn't afford to pay for yourself", "Everything you own", "Things under £50"],
        correctIndex: 1,
        explanation: "That's the whole point of transferring a risk you can't carry.",
      },
      {
        id: "m5q2",
        question: "If you couldn't work, statutory SSP alone is…",
        options: ["About the same as your salary", "About £123/week — usually far below outgoings", "Tax-free and generous", "Paid for life"],
        correctIndex: 1,
        explanation: "Which is exactly why income protection exists.",
      },
      {
        id: "m5q3",
        question: "Life cover matters most when…",
        options: ["You're single with no dependants", "Someone depends on your income", "You're retired", "You rent"],
        correctIndex: 1,
        explanation: "No dependants generally means less need for life cover.",
      },
    ],
    tool: null,
    quest: {
      task: "Check whether your employer already gives you death-in-service or income protection (ask HR or your benefits portal).",
      xp: 75,
    },
    tutorSystemPrompt: tutorPrompt("Insurance & Protection"),
    suggestedQuestions: [
      "Do I really need life insurance?",
      "What's income protection?",
      "Are extended warranties worth it?",
    ],
    badge: { id: "well-protected", label: "Well Protected", description: "Understood which cover is worth it and found your protection gaps." },
  },
];
