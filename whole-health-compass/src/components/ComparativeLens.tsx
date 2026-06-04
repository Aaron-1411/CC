import { Stethoscope, UserRound, ArrowRight } from "lucide-react";
import type { Concern, TraditionMeta } from "@/data/types";
import { traditions, LENS_SECTIONS, CLOSING_LINE } from "@/data/concerns";
import { Card, Pill, Tabs, type TabItem } from "@/components/ui";
import { cn } from "@/lib/cn";

function LensPanel({ concern, t }: { concern: Concern; t: TraditionMeta }) {
  const lens = concern.lenses[t.key];
  const topBorder: Record<string, string> = {
    west: "before:bg-west",
    tcm: "before:bg-tcm",
    ayur: "before:bg-ayur",
  };
  return (
    <Card
      className={cn(
        "relative h-full overflow-hidden p-5 before:absolute before:inset-x-0 before:top-0 before:h-1",
        topBorder[t.tint],
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="font-serif text-lg leading-tight">{t.label}</h4>
        <Pill tint={t.tint}>{t.short}</Pill>
      </div>
      <p className="mb-4 text-sm font-medium text-foreground/80">{lens.oneLiner}</p>

      <Section label={LENS_SECTIONS.worldview}>{lens.worldview}</Section>

      <Section label={LENS_SECTIONS.practitionerLooksAt} icon={<Stethoscope className="h-3.5 w-3.5" />}>
        {lens.practitionerLooksAt}
      </Section>

      <Section label={LENS_SECTIONS.whoYouSee} icon={<UserRound className="h-3.5 w-3.5" />}>
        {lens.whoYouSee}
      </Section>

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

export function ComparativeLens({ concern, patientWords }: { concern: Concern; patientWords?: string }) {
  const phrase = patientWords?.trim() || concern.patientPhrase;
  const tabItems: TabItem[] = traditions.map((t) => ({
    key: t.key,
    label: t.short,
    content: <LensPanel concern={concern} t={t} />,
  }));

  return (
    <div>
      <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
        Three respectful lenses on{" "}
        <span className="font-medium text-foreground">“{phrase}”</span> — different ways of
        understanding, presented as equals. None is ranked above another, and none replaces a conversation with a
        qualified practitioner.
      </div>

      {/* Mobile: tabs (renders most reliably on a phone) */}
      <div className="md:hidden">
        <Tabs items={tabItems} ariaLabel="Compare medical traditions" />
      </div>

      {/* Desktop: three equal columns */}
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {traditions.map((t) => (
          <LensPanel key={t.key} concern={concern} t={t} />
        ))}
      </div>
    </div>
  );
}
