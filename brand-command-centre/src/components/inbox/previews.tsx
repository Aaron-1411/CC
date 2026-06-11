"use client";

import { marked } from "marked";
import { Star } from "lucide-react";
import type {
  AdPayload,
  ContentPayload,
  EmailPayload,
  IntelReportPayload,
  InboxItemType,
  AgentPayload,
  PromoPayload,
  ReviewPayload,
  SocialPayload,
} from "@/types/agents";

const SOCIAL_LIMITS: Record<string, number> = {
  instagram: 2200,
  tiktok: 150,
  linkedin: 3000,
  twitter_x: 280,
  pinterest: 500,
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
        {label}
      </span>
      <span className="text-sm text-[var(--ink)]">{value}</span>
    </div>
  );
}

function CharCount({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span className={over ? "text-[var(--bad)]" : "text-[var(--ink-3)]"}>
      {value.length}/{limit}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-4">
      {children}
    </div>
  );
}

export function Preview({ type, payload }: { type: InboxItemType; payload: AgentPayload }) {
  switch (type) {
    case "BLOG_POST":
      return <BlogPreview p={payload as ContentPayload} />;
    case "SOCIAL_POST":
      return <SocialPreview p={payload as SocialPayload} />;
    case "AD_DRAFT":
      return <AdPreview p={payload as AdPayload} />;
    case "EMAIL_FLOW":
      return <EmailPreview p={payload as EmailPayload} />;
    case "PROMO_OFFER":
      return <PromoPreview p={payload as PromoPayload} />;
    case "REVIEW_RESPONSE":
      return <ReviewPreview p={payload as ReviewPayload} />;
    case "INTEL_REPORT":
      return <IntelPreview p={payload as IntelReportPayload} />;
    default:
      return null;
  }
}

function BlogPreview({ p }: { p: ContentPayload }) {
  const html = marked.parse(p.body || "", { async: false }) as string;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Target keyword" value={p.targetKeyword} />
        <Field label="Words" value={`~${p.estimatedWordCount}`} />
        <Field label="Slug" value={<code className="text-xs">/{p.slug}</code>} />
        <Field label="CMS" value={p.cmsTarget} />
      </div>
      <Card>
        <div className="prose-bcc" dangerouslySetInnerHTML={{ __html: html }} />
      </Card>
      <div className="rounded-lg bg-[var(--panel-2)] p-3 text-xs text-[var(--ink-2)]">
        <span className="font-semibold text-[var(--ink)]">SEO title:</span> {p.metaTitle}
        <br />
        <span className="font-semibold text-[var(--ink)]">Meta:</span> {p.metaDescription}
      </div>
    </div>
  );
}

function SocialPreview({ p }: { p: SocialPayload }) {
  const limit = SOCIAL_LIMITS[p.platform] ?? 1000;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-full bg-[var(--panel-2)] px-2 py-0.5 font-medium capitalize text-[var(--ink-2)]">
          {p.platform.replace("_", "/")}
        </span>
        <span>
          {new Date(p.scheduledFor).toLocaleString()} · <CharCount value={p.caption} limit={limit} />
        </span>
      </div>
      <Card>
        <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">{p.caption}</p>
        {p.hashtags?.length ? (
          <p className="mt-2 text-sm text-[var(--accent)]">
            {p.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
          </p>
        ) : null}
      </Card>
      {p.imagePrompt ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] p-3 text-xs text-[var(--ink-2)]">
          <span className="font-semibold text-[var(--ink)]">Image prompt:</span> {p.imagePrompt}
        </div>
      ) : null}
    </div>
  );
}

function AdPreview({ p }: { p: AdPayload }) {
  const isGoogle = p.platform === "google_search";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Platform" value={isGoogle ? "Google Search" : "Meta"} />
        <Field label="Suggested budget" value={`£${p.suggestedBudget}/day`} />
        <Field label="Campaign" value={p.campaignName} />
        <Field label="Ad group" value={p.adGroupName} />
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
          Headlines
        </p>
        <ul className="space-y-1">
          {p.headlines.map((h, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-[var(--panel-2)] px-3 py-1.5 text-sm"
            >
              <span>{h}</span>
              <CharCount value={h} limit={30} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
          Descriptions
        </p>
        <ul className="space-y-1">
          {p.descriptions.map((d, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-[var(--panel-2)] px-3 py-1.5 text-sm"
            >
              <span>{d}</span>
              <CharCount value={d} limit={90} />
            </li>
          ))}
        </ul>
      </div>
      {p.targetKeywords?.length ? (
        <Field
          label="Keywords"
          value={
            <span className="flex flex-wrap gap-1.5">
              {p.targetKeywords.map((k) => (
                <span key={k} className="rounded-md bg-[var(--panel-2)] px-2 py-0.5 text-xs">
                  {k}
                </span>
              ))}
            </span>
          }
        />
      ) : null}
      <Field label="Audience" value={p.audienceNotes} />
      <Field label="Landing page" value={<code className="text-xs">{p.landingPageUrl}</code>} />
      <div className="rounded-lg border-l-2 border-[var(--accent)] bg-[var(--panel-2)] p-3 text-sm text-[var(--ink-2)]">
        <span className="font-semibold text-[var(--ink)]">Why this ad: </span>
        {p.rationale}
      </div>
    </div>
  );
}

function EmailPreview({ p }: { p: EmailPayload }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Flow" value={p.flowType.replace(/_/g, " ")} />
        <Field label="ESP" value={p.espTarget} />
        <Field label="Send to" value={p.sendTo} />
        {p.scheduledFor ? (
          <Field label="Scheduled" value={new Date(p.scheduledFor).toLocaleString()} />
        ) : null}
      </div>
      <Card>
        <p className="text-sm font-semibold text-[var(--ink)]">{p.subject}</p>
        <p className="text-xs text-[var(--ink-3)]">{p.previewText}</p>
      </Card>
      <iframe
        title="Email preview"
        sandbox=""
        className="h-72 w-full rounded-xl border border-[var(--line)] bg-white"
        srcDoc={p.bodyHtml}
      />
    </div>
  );
}

function PromoPreview({ p }: { p: PromoPayload }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Offer" value={p.name} />
        <Field label="Type" value={`${p.type.replace(/_/g, " ")} · ${p.value}`} />
        <Field label="Code" value={p.code ? <code>{p.code}</code> : "—"} />
        <Field
          label="Window"
          value={`${new Date(p.startDate).toLocaleDateString()} → ${new Date(p.endDate).toLocaleDateString()}`}
        />
      </div>
      <Field label="Conditions" value={p.conditions} />
      <Card>
        <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">{p.landingPageCopy}</p>
      </Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Urgency" value={p.urgencyMechanic} />
        <Field label="Est. revenue impact" value={p.estimatedRevenueImpact} />
      </div>
      <div className="rounded-lg border-l-2 border-[var(--accent)] bg-[var(--panel-2)] p-3 text-sm text-[var(--ink-2)]">
        <span className="font-semibold text-[var(--ink)]">Why this promo: </span>
        {p.rationale}
      </div>
    </div>
  );
}

function ReviewPreview({ p }: { p: ReviewPayload }) {
  return (
    <div className="space-y-3">
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--ink)]">{p.reviewerName}</span>
          <span className="flex items-center gap-0.5 text-[var(--warn)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5"
                fill={i < p.reviewRating ? "currentColor" : "none"}
              />
            ))}
          </span>
        </div>
        <p className="text-sm text-[var(--ink-2)]">{p.reviewText}</p>
        <span className="mt-2 inline-block rounded-full bg-[var(--panel)] px-2 py-0.5 text-[11px] capitalize text-[var(--ink-3)]">
          {p.platform} · {p.sentiment}
          {p.flagged ? " · flagged" : ""}
        </span>
      </Card>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
          Suggested response
        </p>
        <Card>
          <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">{p.suggestedResponse}</p>
        </Card>
      </div>
    </div>
  );
}

function IntelPreview({ p }: { p: IntelReportPayload }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--line)] bg-gradient-to-br from-[var(--panel-2)] to-[var(--panel)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
          {p.periodLabel}
        </p>
        <p className="mt-1 text-base font-semibold text-[var(--ink)]">{p.headline}</p>
      </div>
      {p.sections.map((s, i) => (
        <div key={i}>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
            {s.heading}
          </p>
          <ul className="space-y-1.5">
            {s.bullets.map((b, j) => (
              <li key={j} className="flex gap-2 text-sm text-[var(--ink-2)]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--ink-3)]" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {p.recommendedActions?.length ? (
        <div className="rounded-xl border-l-2 border-[var(--accent)] bg-[var(--panel-2)] p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
            Recommended actions
          </p>
          <ul className="space-y-1">
            {p.recommendedActions.map((a, i) => (
              <li key={i} className="text-sm text-[var(--ink)]">
                → {a}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
