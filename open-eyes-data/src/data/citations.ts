/**
 * Citations aggregation — the single source of truth for the /citations page.
 *
 * It pulls every cited fact displayed across transparenC into one browsable
 * evidence base:
 *   1. the upstream data-source registry (grouped by licence),
 *   2. the seven headline issue figures (each a SourcedStat),
 *   3. all tracked party-pledge assessments and their citations,
 *   4. the civics/guidance references used in Learn and the rights index.
 *
 * This module reads the existing structured stores; it never redefines a fact.
 * Anything added to those stores becomes citable here automatically.
 */

import { ISSUE_KEYS, ISSUES, type IssueKey } from "@/data/issues";
import { ALL_PLEDGES, PARTIES, toPledgeStatus } from "@/data/parties";
import { LEARN_MODULES, DEMOCRATIC_RIGHTS } from "@/data/learn";
import { SOURCES, getSource, type DataSource } from "@/contract/sources";
import { formatStatValue, type SourcedStat } from "@/contract/stats";
import { type PledgeStatus } from "@/contract/pledges";

/* ------------------------------------------------------------------ *
 * 1. Primary data sources — the upstream registry, grouped by licence.
 * ------------------------------------------------------------------ */

export const SOURCES_BY_LICENCE = Object.values(SOURCES).reduce<Record<string, DataSource[]>>(
  (acc, s) => {
    (acc[s.licence] ??= []).push(s);
    return acc;
  },
  {},
);

export const SOURCE_COUNT = Object.keys(SOURCES).length;

/* ------------------------------------------------------------------ *
 * 2. Headline issue figures — one SourcedStat per issue hub.
 * ------------------------------------------------------------------ */

export type HeadlineCitation = {
  issueKey: IssueKey;
  issueTitle: string;
  /** Pre-formatted display value, e.g. "75.7%" or "1,500,000 homes". */
  formatted: string;
  stat: SourcedStat;
  source: DataSource;
};

export const HEADLINE_CITATIONS: HeadlineCitation[] = ISSUE_KEYS.map((key) => {
  const issue = ISSUES[key];
  const stat = issue.headlineStat;
  return {
    issueKey: key,
    issueTitle: issue.title,
    formatted: formatStatValue(stat),
    stat,
    source: getSource(stat.sourceId),
  };
});

/* ------------------------------------------------------------------ *
 * 3. Party pledge citations — every tracked pledge, grouped by party.
 * ------------------------------------------------------------------ */

export type PledgeCitation = {
  id: string;
  issue: string;
  promise: string;
  status: PledgeStatus;
  detail?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  /** VERBATIM manifesto wording, shown in quotation marks when present. */
  quote?: string;
  quoteSourceUrl?: string;
  quoteDate?: string;
  /** True when the pledge carries at least one citation link. */
  hasCitation: boolean;
};

export type PartyPledgeCitations = {
  partyId: string;
  partyName: string;
  pledges: PledgeCitation[];
};

export const PLEDGE_CITATIONS_BY_PARTY: PartyPledgeCitations[] = PARTIES.map((party) => ({
  partyId: party.id,
  partyName: party.name,
  pledges: ALL_PLEDGES.filter((p) => p.partyId === party.id).map((p) => ({
    id: p.id,
    issue: p.issue,
    promise: p.promise,
    status: toPledgeStatus(p.status),
    detail: p.detail,
    sourceLabel: p.sourceLabel,
    sourceUrl: p.sourceUrl,
    quote: p.quote,
    quoteSourceUrl: p.quoteSourceUrl,
    quoteDate: p.quoteDate,
    hasCitation: Boolean(p.sourceUrl || p.quoteSourceUrl),
  })),
})).filter((party) => party.pledges.length > 0);

export const PLEDGE_COUNT = ALL_PLEDGES.length;
export const PLEDGE_CITED_COUNT = ALL_PLEDGES.filter((p) => p.sourceUrl || p.quoteSourceUrl).length;

/* ------------------------------------------------------------------ *
 * 4. Civics & guidance references — Learn modules + democratic rights.
 *    Deduplicated by URL (the two stores overlap heavily). Internal
 *    navigation links (e.g. "/methodology") are not citations and are skipped.
 * ------------------------------------------------------------------ */

export type CivicReference = {
  label: string;
  url: string;
  /** Where on the site this reference is used, e.g. "Learn — How a law is made". */
  contexts: string[];
};

function buildCivicReferences(): CivicReference[] {
  const byUrl = new Map<string, CivicReference>();

  const add = (label: string, url: string, context: string) => {
    // Skip internal navigation links — only external citations belong here.
    if (!url || url.startsWith("/")) return;
    const existing = byUrl.get(url);
    if (existing) {
      if (!existing.contexts.includes(context)) existing.contexts.push(context);
      // Keep the most descriptive (longest) label we have seen for this URL.
      if (label.length > existing.label.length) existing.label = label;
    } else {
      byUrl.set(url, { label, url, contexts: [context] });
    }
  };

  for (const mod of LEARN_MODULES) {
    for (const section of mod.lesson) {
      if (section.sourceUrl && section.sourceLabel) {
        add(section.sourceLabel, section.sourceUrl, `Learn — ${mod.title}`);
      }
    }
  }

  for (const right of DEMOCRATIC_RIGHTS) {
    add(right.sourceLabel, right.sourceUrl, "Your democratic rights");
  }

  return Array.from(byUrl.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export const CIVIC_REFERENCES: CivicReference[] = buildCivicReferences();

/* ------------------------------------------------------------------ *
 * Totals — small summary rendered in the page intro.
 * ------------------------------------------------------------------ */

export const CITATION_TOTALS = {
  sources: SOURCE_COUNT,
  headlineFigures: HEADLINE_CITATIONS.length,
  pledges: PLEDGE_COUNT,
  pledgesCited: PLEDGE_CITED_COUNT,
  civicReferences: CIVIC_REFERENCES.length,
};
