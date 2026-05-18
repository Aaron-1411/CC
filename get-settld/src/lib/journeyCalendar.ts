// Generates an iCalendar (.ics) file from the user's journey checklist so
// they can drop key milestones into Google Calendar / Apple Calendar / Outlook.
// Steps with a saved completion date become past events; pending steps get a
// suggested due-date based on a target completion anchor.
import type { JourneyPhase, JourneyStep } from "@/data/journey";

function pad(n: number) { return String(n).padStart(2, "0"); }
function toICSDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function escapeICS(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

interface Options {
  phases: JourneyPhase[];
  done: Set<string>;
  dates: Record<string, string>;
  /** Target completion date — pending steps are spaced backwards from here. */
  targetDate?: Date;
}

export function buildJourneyICS({ phases, done, dates, targetDate }: Options): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//First-Time Buyer Toolkit//Journey//EN",
    "CALSCALE:GREGORIAN",
  ];

  // Flatten and assign suggested due-dates for pending steps.
  const allSteps: { phase: string; step: JourneyStep; idx: number; total: number }[] = [];
  phases.forEach((p) => p.steps.forEach((s, idx) => allSteps.push({ phase: p.name, step: s, idx, total: p.steps.length })));

  const target = targetDate ?? new Date(Date.now() + 22 * 7 * 24 * 60 * 60 * 1000); // ~22 weeks
  const totalCount = allSteps.length;

  allSteps.forEach((entry, i) => {
    const { step, phase } = entry;
    const isDone = done.has(step.id);
    let when: Date;
    if (isDone && dates[step.id]) {
      when = new Date(dates[step.id]);
    } else {
      // Linearly distribute pending steps from now → target
      const ratio = (i + 1) / totalCount;
      when = new Date(now.getTime() + (target.getTime() - now.getTime()) * ratio);
    }
    if (Number.isNaN(when.getTime())) return;

    const end = new Date(when.getTime() + 60 * 60 * 1000); // 1h block
    lines.push(
      "BEGIN:VEVENT",
      `UID:${step.id}@ftb-toolkit`,
      `DTSTAMP:${toICSDate(now)}`,
      `DTSTART:${toICSDate(when)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${escapeICS(`[${phase}] ${step.label}${isDone ? " ✓" : ""}`)}`,
      `DESCRIPTION:${escapeICS(step.detail + (step.docs?.length ? `\n\nDocs: ${step.docs.join(", ")}` : ""))}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(filename: string, ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
