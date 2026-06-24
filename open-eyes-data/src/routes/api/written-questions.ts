import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cachedTimed, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

// UK Parliament — Written Questions API. Keyless, Open Parliament Licence.
// MPs and peers table written questions; the relevant government department is
// expected to answer within a deadline (`dateForAnswer`) — for "named day"
// questions that is a firm date, otherwise it is the conventional working-week
// target. This route measures whether departments meet that deadline.
//
// Method: we sample a CLOSED cohort of questions tabled ~30–35 days ago. By
// that lag almost every question has been answered, so the cohort is near
// complete and the on-time rate is unbiased (unlike sampling "most recent",
// which would silently exclude the slow answers that aren't back yet).
const BASE = "https://questions-statements-api.parliament.uk/api/writtenquestions/questions";

type RawQuestion = {
  value: {
    id: number;
    dateTabled?: string | null;
    dateForAnswer?: string | null;
    dateAnswered?: string | null;
    answeringBodyName?: string | null;
    isNamedDay?: boolean;
    answerIsHolding?: boolean;
    isWithdrawn?: boolean;
    heading?: string | null;
    uin?: string | null;
  };
};
type ApiResp = { totalResults: number; results: RawQuestion[] };

type Dept = {
  name: string;
  tabled: number;
  answered: number;
  unanswered: number;
  late: number;
  onTime: number;
  holding: number;
  lateRate: number; // % of answered that missed the deadline
  answeredRate: number; // % of tabled that have been answered
  avgDays: number; // mean calendar days tabled → answered
};

type Overdue = {
  heading: string;
  department: string;
  daysLate: number;
  dateTabled: string;
  dateAnswered: string;
  uin: string;
};
type Waiting = {
  heading: string;
  department: string;
  daysWaiting: number;
  dateTabled: string;
  uin: string;
};

type WrittenQResponse = {
  cohortFrom: string;
  cohortTo: string;
  sampleSize: number;
  answeredCount: number;
  unansweredCount: number;
  lateCount: number;
  onTimeCount: number;
  holdingCount: number;
  answeredPerc: number;
  onTimePerc: number;
  latePerc: number;
  unansweredPerc: number;
  avgDays: number;
  departments: Dept[];
  slowest: Dept[];
  fastest: Dept[];
  overdue: Overdue[];
  stillWaiting: Waiting[];
  updatedAt: string;
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function pct(part: number, whole: number): number {
  return whole > 0 ? round1((part / whole) * 100) : 0;
}

async function getPage(from: string, to: string, skip: number): Promise<ApiResp> {
  const url = `${BASE}?tabledWhenFrom=${from}&tabledWhenTo=${to}&take=1000&skip=${skip}`;
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Written Questions API returned ${r.status}`);
  return (await r.json()) as ApiResp;
}

async function fetchWrittenQuestions(): Promise<WrittenQResponse> {
  const now = Date.now();
  const cohortTo = isoDay(new Date(now - 30 * 86_400_000));
  const cohortFrom = isoDay(new Date(now - 35 * 86_400_000));

  const first = await getPage(cohortFrom, cohortTo, 0);
  const total = first.totalResults ?? 0;
  // Hard page cap keeps a runaway window from hammering the source.
  const pages = Math.min(Math.ceil(total / 1000), 4);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => getPage(cohortFrom, cohortTo, (i + 1) * 1000)),
  );
  const rows = [first, ...rest].flatMap((p) => p.results ?? []).map((q) => q.value);

  const byDept = new Map<string, Dept>();
  const overdue: Overdue[] = [];
  const stillWaiting: Waiting[] = [];
  let answeredCount = 0;
  let lateCount = 0;
  let onTimeCount = 0;
  let holdingCount = 0;
  let daysSum = 0;
  let sampleSize = 0;

  for (const q of rows) {
    if (q.isWithdrawn) continue;
    const tabled = q.dateTabled;
    if (!tabled) continue;
    sampleSize++;
    const dept = q.answeringBodyName?.trim() || "Unknown";
    const d =
      byDept.get(dept) ??
      ({
        name: dept,
        tabled: 0,
        answered: 0,
        unanswered: 0,
        late: 0,
        onTime: 0,
        holding: 0,
        lateRate: 0,
        answeredRate: 0,
        avgDays: 0,
      } satisfies Dept);
    d.tabled++;

    if (q.dateAnswered) {
      answeredCount++;
      d.answered++;
      const days = daysBetween(tabled, q.dateAnswered);
      daysSum += days;
      d.avgDays += days;
      if (q.answerIsHolding) {
        holdingCount++;
        d.holding++;
      }
      const due = q.dateForAnswer;
      const late = due ? Date.parse(q.dateAnswered) > Date.parse(due) : false;
      if (late) {
        lateCount++;
        d.late++;
        if (due) {
          overdue.push({
            heading: q.heading?.trim() || "Untitled question",
            department: dept,
            daysLate: daysBetween(due, q.dateAnswered),
            dateTabled: tabled,
            dateAnswered: q.dateAnswered,
            uin: q.uin ?? "",
          });
        }
      } else {
        onTimeCount++;
        d.onTime++;
      }
    } else {
      d.unanswered++;
      stillWaiting.push({
        heading: q.heading?.trim() || "Untitled question",
        department: dept,
        daysWaiting: daysBetween(tabled, isoDay(new Date(now))),
        dateTabled: tabled,
        uin: q.uin ?? "",
      });
    }
    byDept.set(dept, d);
  }

  const departments = [...byDept.values()]
    .map((d) => ({
      ...d,
      avgDays: d.answered ? round1(d.avgDays / d.answered) : 0,
      lateRate: pct(d.late, d.answered),
      answeredRate: pct(d.answered, d.tabled),
    }))
    .filter((d) => d.tabled >= 20 && d.name !== "Unknown")
    .sort((a, b) => b.lateRate - a.lateRate);

  const slowest = departments.slice(0, 5);
  const fastest = [...departments].sort((a, b) => a.lateRate - b.lateRate).slice(0, 5);
  overdue.sort((a, b) => b.daysLate - a.daysLate);
  stillWaiting.sort((a, b) => b.daysWaiting - a.daysWaiting);

  const unansweredCount = sampleSize - answeredCount;

  return {
    cohortFrom,
    cohortTo,
    sampleSize,
    answeredCount,
    unansweredCount,
    lateCount,
    onTimeCount,
    holdingCount,
    answeredPerc: pct(answeredCount, sampleSize),
    onTimePerc: pct(onTimeCount, answeredCount),
    latePerc: pct(lateCount, answeredCount),
    unansweredPerc: pct(unansweredCount, sampleSize),
    avgDays: answeredCount ? round1(daysSum / answeredCount) : 0,
    departments,
    slowest,
    fastest,
    overdue: overdue.slice(0, 8),
    stillWaiting: stillWaiting.slice(0, 8),
    updatedAt: new Date().toISOString(),
  };
}

export const Route = createFileRoute("/api/written-questions")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Closed cohort moves only once a day → a 6-hour cache is plenty and
          // keeps us polite to the Parliament endpoint.
          const { value, fetchedAt } = await cachedTimed(
            "written-questions:v1",
            6 * 60 * 60_000,
            fetchWrittenQuestions,
          );
          return jsonResponse(
            envelope(
              value,
              "UK Parliament — Written Questions API",
              "https://questions-statements.parliament.uk/",
              "Open Parliament Licence v3.0",
              fetchedAt,
            ),
          );
        } catch (e) {
          return errorResponse(`Written questions data fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
