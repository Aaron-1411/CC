import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const ComplaintInputSchema = z.object({
  mode: z.enum(["tenant", "landlord"]).default("tenant"),
  agentName: z.string().min(1).max(200),
  agentAddress: z.string().max(500).optional(),
  yourName: z.string().min(1).max(200),
  propertyAddress: z.string().min(1).max(300),
  issueCategory: z.enum([
    // tenant categories
    "repairs_ignored",
    "deposit_dispute",
    "illegal_fees",
    "harassment",
    "entry_without_notice",
    "unsafe_property",
    "referencing_delay",
    // landlord categories
    "rent_not_passed",
    "poor_marketing",
    "failed_inspections",
    "undisclosed_commissions",
    "poor_maintenance_management",
    "breach_of_management_agreement",
    "client_money_mishandling",
    // shared
    "other",
  ]),
  issueDescription: z.string().min(20).max(3000),
  dateIssueStarted: z.string().max(50).optional(),
  previousContactMade: z.boolean(),
  desiredOutcome: z.string().max(500).optional(),
});

const ComplaintOutputSchema = z.object({
  letter: z.string().describe("Full formal complaint letter, ready to send"),
  keyRights: z.array(
    z.object({
      right: z.string(),
      legislation: z.string(),
      relevance: z.string(),
    }),
  ).min(2).max(6),
  nextSteps: z.array(z.string()).min(2).max(5),
  escalationPath: z.string().describe("What to do if the agent doesn't respond within 8 weeks"),
  redressScheme: z.string().describe("Which redress scheme the agent is likely registered with and how to escalate"),
});

export type ComplaintInput = z.infer<typeof ComplaintInputSchema>;
export type ComplaintOutput = z.infer<typeof ComplaintOutputSchema>;

const TENANT_SYSTEM_PROMPT = `You are "LeaseSense Pro — Tenant Rights," a specialist in UK residential tenancy law, drafting formal complaint letters for tenants against letting agents.

Your job: produce a professional, legally-grounded complaint letter and supporting information for the tenant.

Key legislation and rights to draw on:
- Consumer Rights Act 2015 — agents must provide services with reasonable care and skill; unfair terms void
- Tenant Fees Act 2019 — prohibited payments; only permitted fees: rent, capped deposits, holding deposit (max 1 week), default fees; breach = criminal offence, fine up to £30,000 for repeat breaches
- Housing Act 1988 — AST framework; quiet enjoyment covenant implied
- Landlord and Tenant Act 1985 s.11 — implied repair covenants; landlord must keep structure, exterior, and service installations in repair
- Protection from Eviction Act 1977 — harassment and unlawful eviction; landlord/agent entering without proper notice (minimum 24 hours written) can constitute harassment
- Homes (Fitness for Human Habitation) Act 2018 — property must be fit throughout tenancy; tenant can sue independently
- Housing Health and Safety Rating System (HHSRS) — councils can serve improvement notices; failure to comply = criminal offence
- The Letting Agents (Redress Schemes) Order 2014 — all letting agents in England must belong to a redress scheme (The Property Ombudsman, Property Redress Scheme, or CEDR)
- Client Money Protection Schemes for Property Agents (Approval and Designation of Schemes) Regulations 2018 — agents must protect client money
- Tenancy Deposit Schemes — if deposit not protected within 30 days: up to 3× deposit compensation, bar on S21
- General Data Protection Regulation / UK GDPR — data rights regarding references and credit checks

Letter style: formal but firm. Date: today. Reference: "WITHOUT PREJUDICE SAVE AS TO COSTS" unless this is the first letter (then omit). Give the agent 14 days to respond before escalation. Sign off from the tenant.

Escalation path: redress scheme → local council (Housing/Trading Standards) → court (small claims for financial losses, county court for injunctions).

Output structured JSON only. The 'letter' field must contain the complete letter text (no markdown, use plain line breaks), ready to copy-paste and send.`;

const LANDLORD_COMPLAINT_SYSTEM_PROMPT = `You are "LeaseSense Pro — Landlord Rights," a specialist in UK property management law, drafting formal complaint letters for landlords against letting agents who have managed their property.

Your job: produce a professional, legally-grounded complaint letter from the landlord's perspective and supporting information.

Key legislation and rights to draw on:
- Consumer Rights Act 2015 — agents must provide services with reasonable care and skill (s.49); implied term that service will be carried out within a reasonable time (s.52); landlord entitled to repeat performance or price reduction/refund (s.55-56)
- Estate Agents Act 1979 — agents must disclose personal interests; duties of disclosure apply to letting agents by analogy
- The Letting Agents (Redress Schemes) Order 2014 — mandatory membership of TPO, PRS, or CEDR; landlords can bring complaints as well as tenants
- Client Money Protection Schemes for Property Agents (Approval and Designation of Schemes) Regulations 2018 — agents must protect landlord and tenant client money; failure = criminal offence (up to £30,000 fine); agents must display certificate; landlord can report to Trading Standards
- Management agreement / agency agreement terms — breach of contractual obligations (failure to inspect, failure to source tenants, failure to remit rent) is actionable; landlord entitled to damages for loss of rent or management failings
- Fiduciary duty — agents owe a fiduciary duty to landlords; undisclosed commissions (e.g. from contractors, insurance referrals) constitute secret profit and must be paid over or are recoverable
- Supply of Goods and Services Act 1982 (now Consumer Rights Act 2015 for business-to-consumer; common law for B2B) — reasonable care and skill standard
- Misrepresentation Act 1967 — if agent misrepresented services, landlord may rescind contract or claim damages
- Financial Services and Markets Act 2000 — if agent advises on insurance without FCA authorisation, this is a criminal offence

Letter style: formal but firm, business-to-business tone. Date: today. Give the agent 14 days to respond. Sign off from the landlord.

Escalation path: redress scheme → Trading Standards (for CMP breaches) → civil court (breach of contract, fiduciary duty, account of profits for secret commissions).

Output structured JSON only. The 'letter' field must contain the complete letter text (no markdown, use plain line breaks), ready to copy-paste and send.`;

const ISSUE_CATEGORY_LABELS: Record<ComplaintInput["issueCategory"], string> = {
  // tenant
  repairs_ignored: "failure to carry out repairs",
  deposit_dispute: "deposit deduction dispute",
  illegal_fees: "unlawful fees charged",
  harassment: "harassment / interference with quiet enjoyment",
  entry_without_notice: "entry to property without proper notice",
  unsafe_property: "unsafe or uninhabitable property conditions",
  referencing_delay: "unreasonable delay in referencing process",
  // landlord
  rent_not_passed: "failure to pass on rental income",
  poor_marketing: "inadequate marketing / failure to find tenants",
  failed_inspections: "failure to carry out agreed property inspections",
  undisclosed_commissions: "undisclosed commissions or secret profits",
  poor_maintenance_management: "poor maintenance management / contractor overcharging",
  breach_of_management_agreement: "breach of management agreement terms",
  client_money_mishandling: "client money protection / mishandling of funds",
  // shared
  other: "letting agent conduct complaint",
};

export const generateComplaintLetter = createServerFn({ method: "POST" })
  .inputValidator((input: ComplaintInput) => ComplaintInputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured.");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

    const categoryLabel = ISSUE_CATEGORY_LABELS[data.issueCategory];
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const isLandlord = data.mode === "landlord";

    const userPrompt = `Draft a formal complaint letter and supporting information for the following situation.

Today's date: ${today}
Complainant (${isLandlord ? "Landlord" : "Tenant"}): ${data.yourName}
Property: ${data.propertyAddress}
Letting Agent: ${data.agentName}${data.agentAddress ? ` · ${data.agentAddress}` : ""}
Issue category: ${categoryLabel}
Issue description: ${data.issueDescription}
${data.dateIssueStarted ? `Issue started: ${data.dateIssueStarted}` : ""}
Previous contact made: ${data.previousContactMade ? "Yes" : "No"}
${data.desiredOutcome ? `Desired outcome: ${data.desiredOutcome}` : ""}

Produce the complete complaint letter and the supporting information.`;

    try {
      const { output } = await generateText({
        model,
        system: isLandlord ? LANDLORD_COMPLAINT_SYSTEM_PROMPT : TENANT_SYSTEM_PROMPT,
        prompt: userPrompt,
        output: Output.object({ schema: ComplaintOutputSchema }),
      });
      return output;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (/429/.test(message)) throw new Error("Rate limit hit — please retry in a moment.");
      if (/402/.test(message)) throw new Error("AI credits exhausted.");
      throw new Error(`Letter generation failed: ${message}`);
    }
  });
