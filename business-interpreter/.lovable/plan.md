## Excel: validation + commentary with two approval gates

**New stage between transformation and download.** After the agent finishes editing the workbook, before any download or commentary, it runs a Validation pass and presents Gate 1.

**Validation pass (full diff + lineage + anomalies)** — runs server-side, returns a `ValidationReport`:

1. **Reconciliation** — per declared Summary sheet/cell, recompute totals from source ranges and compare to the summary cell. Flag deltas; classify as rounding (<0.5%) vs real mismatch.
2. **Lineage trace** — for each summary cell, parse its formula and walk dependencies back to the original source workbook cells (via the step log already captured during transformation). Output a per-cell tree the reviewer can expand.
3. **Anomaly checks** — sign flips vs prior period, outliers (>3σ within column), missing periods/months, duplicate keys in source tables, mixed currencies/units in a single column, blank-but-expected cells, formula errors (#REF/#DIV/0/#VALUE/#NAME/#N/A), hardcoded values where formulas were expected.
4. **Scorecard** — pass/warn/fail counts + overall status.

**Gate 1 — Validation review (edit-in-place):**
- Side-by-side: Source totals vs Summary totals vs Delta, with lineage drill-down on click.
- Anomalies grouped by severity with cell links (click → opens workbook preview at that cell).
- Reviewer can edit any summary cell or assumption cell inline; on save, agent re-runs validation automatically.
- Actions: **Approve & draft commentary** / **Request changes** (note → agent re-runs the relevant transform step) / **Reject**.

**Commentary draft** — only runs after Gate 1 approval. Uses validated summary figures + anomaly notes + prior-period deltas. Tone/length configurable per recipe.

**Gate 2 — Commentary review (edit-in-place):**
- Rich-text editor pre-filled with the draft, with inline citations linking each number back to its summary cell.
- Reviewer edits freely; agent re-validates that cited numbers still match the workbook after edits (warns if reviewer typed a number that doesn't appear in the workbook).
- Actions: **Approve & finalize** (releases `.xlsx` + commentary `.docx`/`.md` for download) / **Request changes** / **Reject**.

Both gates persist state on the job so reviewers can come back later.

## Competitor research: deep profile per competitor

**Discovery** — unchanged: subject URL → extract offering → Firecrawl `search` to identify competitors (cap configurable, default 8).

**Per-competitor crawl plan (Core + docs/help + reviews):**
1. `firecrawl.map` the competitor domain, filter URLs by intent buckets: pricing, plans, terms/legal, features/product, docs/help, about, customers.
2. Scrape ~5–10 core pages with `formats: ['markdown', 'json']` and a structured extraction schema per bucket.
3. Scrape docs/help index + top 5 docs pages for capability detail.
4. Firecrawl `search` `"<competitor> reviews site:g2.com OR site:trustpilot.com OR site:capterra.com"`, scrape top 2 review pages.

**Structured profile schema** (Zod) — each field with `value`, `confidence`, `source_url`, `evidence_quote`:

- **Pricing & plans**: tiers[] (name, monthly_price, annual_price, per_seat_or_usage, included_quotas, addon_costs), free_trial, money_back, regional_pricing_notes, discounts_promos.
- **Contract & commercial terms**: min_contract_length, auto_renewal, cancellation_notice, payment_terms, SLA_uptime, overage_rates, enterprise_custom_terms_available, refund_policy.
- **Capability matrix**: features[] normalized against subject's feature list (parity / advantage / gap / unknown), integrations[], platforms[], limits, security_compliance[].
- **Positioning & GTM**: tagline, target_segments[], differentiators[], proof_points (logos, case_studies, review_score, review_count, awards), incentives_active, partner_ecosystem[].

**Synthesis step** — after all competitors are profiled, agent produces:
- Side-by-side comparison table (subject + each competitor) per axis.
- Gap/opportunity callouts (where subject lags, where it leads).
- Pricing positioning chart data.
- Sources appendix with every URL + quote.

**Export** — `.xlsx` (one sheet per axis + Master) and `.pdf` (formatted report).

## Build order

1. ValidationReport types + engine (reconciliation, lineage, anomalies) in `src/lib/spreadsheet/validation.server.ts`.
2. Persist `validation_reports` + `commentary_drafts` + `approvals` to DB; add `gate_status` to messages.
3. Gate 1 UI in `app.jobs.$jobId.tsx` — diff viewer, lineage drill-down, inline edit, re-run hook.
4. Commentary generation server fn + Gate 2 UI with rich editor + citation re-check.
5. Final export bundler (xlsx + commentary doc).
6. Deep competitor schema in `src/lib/research/schema.ts`; rewrite `research.functions.ts` to run map → bucketed scrape → reviews search → structured extraction per axis.
7. Synthesis + comparison table + export.

## Technical notes (non-user-facing)

- Validation runs in the worker via `exceljs` + `hyperformula` (already bundled). Lineage uses formula AST from `hyperformula`.
- Re-validation on inline edit is debounced and runs as a `createServerFn` returning the updated `ValidationReport` only (no full re-transform).
- Commentary uses `streamText` with `Output.object` for citations array.
- Competitor extraction uses `generateText` with `Output.object` per axis (split to stay under Gemini schema state limits).
- All Firecrawl calls fan out with concurrency cap 3 to respect rate limits.
- New tables: `validation_reports`, `commentary_drafts`, `approvals`. Existing `research_reports.competitors` JSONB extended to the new profile schema.