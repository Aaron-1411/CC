import type { UKFigures } from "../lib/types";

// All figures verified against official UK sources for the 2026/27 tax year
// (6 April 2026 – 5 April 2027). Rates are decimals (0.20 = 20%). Money values
// are whole GBP for the period named in the key. England & Northern Ireland are
// the default; Scotland/Wales divergences are explained in lesson prose.
export const UK_FIGURES: UKFigures = {
  taxYear: "2026/27",

  incomeTax: {
    personalAllowance: 12570, // source: https://www.gov.uk/income-tax-rates (frozen to 2030/31, verified 2026/27)
    personalAllowanceTaperThreshold: 100000, // PA falls £1 per £2 of income above this; gone at £125,140
    basicRate: 0.2,
    higherRate: 0.4,
    additionalRate: 0.45,
    basicRateBandUpper: 37700, // taxable income; source: https://www.gov.uk/income-tax-rates
    higherRateBandUpper: 125140, // additional rate starts here
  },

  nationalInsurance: {
    // source: https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027 (verified 2026/27)
    primaryThresholdAnnual: 12570, // £242/week
    upperEarningsLimitAnnual: 50270,
    employeeMainRate: 0.08, // between PT and UEL
    employeeUpperRate: 0.02, // above UEL
    secondaryThresholdAnnual: 5000, // employer ST, reduced from £9,100 from 6 April 2025
    employerRate: 0.15, // secondary Class 1 rate from 6 April 2025
  },

  savings: {
    isaAllowance: 20000, // source: https://www.gov.uk/individual-savings-accounts (verified 2026/27)
    lisaAllowance: 4000, // counts within the £20,000 ISA limit; source: https://www.gov.uk/lifetime-isa
    lisaBonusRate: 0.25, // 25% government bonus, max £1,000/year
    juniorIsaAllowance: 9000, // source: https://www.gov.uk/junior-individual-savings-accounts
    helpToSaveMonthlyMax: 50, // source: https://www.gov.uk/get-help-savings-low-income
    helpToSaveBonusRate: 0.5, // 50p per £1 saved, paid on highest balance
  },

  statePension: {
    fullNewWeekly: 241.3, // £241.30/week; source: https://www.gov.uk/government/publications/benefit-and-pension-rates-2026-to-2027 (up 4.8% from £230.25)
    qualifyingYearsForFull: 35, // qualifying years for the full new State Pension
    minQualifyingYears: 10, // minimum to receive any new State Pension
  },

  pensions: {
    autoEnrolMinTotal: 0.08, // total min of qualifying earnings; source: https://www.moneyhelper.org.uk/en/pensions-and-retirement/pensions-basics/automatic-enrolment-an-introduction
    autoEnrolMinEmployer: 0.03, // minimum employer share
    annualAllowance: 60000, // source: https://www.gov.uk/tax-on-your-private-pension/annual-allowance (verified 2026/27)
  },

  work: {
    // National Minimum / Living Wage from 1 April 2026
    // source: https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027 / Low Pay Commission
    nlwHourly: 12.71, // aged 21+
    wage18to20Hourly: 10.85, // aged 18–20
    wageUnder18Hourly: 8.0, // aged 16–17
    apprenticeHourly: 8.0, // apprentices under 19 or in first year
    statutorySickPayWeekly: 123.25, // £123.25/week from 6 April 2026; source: https://www.gov.uk/statutory-sick-pay
    statutoryHolidayWeeks: 5.6, // 28 days for a 5-day week; source: https://www.gov.uk/holiday-entitlement-rights
    redundancyWeeklyPayCap: 751, // max week's pay from 6 April 2026; source: https://www.gov.uk/calculate-your-redundancy-pay
    redundancyMaxYears: 20, // capped service years used in the formula
  },

  benefits: {
    // source: https://www.gov.uk/government/publications/benefit-and-pension-rates-2026-to-2027 (verified 2026/27)
    childBenefitFirstChildWeekly: 27.05, // £27.05/week eldest or only child
    childBenefitAdditionalChildWeekly: 17.9, // £17.90/week each additional child
    highIncomeChildBenefitChargeThreshold: 60000, // HICBC starts; source: https://www.gov.uk/child-benefit-tax-charge
    highIncomeChildBenefitChargeUpper: 80000, // fully clawed back at this adjusted net income
  },

  tax: {
    tradingAllowance: 1000, // source: https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income
    propertyAllowance: 1000, // source: https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income
    capitalGainsAnnualExemption: 3000, // source: https://www.gov.uk/capital-gains-tax/allowances (verified 2026/27)
    inheritanceTaxNilRateBand: 325000, // source: https://www.gov.uk/inheritance-tax (frozen to 2029/30)
    residenceNilRateBand: 175000, // source: https://www.gov.uk/guidance/inheritance-tax-residence-nil-rate-band
    marriageAllowanceTransferable: 1260, // 10% of PA transferable; source: https://www.gov.uk/marriage-allowance
    selfAssessmentUntaxedIncomeThreshold: 1000, // untaxed income / self-employed turnover trigger; source: https://www.gov.uk/check-if-you-need-tax-return
  },

  property: {
    // Stamp Duty Land Tax (England & NI), residential main home, from 1 April 2025
    // source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates (verified 2026/27)
    sdltThreshold: 125000, // standard nil-rate ceiling
    sdltFirstTimeBuyerThreshold: 300000, // first-time buyer nil-rate ceiling
    sdltFirstTimeBuyerMaxPrice: 500000, // FTB relief lost above this price
    sdltBands: [
      { upTo: 125000, rate: 0 },
      { upTo: 250000, rate: 0.02 },
      { upTo: 925000, rate: 0.05 },
      { upTo: 1500000, rate: 0.1 },
      { upTo: null, rate: 0.12 },
    ],
  },
};
