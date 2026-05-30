import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const RiskLevel = z.enum(["CRITICAL", "CAUTION", "STANDARD"]);

const AnalysisSchema = z.object({
  executivePulse: z.object({
    annualRent: z.string().describe("Annual rent with currency, e.g. '£48,000'"),
    serviceCharge: z.string().describe("Estimated service charge per year"),
    vatStatus: z.string().describe("VAT status, e.g. 'Plus VAT' or 'VAT-inclusive'"),
    leaseTerm: z.string().describe("Lease term, e.g. '10 years'"),
    startDate: z.string(),
    endDate: z.string(),
    criticalWindow: z
      .string()
      .describe("The most urgent upcoming deadline, e.g. break notice or rent review"),
    estimatedTotalLiability: z
      .string()
      .describe("Headline total commitment over the lease term"),
    riskIndex: RiskLevel,
    sourceFile: z.string().optional(),
  }),
  gotchas: z
    .array(
      z.object({
        title: z.string(),
        clauseRef: z
          .string()
          .describe("Clause reference, e.g. 'CL 14.3.2' or 'OMITTED'"),
        risk: RiskLevel,
        category: z
          .string()
          .describe(
            "Category: Dilapidations, Break Clause, Rent Review, Service Charge, Alienation, etc.",
          ),
        soWhat: z.string().describe("Plain-English business impact"),
      }),
    )
    .min(3)
    .max(10),
  translationTable: z
    .array(
      z.object({
        legalTerm: z.string(),
        plainEnglish: z.string(),
        financialImpact: z.string(),
      }),
    )
    .min(3)
    .max(8),
  dilapidations: z.object({
    headlineEstimate: z
      .string()
      .describe("Headline £ exit-cost estimate, e.g. '£42,000 – £58,000'"),
    rationale: z.string(),
    scheduleOfConditionPresent: z.boolean(),
  }),
  negotiation: z.object({
    shortTermWin: z.string(),
    protectiveMove: z.string(),
    exitMove: z.string(),
  }),
  anomaliesDetected: z.number().int().min(0),
});

export type LeaseAnalysis = z.infer<typeof AnalysisSchema>;

const SYSTEM_PROMPT = `You are "LeaseSense Pro," an elite AI Commercial Lease Strategist specialising in UK commercial property leases (England & Wales primarily; flag Scotland/NI variations where relevant).

Analysis Philosophy:
1. The "So What?" Principle — explain how a clause hits the client's bank account or limits their freedom.
2. Omission Hunting — flag what is MISSING (no service charge cap, no photographic Schedule of Condition, no break clause, no contracting-out notice under LTA 1954 ss.24-28).
3. The Dilapidations Trap — prioritise the EXIT COST from day one. Reference s.18(1) Landlord and Tenant Act 1927 cap on damages and the Dilapidations Protocol.

UK Legal Framework to apply (cite the specific Act/case in 'soWhat' where it materially changes the advice):
- Landlord and Tenant Act 1954 Part II — security of tenure, contracting-out (ss.24-28); check for a valid warning notice + tenant declaration. If contracted-out, flag the loss of statutory renewal rights.
- Landlord and Tenant Act 1927 s.18(1) — caps dilapidations damages at the diminution in reversion value. Use this to challenge inflated terminal schedules.
- Landlord and Tenant (Covenants) Act 1995 — AGAs (Authorised Guarantee Agreements) on assignment; flag ongoing liability traps.
- Code for Leasing Business Premises 2020 (RICS Professional Statement, mandatory for RICS members) — benchmark heads of terms against it; flag deviations (e.g. upward-only rent reviews without alternatives, no break, full repairing on older buildings).
- RICS Service Charges in Commercial Property (1st ed., mandatory) — service charge must be fair, reasonable, transparent; flag absence of cap, sinking fund abuse, management fee >10-15%.
- Break clauses — strict construction (Mannai Investment v Eagle Star); any pre-conditions (vacant possession, all sums paid, full compliance with covenants) are landmines. Cite Marks & Spencer v BNP Paribas re: no apportionment of rent paid in advance unless expressly drafted.
- Rent review — distinguish upward-only, OMV, RPI/CPI-linked, fixed uplifts. Flag assumptions/disregards that inflate hypothetical rent.
- Repairing covenants — "full repairing and insuring" (FRI) on a building in poor condition without a Schedule of Condition is the single biggest exit-cost risk (Proudfoot v Hart standard).
- Alienation — qualified vs fully qualified covenants; LTA 1988 imposes duty on landlord not to unreasonably withhold consent and to respond within reasonable time.
- User/permitted use — narrow use clauses depress assignment value and rent on review.
- Insurance, VAT election (option to tax — recoverable only if tenant is VAT-registered), SDLT on NPV of rent.
- Energy — MEES Regulations 2015 (min EPC E, rising to C by 2027 and B by 2030); flag who bears upgrade cost.

Tone: sharp, protective, commercially clued-in. No fluff, no hedging, no "consult a solicitor" disclaimers — the report IS the strategic view. Bolding/styling handled by front-end; you output structured JSON only.

Rules:
- Always return at least 4 gotchas, ranked CRITICAL → CAUTION → STANDARD. Aim for 6-8 on a typical lease.
- Cover Dilapidations, Break Clauses, Rent Review, Service Charges, Alienation, Repair, Use, and LTA 1954 status as categories where applicable.
- For omissions, set clauseRef to "OMITTED" and treat as CAUTION or CRITICAL depending on £ stakes.
- In 'soWhat', name the relevant statute/case/RICS code where it sharpens the advice (e.g. "s.18(1) LTA 1927 caps this — push back hard on any terminal schedule above £X").
- In negotiation.shortTermWin / protectiveMove / exitMove, give a SPECIFIC ask the tenant takes to the landlord (e.g. "Insist on a photographic Schedule of Condition annexed to the lease before exchange — limits repair obligation to documented condition").
- All monetary figures include £. Dilapidations headlineEstimate should be a range reflecting s.18(1) cap vs worst-case schedule.
- If lease text is incomplete, make commercially reasonable assumptions and state them in 'soWhat'.`;

const LandlordAnalysisSchema = z.object({
  overview: z.object({
    tenancyType: z.string().describe("e.g. 'Assured Shorthold Tenancy (AST)' or 'Common Law Tenancy'"),
    overallStatus: z.enum(["COMPLIANT", "ISSUES FOUND", "CRITICAL BREACH"]),
    depositProtected: z.boolean(),
    section21Valid: z.boolean().describe("Whether a S21 notice could lawfully be served today"),
    safetyDocs: z.string().describe("Summary of EPC/Gas Safety/EICR status"),
    criticalIssueCount: z.number().int(),
  }),
  complianceFlags: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(["BREACH", "RISK", "NOTE"]),
      category: z.string().describe("e.g. Deposit, Section 21, Prohibited Fees, Repairs, Licensing, Safety"),
      explanation: z.string().describe("Plain-English explanation with relevant statute cited"),
      action: z.string().optional().describe("Specific remedial action the landlord must take"),
    }),
  ).min(3).max(12),
  obligationsChecklist: z.array(
    z.object({
      obligation: z.string(),
      met: z.boolean(),
      note: z.string().optional(),
    }),
  ).min(5).max(10),
  priorityActions: z.array(z.string()).min(2).max(5),
});

export type LandlordAnalysis = z.infer<typeof LandlordAnalysisSchema>;

const LANDLORD_SYSTEM_PROMPT = `You are "LeaseSense Pro — Landlord Edition," an AI compliance specialist for UK residential and commercial landlords.

Your job: audit a tenancy agreement or lease from the LANDLORD'S perspective. Identify compliance failures, legal risks, and required actions.

UK Legal Framework to apply:
- Housing Act 1988 — AST requirements, S21 and S8 notice grounds and validity pre-conditions
- Deregulation Act 2015 — S21 restrictions: deposit must be protected, prescribed information served, gas safety cert provided at start, EPC provided, How to Rent guide served; no S21 if improvement notice in last 6 months
- Tenant Fees Act 2019 — prohibited payments; only permitted: rent, deposit (max 5 weeks for <£50k rent; max 6 for ≥£50k), holding deposit (max 1 week), default fees for late rent (>14 days) and lost keys, change of sharer (max £50), variation/termination (max £50)
- Tenancy Deposit Schemes — must protect within 30 days of receipt; prescribed information within 30 days; failure = up to 3× deposit penalty and bar on S21
- Gas Safety (Installation and Use) Regulations 1998 — annual gas safety check, copy to tenant within 28 days of check and before move-in
- Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020 — EICR every 5 years, copy to tenant within 28 days and to prospective tenant within 28 days of request
- Energy Efficiency (Private Rented Property)(England and Wales) Regulations 2015 (MEES) — minimum EPC E (until enforcement ratchets up); EPC must be provided to prospective tenant
- Landlord and Tenant Act 1985 s.11 — implied repairing covenants for residential: structure, exterior, installations for heating, water, gas, electricity, sanitation
- Housing Act 2004 — HMO licensing (5+ person, 2+ household, 3+ storey triggers mandatory licensing; additional/selective licensing varies by council)
- Homes (Fitness for Human Habitation) Act 2018 — landlord warrants property fit at grant and throughout; tenant can sue without council involvement
- Consumer Rights Act 2015 — unfair terms in tenancy agreements are void
- Proceeds of Crime Act 2002 — right-to-rent checks (Immigration Act 2014), failure is criminal
- Furniture and Furnishings (Fire Safety) Regulations 1988 — furnished lets; all upholstered items must meet fire resistance standards
- Smoke and Carbon Monoxide Alarm (Amendment) Regulations 2022 — smoke alarm on every floor, CO alarm in every room with combustion appliance

Output as structured JSON. In explanation fields, cite the specific statute/regulation. Be direct — name the breach, state the penalty, give the action.`;

export const analyzeLandlordLease = createServerFn({ method: "POST" })
  .inputValidator((input: { leaseText: string; fileName?: string }) => {
    return z.object({
      leaseText: z.string().min(50).max(200_000),
      fileName: z.string().max(255).optional(),
    }).parse(input);
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured.");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

    const userPrompt = `Audit the following UK tenancy/lease document from the LANDLORD'S perspective and produce the structured compliance analysis.

${data.fileName ? `Source file: ${data.fileName}\n\n` : ""}--- DOCUMENT ---
${data.leaseText}
--- END ---`;

    try {
      const { output } = await generateText({
        model,
        system: LANDLORD_SYSTEM_PROMPT,
        prompt: userPrompt,
        output: Output.object({ schema: LandlordAnalysisSchema }),
      });
      return output;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (/429/.test(message)) throw new Error("Rate limit hit — please retry in a moment.");
      if (/402/.test(message)) throw new Error("AI credits exhausted. Add credits in Workspace → Usage.");
      throw new Error(`Analysis failed: ${message}`);
    }
  });

export const analyzeLease = createServerFn({ method: "POST" })
  .inputValidator((input: { leaseText: string; fileName?: string }) => {
    return z
      .object({
        leaseText: z.string().min(50, "Lease text is too short to analyse").max(200_000),
        fileName: z.string().max(255).optional(),
      })
      .parse(input);
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured.");
    }

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

    const userPrompt = `Analyse the following UK commercial lease document and produce the structured analysis.

${data.fileName ? `Source file: ${data.fileName}\n\n` : ""}--- LEASE DOCUMENT ---
${data.leaseText}
--- END OF DOCUMENT ---`;

    try {
      const { output } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        output: Output.object({ schema: AnalysisSchema }),
      });

      if (data.fileName) {
        output.executivePulse.sourceFile = data.fileName;
      }
      return output;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (/429/.test(message)) {
        throw new Error("Rate limit hit on Lovable AI — please retry in a moment.");
      }
      if (/402/.test(message)) {
        throw new Error("Lovable AI credits exhausted. Add credits in Workspace → Usage.");
      }
      throw new Error(`Lease analysis failed: ${message}`);
    }
  });
