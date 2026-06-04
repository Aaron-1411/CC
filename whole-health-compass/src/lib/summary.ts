export type IntakeData = {
  concernId: string;
  concernLabel: string;
  patientWords: string;
  duration: string;
  betterWorse: string;
  tried: string;
  taking: string;
  goal: string;
};

export const emptyIntake: IntakeData = {
  concernId: "",
  concernLabel: "",
  patientWords: "",
  duration: "",
  betterWorse: "",
  tried: "",
  taking: "",
  goal: "",
};

export type SummaryRow = { label: string; value: string };

export function summaryRows(d: IntakeData): SummaryRow[] {
  return [
    { label: "Main concern", value: d.patientWords || d.concernLabel },
    { label: "How long it's been going on", value: d.duration },
    { label: "What makes it better or worse", value: d.betterWorse },
    { label: "What they've already tried", value: d.tried },
    { label: "Current medicines / supplements", value: d.taking },
    { label: "What they're hoping to get from the visit", value: d.goal },
  ].filter((r) => r.value && r.value.trim().length > 0);
}

export function buildSummaryText(d: IntakeData, clinicName: string): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const lines = [
    "PRE-CONSULTATION SUMMARY",
    `Prepared with ${clinicName} · ${date}`,
    "To share with your practitioner",
    "",
    ...summaryRows(d).map((r) => `${r.label}:\n${r.value}\n`),
    "—",
    "This summary is general education to support your consultation. It is not medical advice, diagnosis or treatment.",
  ];
  return lines.join("\n");
}

export function hasTaking(d: IntakeData): boolean {
  return Boolean(d.taking && d.taking.trim().length > 0);
}
