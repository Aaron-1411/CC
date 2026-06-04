import type { HelpService } from "../lib/types";

// Free, trusted UK services. All independent and free at the point of use.
// Phone numbers beginning 0800/0808/116 are free to call from UK landlines and
// mobiles (freephone: true).
export const helpServices: HelpService[] = [
  {
    name: "Citizens Advice",
    description:
      "Free, confidential advice on benefits, work, debt, housing, consumer and legal problems — online, by phone or in person.",
    url: "https://www.citizensadvice.org.uk/",
    category: "General advice",
    phone: "0800 144 8848",
    freephone: true,
  },
  {
    name: "MoneyHelper",
    description:
      "The government-backed service for free, impartial money and pensions guidance, with calculators and a benefits checker.",
    url: "https://www.moneyhelper.org.uk/",
    category: "Money & pensions",
    phone: "0800 138 7777",
    freephone: true,
  },
  {
    name: "StepChange Debt Charity",
    description:
      "Free, expert debt advice and managed debt plans. Helps you build a budget and choose the right way to deal with debt.",
    url: "https://www.stepchange.org/",
    category: "Debt",
    phone: "0800 138 1111",
    freephone: true,
  },
  {
    name: "National Debtline",
    description:
      "Free, confidential debt advice from the Money Advice Trust, with self-help fact sheets and sample letters.",
    url: "https://www.nationaldebtline.org/",
    category: "Debt",
    phone: "0808 808 4000",
    freephone: true,
  },
  {
    name: "Christians Against Poverty (CAP)",
    description:
      "Free debt help and budgeting support delivered through local centres across the UK. Open to people of any faith or none.",
    url: "https://capuk.org/",
    category: "Debt",
    phone: "0800 328 0006",
    freephone: true,
  },
  {
    name: "Turn2us",
    description:
      "A national charity helping people access benefits and charitable grants, with a free benefits calculator and grants search.",
    url: "https://www.turn2us.org.uk/",
    category: "Benefits & grants",
    phone: "0808 802 2000",
    freephone: true,
  },
  {
    name: "Shelter",
    description:
      "Free housing advice on renting, eviction, homelessness and repairs — online and via an emergency helpline.",
    url: "https://www.shelter.org.uk/",
    category: "Housing",
    phone: "0808 800 4444",
    freephone: true,
  },
  {
    name: "Age UK",
    description:
      "Information and advice for older people on money, benefits, care and staying independent.",
    url: "https://www.ageuk.org.uk/",
    category: "Older people",
    phone: "0800 678 1602",
    freephone: true,
  },
  {
    name: "Gingerbread",
    description:
      "Support and expert advice for single-parent families on money, benefits, work and maintenance.",
    url: "https://www.gingerbread.org.uk/",
    category: "Single parents",
    phone: "0808 802 0925",
    freephone: true,
  },
  {
    name: "TaxAid",
    description:
      "Free, independent tax advice for people on low incomes who can't afford to pay for professional help.",
    url: "https://taxaid.org.uk/",
    category: "Tax",
    phone: "0345 120 3779",
    freephone: false,
  },
  {
    name: "Samaritans",
    description:
      "If money worries are affecting how you feel, Samaritans are there to listen, day or night — you don't have to be suicidal to call.",
    url: "https://www.samaritans.org/",
    category: "Emotional support",
    phone: "116 123",
    freephone: true,
  },
];
