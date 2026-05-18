// SEO-targeted long-form guides. Plain English, FTB-friendly, UK-specific.
// Each guide is an island — body is rendered as semantic HTML with H2s.
// Add new guides by appending to GUIDES; slug is the URL.

export interface GuideSection {
  h2: string;
  paragraphs: string[];
}

export interface Guide {
  slug: string;
  title: string;
  summary: string; // 1–2 sentences for cards + meta description
  audience: "first-time-buyers" | "house-hunters" | "remortgagers" | "all";
  readMins: number;
  updated: string; // ISO date
  intro: string;
  sections: GuideSection[];
  related: string[]; // slugs
  // FAQ-style Q&A used for FAQPage JSON-LD on the article. Optional.
  faq?: { q: string; a: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "stamp-duty-explained",
    title: "Stamp Duty Explained: A Plain-English Guide for UK Buyers (2026)",
    summary:
      "What Stamp Duty (or LBTT/LTT) is, how it's calculated, and the relief first-time buyers should know about — with worked examples.",
    audience: "first-time-buyers",
    readMins: 6,
    updated: "2026-05-01",
    intro:
      "Stamp Duty Land Tax (SDLT) is the tax you pay when you buy a home in England or Northern Ireland. Scotland has LBTT, Wales has LTT — same idea, different names and bands. It's almost always your single largest one-off purchase cost after the deposit, and getting the maths wrong can blow your budget.",
    sections: [
      {
        h2: "How Stamp Duty actually works",
        paragraphs: [
          "Stamp Duty is banded, like income tax. You only pay each rate on the slice of price that falls inside that band — not on the whole price.",
          "For a standard residential purchase in England (post-April 2025): 0% on the first £125,000, 2% on £125,001–£250,000, 5% on £250,001–£925,000, 10% on £925,001–£1.5M, and 12% above that.",
          "So a £350,000 home is taxed: £0 on the first £125k + £2,500 (2% of £125k) + £5,000 (5% of £100k) = £7,500 total.",
        ],
      },
      {
        h2: "First-time buyer relief",
        paragraphs: [
          "If you (and any co-buyer) have never owned a property anywhere in the world, you get a more generous starting threshold: 0% up to £300,000 and 5% on the slice between £300,000 and £500,000.",
          "Above £500,000 the relief vanishes entirely and you pay standard rates on the whole price — that £1 over £500,000 can cost you thousands.",
          "Scotland's LBTT first-time buyer relief sits at £175,000. Wales's LTT has no first-time buyer relief at all.",
        ],
      },
      {
        h2: "Surcharges that catch buyers out",
        paragraphs: [
          "Buying a second home or a buy-to-let? Add a 5% surcharge in England (8% in Scotland's ADS, 5%+ in Wales).",
          "Non-UK resident buying in England or NI? Add another 2%.",
          "Both surcharges apply on top of the base bill, not just the slice over a threshold — so they hit hard at any price.",
        ],
      },
      {
        h2: "When and how you pay it",
        paragraphs: [
          "Your solicitor files the return and pays HMRC within 14 days of completion. You give them the cash; they handle the paperwork.",
          "It's payable in cash on completion day — you cannot add it to your mortgage. Budget for it as part of your upfront costs from day one.",
        ],
      },
    ],
    related: ["conveyancing-fees-breakdown", "first-time-buyer-schemes-2026", "what-is-mortgage-in-principle"],
    faq: [
      {
        q: "Do I pay Stamp Duty as a first-time buyer?",
        a: "Not on the first £300,000 in England or NI. You pay 5% on the slice between £300,000 and £500,000. Above £500,000 you pay standard rates on the whole price.",
      },
      {
        q: "Can I add Stamp Duty to my mortgage?",
        a: "No. It must be paid in cash on completion via your solicitor.",
      },
    ],
  },
  {
    slug: "what-is-mortgage-in-principle",
    title: "What is a Mortgage in Principle? (And Why You Need One Before Viewing)",
    summary:
      "A Mortgage in Principle (MIP) is a lender's written estimate of what they'd lend you. Estate agents take buyers with one far more seriously.",
    audience: "first-time-buyers",
    readMins: 5,
    updated: "2026-04-15",
    intro:
      "A Mortgage in Principle — also called an Agreement in Principle (AIP) or Decision in Principle (DIP) — is a written confirmation from a lender that, based on a soft credit check and the income you've declared, they would lend you a specific amount. It's not a binding offer, but it's how the property world signals you're serious.",
    sections: [
      {
        h2: "Why estate agents ask for one",
        paragraphs: [
          "Most estate agents won't book a second viewing — and definitely won't pass on an offer — unless you can show an MIP. It tells them you've been credit-checked, your income's been sense-tested, and you're not wasting anyone's time.",
          "Without one, your offer drops to the back of the pile. With one, you're treated as a 'proceedable buyer'.",
        ],
      },
      {
        h2: "How to get one",
        paragraphs: [
          "You can apply directly with a bank online (typically free, takes 15–30 minutes), or via a mortgage broker who'll do it for you and shop around at the same time.",
          "You'll need: ID, proof of income (3 months payslips or 2 years of accounts if self-employed), 3 months of bank statements, and details of any debts.",
          "It's a soft credit check on your file — it does not affect your credit score. You can have multiple MIPs from different lenders.",
        ],
      },
      {
        h2: "How long it lasts",
        paragraphs: [
          "Most MIPs are valid for 60–90 days. After that you'll need to refresh — which is no big deal but worth diarising if your search runs longer.",
          "If your circumstances change (new job, new debt, a missed payment) the lender can refuse the actual mortgage even if the MIP is still in date.",
        ],
      },
      {
        h2: "MIP vs full mortgage offer",
        paragraphs: [
          "An MIP is a sense-check; a mortgage offer is binding. The full offer comes after you've found a property, the lender has valued it, and they've reviewed full documentation — typically 2–4 weeks after your formal application.",
        ],
      },
    ],
    related: ["conveyancing-fees-breakdown", "first-time-buyer-schemes-2026", "stamp-duty-explained"],
  },
  {
    slug: "conveyancing-fees-breakdown",
    title: "Conveyancing Fees Breakdown: What You'll Actually Pay Your Solicitor",
    summary:
      "Solicitor fees, searches, Land Registry, and the small disbursements that add up. Typical UK 2026 ranges with a worked example.",
    audience: "first-time-buyers",
    readMins: 7,
    updated: "2026-04-22",
    intro:
      "Conveyancing is the legal work to transfer ownership from the seller to you — searches, contracts, exchange and completion. The headline 'solicitor fee' is just one slice. Here's the full bill, broken down.",
    sections: [
      {
        h2: "The solicitor's own fee",
        paragraphs: [
          "This is what the firm charges for their time. Expect £900–£1,800 for a freehold purchase, £1,300–£2,500 for leasehold (more documents to review). Online conveyancers undercut high-street firms by 20–40% but service quality varies — read recent reviews.",
          "VAT (20%) sits on top of the solicitor's fee.",
        ],
      },
      {
        h2: "Searches: typically £250–£450",
        paragraphs: [
          "Local authority search (£100–£250): planning, building regs, road schemes affecting the property.",
          "Water & drainage search (£40–£70): is the property connected to mains water/sewer? Who owns the pipes?",
          "Environmental search (£40–£60): contaminated land, flood risk, ground stability.",
          "Optional but often recommended: chancel repair (£20), coal mining (£40 if relevant area).",
        ],
      },
      {
        h2: "Land Registry & ID checks",
        paragraphs: [
          "HM Land Registry fee: £20–£455 depending on price (banded). For most homes it's £150–£295.",
          "Bankruptcy search (£2 per buyer) and OS1 priority search (£3) — small but they appear on every bill.",
          "ID and AML (anti money-laundering) checks: £15–£40 per buyer.",
        ],
      },
      {
        h2: "Bank transfer fees",
        paragraphs: [
          "CHAPS (same-day) bank transfer to the seller's solicitor: £25–£50 per transfer. Usually one for the deposit at exchange and one for the balance at completion.",
        ],
      },
      {
        h2: "Worked example: £350k freehold purchase",
        paragraphs: [
          "Solicitor fee: £1,200 + £240 VAT = £1,440.",
          "Searches: £350.",
          "Land Registry fee: £150.",
          "AML + bankruptcy + OS1: £40.",
          "CHAPS fees: £60.",
          "Total: roughly £2,040 — and that excludes Stamp Duty, survey and any mortgage fees.",
        ],
      },
    ],
    related: ["stamp-duty-explained", "homebuyer-report-vs-full-structural-survey", "what-is-mortgage-in-principle"],
  },
  {
    slug: "homebuyer-report-vs-full-structural-survey",
    title: "HomeBuyer Report vs Full Structural Survey: Which Survey Do You Actually Need?",
    summary:
      "RICS Level 1, 2 and 3 surveys explained: what each one inspects, what it costs, and how to pick the right one for the home you're buying.",
    audience: "house-hunters",
    readMins: 6,
    updated: "2026-04-30",
    intro:
      "Your mortgage lender will do a quick valuation to make sure the property is worth what they're lending against. That's not a survey for you — it's for them. If you want to know whether the boiler's about to die, the roof needs replacing, or there's damp behind the kitchen units, you need to commission your own survey. Here's how to pick one.",
    sections: [
      {
        h2: "RICS Level 1: Condition Report (~£300–£500)",
        paragraphs: [
          "The cheapest, briefest survey. Uses traffic lights to flag issues but doesn't go into detail or cost estimates.",
          "Best for: new-build or recently-built homes in obvious good condition.",
          "Skip this if the home is older than ~20 years or you've spotted any issue you want analysed.",
        ],
      },
      {
        h2: "RICS Level 2: HomeBuyer Report (~£500–£800)",
        paragraphs: [
          "The most popular choice. A surveyor inspects everything visible (no lifting floorboards or moving furniture) and produces a written report with traffic-light ratings, a market valuation, and ballpark repair cost guidance.",
          "Best for: standard-construction homes (brick/block) under ~80 years old in reasonable condition.",
          "Won't cover: timber-framed buildings, listed properties, anything with visible structural issues.",
        ],
      },
      {
        h2: "RICS Level 3: Building Survey (~£800–£1,500+)",
        paragraphs: [
          "The deepest inspection. The surveyor lifts floorboards where safe, inspects the loft properly, looks at hidden timbers, and gives detailed repair specifications and costs.",
          "Best for: older homes (pre-1930s), listed buildings, anything that's been extended, properties with obvious defects, or any home over £500k where the cost is rounding error vs the price.",
          "Worth it for peace of mind — a £1,200 survey that flags a £15,000 roof problem is the best money you'll ever spend.",
        ],
      },
      {
        h2: "Scotland is different",
        paragraphs: [
          "In Scotland the seller commissions a Home Report (Single Survey + Property Questionnaire + Energy Report) before listing. You read it for free. You can still commission your own additional survey if you want a second opinion.",
        ],
      },
      {
        h2: "How to choose",
        paragraphs: [
          "Use a RICS-registered surveyor familiar with the local area. Get 2–3 quotes; prices vary 30–40% for the same product.",
          "Read the report end-to-end, not just the summary. The 'amber' items often hide the most useful information.",
          "Use any negative findings to negotiate the price down or get the seller to fix the issues before exchange.",
        ],
      },
    ],
    related: ["property-viewing-checklist", "conveyancing-fees-breakdown", "stamp-duty-explained"],
  },
  {
    slug: "property-viewing-checklist",
    title: "Property Viewing Checklist: 40 Things to Look For (and Ask About)",
    summary:
      "A printable checklist for first viewings — what to look at, what to test, what to ask, and the red flags that should send you running.",
    audience: "house-hunters",
    readMins: 8,
    updated: "2026-05-02",
    intro:
      "Most first viewings last 15–20 minutes. Estate agents are pros at steering you toward the good bits and away from the bad. Bring this checklist (and a phone torch) so you leave with information, not just impressions.",
    sections: [
      {
        h2: "Outside (5 minutes before you go in)",
        paragraphs: [
          "Walk the street. Cars on driveways or kerbs only? Bins overflowing? Houses well-maintained? Street parking is the single biggest quality-of-life issue people underestimate.",
          "Look at the roof: missing tiles, sagging ridge, mossy patches, lead flashing in good condition?",
          "Check the brickwork for cracks (especially stair-step cracks above windows — they suggest movement). Look at the pointing.",
          "Damp-proof course should be visible above ground level — any rendering or planting covering it can trap moisture.",
        ],
      },
      {
        h2: "First impressions inside",
        paragraphs: [
          "Smells — fresh paint can hide damp; air freshener can hide mould or pets. Use your nose.",
          "Look at the corners of every room (top and bottom) for staining or fresh paint patches.",
          "Tap radiators near the bottom — cold spots mean sludged systems.",
          "Open and close every window. Note any that won't seal, have failed double-glazing units (foggy), or have rotten frames.",
        ],
      },
      {
        h2: "Kitchen and bathrooms",
        paragraphs: [
          "Run every tap (hot and cold), flush every loo, fire up the shower. Pressure should be strong; recovery should be quick.",
          "Look under the sinks for leaks, water damage, mould, or sloppy plumbing.",
          "Check tile grout in showers — black mould suggests poor ventilation, which is expensive to fix properly.",
          "Open the boiler cupboard. How old is the boiler? When was it last serviced? Where's the gas safety cert?",
        ],
      },
      {
        h2: "Storage, light and layout",
        paragraphs: [
          "Where will you put a hoover, ironing board, suitcases, bikes, Christmas tree? UK homes routinely lack storage.",
          "Visit on different days/times — north-facing living rooms can be gloomy by 3pm in winter.",
          "Measure your sofa or bed before viewing. 'Master bedroom' often means 'will fit a double bed and one bedside table'.",
        ],
      },
      {
        h2: "Questions to ask the agent (and the seller if there)",
        paragraphs: [
          "Why are they selling? How long have they lived there? How long has it been on the market?",
          "Any previous offers? Any chains involved? When could they realistically complete?",
          "Any work done in the last 10 years — extensions, rewires, new windows? Building regs sign-off available?",
          "Council tax band, monthly utility bills (ask to see a recent statement), broadband speed.",
          "If leasehold: years remaining, ground rent, service charge history (3 years), any major works planned.",
        ],
      },
      {
        h2: "Red flags worth walking away from",
        paragraphs: [
          "Visible cracks above 5mm wide, especially diagonal ones around door frames.",
          "Sloping floors you can feel through your shoes.",
          "Strong musty smell that returns the moment you stop sniffing the candles.",
          "Estate agent rushing you, dodging questions, or refusing a second viewing.",
          "Anything described as 'a project' or 'needs modernising' without a builder's quote attached.",
        ],
      },
    ],
    related: ["homebuyer-report-vs-full-structural-survey", "conveyancing-fees-breakdown", "stamp-duty-explained"],
  },
  {
    slug: "first-time-buyer-schemes-2026",
    title: "First-Time Buyer Schemes 2026: Every UK Scheme Compared",
    summary:
      "Lifetime ISA, Shared Ownership, First Homes, Mortgage Guarantee 95% LTV, Right to Buy and the regional schemes — what's still live in 2026 and who qualifies.",
    audience: "first-time-buyers",
    readMins: 7,
    updated: "2026-05-04",
    intro:
      "The Help to Buy Equity Loan ended in 2023, but several schemes can still cut your deposit, your interest rate, or the price you pay. Here's the 2026 landscape, with the small print that catches buyers out.",
    sections: [
      {
        h2: "Lifetime ISA (LISA)",
        paragraphs: [
          "Save up to £4,000 per tax year; the government tops it up by 25% (so up to £1,000 free per year). Funds must be used for a first home worth £450,000 or less, or held until age 60.",
          "Open to UK residents aged 18–39. You must hold the LISA for at least 12 months before withdrawal for a property purchase.",
          "Catch: if you withdraw for any other reason — or buy a home over £450,000 — you lose 25% of the total (effectively the bonus + a small extra penalty).",
        ],
      },
      {
        h2: "Shared Ownership",
        paragraphs: [
          "Buy 25%–75% of a (usually new-build) property and pay rent on the rest to a housing association. You can 'staircase' up to 100% over time.",
          "Lower deposit needed (typically 5–10% of just your share). But you pay rent + service charge + ground rent on top of the mortgage, and reselling can be slow.",
          "Eligible if household income is under £80,000 (£90,000 in London) and you can't afford to buy outright.",
        ],
      },
      {
        h2: "First Homes",
        paragraphs: [
          "New-build homes sold to local first-time buyers at a 30%–50% discount on market value. Discount stays attached to the property forever, so the next buyer also gets it.",
          "Income cap: £80,000 (£90,000 London). Priority is often given to local connections and key workers.",
          "Stock is limited — check council websites for live developments.",
        ],
      },
      {
        h2: "Mortgage Guarantee Scheme (95% LTV)",
        paragraphs: [
          "The government underwrites a portion of the lender's risk on 95% LTV mortgages. In practice it means more lenders offer 5%-deposit mortgages on properties up to £600,000.",
          "Open to first-time buyers and home movers, on standard residential properties (not new-builds in some lenders).",
          "Rates on 95% mortgages are higher than 75–85% LTV — budget carefully.",
        ],
      },
      {
        h2: "Right to Buy (council tenants)",
        paragraphs: [
          "Council tenants in England can buy their home at a discount of up to £102,400 (£136,400 in London). Eligibility requires 3+ years as a public-sector tenant.",
          "Discount is recoverable on a sliding scale if you sell within 5 years.",
        ],
      },
      {
        h2: "Regional schemes worth checking",
        paragraphs: [
          "Scotland: First Home Fund and Open Market Shared Equity (LIFT).",
          "Wales: Help to Buy — Wales (still active, equity loan up to 20%).",
          "Northern Ireland: Co-Ownership shared ownership scheme.",
          "Always check your local council's housing pages — many councils run small additional grants for key workers and local first-time buyers.",
        ],
      },
    ],
    related: ["stamp-duty-explained", "what-is-mortgage-in-principle", "conveyancing-fees-breakdown"],
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const relatedGuides = (slug: string) => {
  const g = getGuide(slug);
  if (!g) return [];
  return g.related.map(getGuide).filter(Boolean) as Guide[];
};
