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
