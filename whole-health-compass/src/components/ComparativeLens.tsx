import { Stethoscope, UserRound, ArrowRight, Clock, Scale, Handshake, Network, Route, BookOpen } from "lucide-react";
import type { Concern, TraditionMeta } from "@/data/types";
import { traditions, LENS_SECTIONS, CLOSING_LINE } from "@/data/concerns";
import { Card, type TabItem, Tabs } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Tints carry their own HSL so packs vary the tradition set with no theme
 *  changes. Soft = same hue at low alpha; matched lightness keeps them equal. */
function tintBg(tint: string) {
  return { background: `hsl(${tint})` };
}
function tintPill(tint: string) {
  return { backgroundColor: `hsl(${tint} / 0.13)`, color: `hsl(${tint})` };
}

function LensPanel({ concern, t }: { concern: Concern; t: TraditionMeta }) {
  const lens = concern.lenses[t.key];
  if (!lens) return null;
  return (
    <Card className="relative h-full overflow-hidden p-5">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={tintBg(t.tint)} />
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="font-serif text-lg leading-tight">{t.label}</h4>
        <span
          className="inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium"
          style={tintPill(t.tint)}
        >
          {t.short}
        </span>
      </div>
      <p className="mb-4 text-sm font-medium text-foreground/80">{lens.oneLiner}</p>

      <Section label={LENS_SECTIONS.worldview}>{lens.worldview}</Section>

      {lens.contributors && (
        <Section label={LENS_SECTIONS.contributors} icon={<Network className="h-3.5 w-3.5" />}>
          {lens.contributors}
        </Section>
      )}

      <Section label={LENS_SECTIONS.practitionerLooksAt} icon={<Stethoscope className="h-3.5 w-3.5" />}>
        {lens.practitionerLooksAt}
      </Section>

      {lens.approaches && (
        <Section label={LENS_SECTIONS.approaches} icon={<Route className="h-3.5 w-3.5" />}>
          {lens.approaches}
        </Section>
      )}

      <Section label={LENS_SECTIONS.whoYouSee} icon={<UserRound className="h-3.5 w-3.5" />}>
        {lens.whoYouSee}
      </Section>

      {t.whatToExpect && (
        <Section label={LENS_SECTIONS.whatToExpect} icon={<Clock className="h-3.5 w-3.5" />}>
          {t.whatToExpect}
        </Section>
      )}

      {t.evidenceAndRegulation && (
        <Section label={LENS_SECTIONS.evidenceAndRegulation} icon={<Scale className="h-3.5 w-3.5" />}>
          {t.evidenceAndRegulation}
        </Section>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>{CLOSING_LINE}</span>
      </div>
    </Card>
  );
}

function Section({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <div className="mb-1 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm leading-relaxed text-foreground/85">{children}</p>
    </div>
  );
}

/** What the traditions broadly agree on — the unifying bridge to a real
 *  conversation. Education only; never a remedy or instruction. */
function CommonGround({ points }: { points: string[] }) {
  return (
    <Card className="mt-4 p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Handshake className="h-5 w-5" />
        </span>
        <div>
          <h4 className="font-serif text-lg leading-none">Where the traditions broadly agree</h4>
          <p className="mt-1 text-sm text-muted-foreground">Common ground worth raising with whoever you see.</p>
        </div>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Desktop grid columns scale with the number of traditions a pack declares.
 *  Literal class strings so Tailwind's JIT keeps them. */
function gridCols(n: number) {
  if (n >= 4) return "md:grid-cols-2 lg:grid-cols-4";
  if (n === 2) return "md:grid-cols-2";
  return "md:grid-cols-3";
}

export function ComparativeLens({ concern, patientWords }: { concern: Concern; patientWords?: string }) {
  const phrase = patientWords?.trim() || concern.patientPhrase;
  const present = traditions.filter((t) => concern.lenses[t.key]);
  const tabItems: TabItem[] = present.map((t) => ({
    key: t.key,
    label: t.short,
    content: <LensPanel concern={concern} t={t} />,
  }));

  return (
    <div>
      <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
        {present.length} respectful {present.length === 1 ? "lens" : "lenses"} on{" "}
        <span className="font-medium text-foreground">“{phrase}”</span> — different ways of
        understanding, presented as equals. None is ranked above another, and none replaces a conversation with a
        qualified practitioner.
      </div>

      {/* Mobile: tabs (renders most reliably on a phone) */}
      <div className="md:hidden">
        <Tabs items={tabItems} ariaLabel="Compare medical traditions" />
      </div>

      {/* Desktop: equal columns, count driven by the pack */}
      <div className={cn("hidden gap-4 md:grid", gridCols(present.length))}>
        {present.map((t) => (
          <LensPanel key={t.key} concern={concern} t={t} />
        ))}
      </div>

      {concern.commonGround && concern.commonGround.length > 0 && (
        <CommonGround points={concern.commonGround} />
      )}

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          What each tradition links this to, and the approaches it draws on, is summarised from public sources such as
          the NHS, NICE and the US National Center for Complementary and Integrative Health (NCCIH), professional bodies,
          and each tradition's own descriptions — to explain how each tradition thinks, not whether an approach works.
        </span>
      </p>
    </div>
  );
}
