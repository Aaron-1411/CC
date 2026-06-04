import type { RightItem } from "../lib/types";

// Quick-reference citizen entitlements. Each links to the official source so a
// reader can act on it. Summaries are plain-English and deliberately avoid
// quoting exact rates (those live in modules + constants, kept current there).
export const rights: RightItem[] = [
  // ── Work ──────────────────────────────────────────────────────────────────
  {
    title: "National Minimum & Living Wage",
    oneLineSummary:
      "There's a legal minimum hourly rate for your age — your employer can't pay below it.",
    category: "Work",
    govLink: { label: "Minimum wage rates — GOV.UK", url: "https://www.gov.uk/national-minimum-wage-rates" },
  },
  {
    title: "5.6 weeks' paid holiday",
    oneLineSummary:
      "Almost all workers get at least 5.6 weeks of paid annual leave (28 days for a 5-day week).",
    category: "Work",
    govLink: { label: "Holiday entitlement — GOV.UK", url: "https://www.gov.uk/holiday-entitlement-rights" },
  },
  {
    title: "Statutory Sick Pay",
    oneLineSummary: "If you're too ill to work and earn enough, your employer must pay SSP.",
    category: "Work",
    govLink: { label: "Statutory Sick Pay — GOV.UK", url: "https://www.gov.uk/statutory-sick-pay" },
  },
  {
    title: "Maternity leave & pay",
    oneLineSummary: "Up to 52 weeks' maternity leave, with Statutory Maternity Pay for eligible employees.",
    category: "Family",
    govLink: { label: "Maternity pay and leave — GOV.UK", url: "https://www.gov.uk/maternity-pay-leave" },
  },
  {
    title: "Paternity leave & pay",
    oneLineSummary: "Eligible fathers and partners can take paid time off when a child is born or adopted.",
    category: "Family",
    govLink: { label: "Paternity pay and leave — GOV.UK", url: "https://www.gov.uk/paternity-pay-leave" },
  },
  {
    title: "Shared Parental Leave",
    oneLineSummary: "Parents can share up to 50 weeks of leave and 37 weeks of pay in the first year.",
    category: "Family",
    govLink: { label: "Shared Parental Leave — GOV.UK", url: "https://www.gov.uk/shared-parental-leave-and-pay" },
  },
  {
    title: "Redundancy pay",
    oneLineSummary: "With 2+ years' service you're owed statutory redundancy pay based on age, pay and length of service.",
    category: "Work",
    govLink: { label: "Redundancy: your rights — GOV.UK", url: "https://www.gov.uk/redundancy-your-rights" },
  },
  {
    title: "An itemised payslip",
    oneLineSummary: "You're entitled to a payslip showing gross pay, deductions and net pay.",
    category: "Work",
    govLink: { label: "Payslips — GOV.UK", url: "https://www.gov.uk/payslips" },
  },
  {
    title: "Rest breaks at work",
    oneLineSummary: "Most workers get a 20-minute break in a 6-hour+ shift, daily and weekly rest periods.",
    category: "Work",
    govLink: { label: "Rest breaks — GOV.UK", url: "https://www.gov.uk/rest-breaks-work" },
  },
  {
    title: "Protection from unfair dismissal",
    oneLineSummary: "You usually can't be sacked without a fair reason and a fair process.",
    category: "Work",
    govLink: { label: "Dismissal: your rights — GOV.UK", url: "https://www.gov.uk/dismissal" },
  },
  {
    title: "Request flexible working",
    oneLineSummary: "Employees can ask to change hours, times or place of work from day one.",
    category: "Work",
    govLink: { label: "Flexible working — GOV.UK", url: "https://www.gov.uk/flexible-working" },
  },
  {
    title: "A workplace pension",
    oneLineSummary: "If you're eligible, your employer must auto-enrol you and contribute to your pension.",
    category: "Pensions",
    govLink: { label: "Workplace pensions — GOV.UK", url: "https://www.gov.uk/workplace-pensions" },
  },

  // ── Benefits ───────────────────────────────────────────────────────────────
  {
    title: "Universal Credit",
    oneLineSummary: "Monthly payment to help with living costs if you're on a low income or out of work.",
    category: "Benefits",
    govLink: { label: "Universal Credit — GOV.UK", url: "https://www.gov.uk/universal-credit" },
  },
  {
    title: "Child Benefit",
    oneLineSummary: "Money for each child you're responsible for — claim even if a high-income charge applies.",
    category: "Family",
    govLink: { label: "Child Benefit — GOV.UK", url: "https://www.gov.uk/child-benefit" },
  },
  {
    title: "Pension Credit",
    oneLineSummary: "Tops up income for people over State Pension age — and unlocks other help.",
    category: "Benefits",
    govLink: { label: "Pension Credit — GOV.UK", url: "https://www.gov.uk/pension-credit" },
  },
  {
    title: "Carer's Allowance",
    oneLineSummary: "A payment if you care for someone at least 35 hours a week and meet the rules.",
    category: "Benefits",
    govLink: { label: "Carer's Allowance — GOV.UK", url: "https://www.gov.uk/carers-allowance" },
  },
  {
    title: "Council Tax Reduction",
    oneLineSummary: "Your council can cut your Council Tax bill if you're on a low income or get benefits.",
    category: "Benefits",
    govLink: { label: "Apply for Council Tax Reduction — GOV.UK", url: "https://www.gov.uk/apply-council-tax-reduction" },
  },
  {
    title: "Personal Independence Payment (PIP)",
    oneLineSummary: "Help with extra costs if a long-term condition affects daily living or getting around.",
    category: "Benefits",
    govLink: { label: "PIP — GOV.UK", url: "https://www.gov.uk/pip" },
  },
  {
    title: "Attendance Allowance",
    oneLineSummary: "Extra money for people over State Pension age who need help with personal care.",
    category: "Benefits",
    govLink: { label: "Attendance Allowance — GOV.UK", url: "https://www.gov.uk/attendance-allowance" },
  },
  {
    title: "Free school meals",
    oneLineSummary: "Children in families on qualifying benefits can get free school meals.",
    category: "Family",
    govLink: { label: "Apply for free school meals — GOV.UK", url: "https://www.gov.uk/apply-free-school-meals" },
  },
  {
    title: "Healthy Start",
    oneLineSummary: "If you're pregnant or have a young child on certain benefits, get help to buy food and milk.",
    category: "Family",
    govLink: { label: "Healthy Start — NHS", url: "https://www.healthystart.nhs.uk/" },
  },
  {
    title: "Winter Fuel Payment",
    oneLineSummary: "Help with heating costs for eligible people over State Pension age.",
    category: "Benefits",
    govLink: { label: "Winter Fuel Payment — GOV.UK", url: "https://www.gov.uk/winter-fuel-payment" },
  },
  {
    title: "New Style Jobseeker's Allowance",
    oneLineSummary: "Contribution-based support if you're out of work and have paid enough National Insurance.",
    category: "Benefits",
    govLink: { label: "Jobseeker's Allowance — GOV.UK", url: "https://www.gov.uk/jobseekers-allowance" },
  },

  // ── Family / childcare ──────────────────────────────────────────────────────
  {
    title: "Tax-Free Childcare",
    oneLineSummary: "The government adds up to £2 for every £8 you pay towards approved childcare.",
    category: "Family",
    govLink: { label: "Tax-Free Childcare — GOV.UK", url: "https://www.gov.uk/tax-free-childcare" },
  },
  {
    title: "Funded childcare hours",
    oneLineSummary: "Working parents of young children can get government-funded childcare hours.",
    category: "Family",
    govLink: { label: "Free childcare if working — GOV.UK", url: "https://www.gov.uk/get-childcare" },
  },

  // ── Housing ──────────────────────────────────────────────────────────────────
  {
    title: "Deposit protection",
    oneLineSummary: "Your landlord must protect your tenancy deposit in a government-backed scheme.",
    category: "Housing",
    govLink: { label: "Tenancy deposit protection — GOV.UK", url: "https://www.gov.uk/tenancy-deposit-protection" },
  },
  {
    title: "Protection from unfair eviction",
    oneLineSummary: "Landlords must follow the correct legal process and notice to evict you.",
    category: "Housing",
    govLink: { label: "Private renting evictions — GOV.UK", url: "https://www.gov.uk/private-renting-evictions" },
  },
  {
    title: "Repairs and a safe home",
    oneLineSummary: "Your landlord is responsible for most repairs and for keeping the home safe.",
    category: "Housing",
    govLink: { label: "Renting: repairs — GOV.UK", url: "https://www.gov.uk/private-renting/repairs" },
  },
  {
    title: "Help with rent (Housing Benefit / UC)",
    oneLineSummary: "Low-income renters may get help with rent through Universal Credit or Housing Benefit.",
    category: "Housing",
    govLink: { label: "Housing Benefit — GOV.UK", url: "https://www.gov.uk/housing-benefit" },
  },

  // ── Money / consumer ──────────────────────────────────────────────────────────
  {
    title: "Consumer rights on faulty goods",
    oneLineSummary: "Under the Consumer Rights Act, goods must be as described, fit for purpose and last.",
    category: "Money",
    govLink: { label: "Consumer protection rights — GOV.UK", url: "https://www.gov.uk/consumer-protection-rights" },
  },
  {
    title: "Section 75 credit card protection",
    oneLineSummary: "Pay by credit card for £100–£30,000 and the lender is jointly liable if things go wrong.",
    category: "Money",
    govLink: {
      label: "Section 75 explained — MoneyHelper",
      url: "https://www.moneyhelper.org.uk/en/everyday-money/buying-and-running-a-car/section-75-of-the-consumer-credit-act",
    },
  },
  {
    title: "Breathing Space from debt",
    oneLineSummary: "A government scheme that pauses most interest and enforcement while you get debt advice.",
    category: "Money",
    govLink: {
      label: "Breathing Space — GOV.UK",
      url: "https://www.gov.uk/options-for-paying-off-your-debts/breathing-space",
    },
  },

  // ── Tax ────────────────────────────────────────────────────────────────────────
  {
    title: "Marriage Allowance",
    oneLineSummary: "A non-taxpayer can transfer part of their Personal Allowance to a basic-rate spouse.",
    category: "Tax",
    govLink: { label: "Marriage Allowance — GOV.UK", url: "https://www.gov.uk/marriage-allowance" },
  },
  {
    title: "Trading & property allowances",
    oneLineSummary: "Earn up to £1,000 from self-employment and £1,000 from property tax-free each year.",
    category: "Tax",
    govLink: {
      label: "Tax-free allowances — GOV.UK",
      url: "https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income",
    },
  },
  {
    title: "Claim back overpaid tax",
    oneLineSummary: "If your tax code was wrong you can reclaim overpaid Income Tax, often going back years.",
    category: "Tax",
    govLink: {
      label: "Tax overpayments and underpayments — GOV.UK",
      url: "https://www.gov.uk/tax-overpayments-and-underpayments",
    },
  },

  // ── Health / pensions ────────────────────────────────────────────────────────
  {
    title: "Help with NHS costs",
    oneLineSummary: "On a low income you may get free prescriptions, dental care and help with other NHS costs.",
    category: "Health",
    govLink: { label: "Help with health costs — NHS", url: "https://www.nhsbsa.nhs.uk/help-nhs-costs" },
  },
  {
    title: "Check & top up your State Pension",
    oneLineSummary: "See your forecast and National Insurance record — and whether topping up is worth it.",
    category: "Pensions",
    govLink: { label: "Check your State Pension — GOV.UK", url: "https://www.gov.uk/check-state-pension" },
  },
];
