/* ────────────────────────────────────────────────────────────────────────────
   RED-FLAG INTERRUPT  —  the patient-facing surface for the safety screen.

   Renders ABOVE the rest of a result page when free-text intake matches a danger
   pattern (see src/lib/redflags.ts). It is the one place the app ever says
   "please contact someone now" — and it only ever points to a real, named, UK
   service (999 / NHS 111 / Samaritans / Shout, from src/data/crisis.ts).

   Compliance guarantees, by construction:
   • Never a diagnosis. The preamble says so explicitly, and no rule names a cause
     or condition — only the symptom and who to contact.
   • Never a remedy. The only actions are tel:/sms: links to official services.
   • Non-blocking. It surfaces help; it never gates the page or the journey.
   ──────────────────────────────────────────────────────────────────────────── */

import { useEffect } from "react";
import { Phone, Heart, Clock, MessageSquare, ArrowUpRight } from "lucide-react";
import type { CrisisResource } from "@/data/crisis";
import type { RedFlagAction, RedFlagRule } from "@/lib/redflags";
import { SEVERITY } from "@/lib/redflags";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

type Tone = "emergency" | "supportive" | "caution";

/** Per-action header copy, icon and tone. The `lead` is the calm, action-first
 *  line; the per-rule `message` (the "why") renders beneath it. */
const ACTION_UI: Record<RedFlagAction, { title: string; tone: Tone; icon: typeof Phone; lead: string }> = {
  emergency_999: {
    title: "This may need urgent help",
    tone: "emergency",
    icon: Phone,
    lead: "Some of what you described can occasionally be serious. If it's severe, sudden, or getting worse, don't wait — call 999 now.",
  },
  crisis_line: {
    title: "You don't have to face this alone",
    tone: "supportive",
    icon: Heart,
    lead: "If you're struggling to cope or having thoughts of harming yourself, please reach out now — people are ready to listen, any time.",
  },
  urgent_111: {
    title: "Worth getting checked promptly",
    tone: "caution",
    icon: Phone,
    lead: "Some of what you mentioned is worth a same-day check. NHS 111 can tell you exactly what to do next.",
  },
  same_day_gp: {
    title: "Worth contacting your GP today",
    tone: "caution",
    icon: Clock,
    lead: "It's worth speaking to your GP today about this.",
  },
};

const TONE: Record<Tone, { card: string; header: string; iconWrap: string; row: string }> = {
  emergency: {
    card: "border-warning/40",
    header: "border-warning/25 bg-warning-soft",
    iconWrap: "bg-warning/15 text-warning-foreground",
    row: "border-warning/30 bg-warning-soft/60 hover:bg-warning-soft",
  },
  supportive: {
    card: "border-primary/25",
    header: "border-primary/20 bg-primary-soft/70",
    iconWrap: "bg-primary-soft text-primary",
    row: "border-primary/20 bg-primary-soft/40 hover:bg-primary-soft/70",
  },
  caution: {
    card: "border-warning/30",
    header: "border-warning/20 bg-warning-soft/70",
    iconWrap: "bg-warning/12 text-warning-foreground",
    row: "border-warning/25 bg-warning-soft/50 hover:bg-warning-soft",
  },
};

const ACTION_ORDER = (Object.keys(SEVERITY) as RedFlagAction[]).sort((a, b) => SEVERITY[a] - SEVERITY[b]);

/** Union the resources across a group's rules, de-duped by id, first-seen order
 *  preserved (rules list their most-relevant service first). */
function unionResources(rules: RedFlagRule[]): CrisisResource[] {
  const seen = new Set<string>();
  const out: CrisisResource[] = [];
  for (const rule of rules) {
    for (const r of rule.resources) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
  }
  return out;
}

function ResourceRow({ resource, tone, onTap }: { resource: CrisisResource; tone: Tone; onTap: () => void }) {
  const ChannelIcon = resource.channel === "text" ? MessageSquare : Phone;
  return (
    <a
      href={resource.href}
      onClick={onTap}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        TONE[tone].row,
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONE[tone].iconWrap)}>
          <ChannelIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1 font-semibold text-foreground">
            {resource.label}
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </span>
          <span className="block truncate text-xs text-muted-foreground">{resource.detail}</span>
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-semibold tabular-nums text-foreground">{resource.contact}</span>
        <span className="block text-[11px] text-muted-foreground">{resource.availability}</span>
      </span>
    </a>
  );
}

export function RedFlagInterrupt({ rules }: { rules: RedFlagRule[] }) {
  // Fire once per distinct matched set (ids only — never the patient's words).
  const idKey = rules.map((r) => r.id).join(",");
  useEffect(() => {
    if (!idKey) return;
    track("redflag_interrupt_view", { meta: { ids: idKey.split(",") } });
  }, [idKey]);

  if (rules.length === 0) return null;

  const groups = ACTION_ORDER.map((action) => ({ action, items: rules.filter((r) => r.action === action) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <section aria-label="Important safety information" className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        <strong className="font-semibold text-foreground">This isn't a diagnosis</strong> — it's a prompt to speak to a
        real person who can help. Based on what you shared, please take a moment for the following.
      </p>

      {groups.map(({ action, items }) => {
        const ui = ACTION_UI[action];
        const HeaderIcon = ui.icon;
        const resources = unionResources(items);
        // De-dupe identical messages (e.g. several universal rules sharing copy).
        const messages = Array.from(new Set(items.map((r) => r.message)));
        return (
          <div key={action} className={cn("overflow-hidden rounded-xl border bg-card shadow-soft", TONE[ui.tone].card)}>
            <div className={cn("flex items-center gap-2.5 border-b px-5 py-3.5", TONE[ui.tone].header)}>
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", TONE[ui.tone].iconWrap)}>
                <HeaderIcon className="h-5 w-5" />
              </span>
              <h3 className="font-serif text-lg leading-tight text-foreground">{ui.title}</h3>
            </div>

            <div className="space-y-4 px-5 py-4">
              <p className="text-sm font-medium leading-relaxed text-foreground/90">{ui.lead}</p>

              {messages.length > 0 && (
                <ul className="space-y-2">
                  {messages.map((m, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2">
                {resources.map((resource) => (
                  <ResourceRow
                    key={resource.id}
                    resource={resource}
                    tone={ui.tone}
                    onTap={() => track("redflag_resource_tap", { meta: { resourceId: resource.id, action } })}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
