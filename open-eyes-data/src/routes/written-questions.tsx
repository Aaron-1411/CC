import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActionBar,
  Card,
  ContextBlock,
  DataProvenance,
  ErrorNote,
  FlagPill,
  LiveBadge,
  SectionHeader,
  Skeleton,
  Stat,
} from "@/components/primitives";
import { fmtNumber, getJSON } from "@/lib/api";

export const Route = createFileRoute("/written-questions")({
  head: () => ({
    meta: [
      { title: "Written Questions — transparenC" },
      {
        name: "description",
        content:
          "Do government departments answer MPs' and peers' written questions on time? A closed cohort of UK Parliament written questions, scored on whether each department met its answering deadline — on-time rate, lateness and average days to answer, by department.",
      },
      { property: "og:title", content: "Written Questions — transparenC" },
    ],
  }),
  component: WrittenQuestionsPage,
});

type Dept = {
  name: string;
  tabled: number;
  answered: number;
  unanswered: number;
  late: number;
  onTime: number;
  holding: number;
  lateRate: number;
  answeredRate: number;
  avgDays: number;
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
type WrittenQResp = {
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

type SortKey = "late" | "volume" | "speed";

function fmtDay(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Lateness reads as a red flag; a clean record reads green. The amber middle
// keeps "a bit late" visually distinct from "consistently late".
function lateVariant(rate: number): "ok" | "open" | "warn" | "direct" {
  if (rate <= 2) return "ok";
  if (rate <= 10) return "open";
  if (rate <= 25) return "warn";
  return "direct";
}

function WrittenQuestionsPage() {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("late");

  const q = useQuery({
    queryKey: ["written-questions"],
    queryFn: () => getJSON<WrittenQResp>("/api/written-questions"),
    staleTime: 30 * 60_000,
  });

  const d = q.data?.data;
  const departments = d?.departments ?? [];

  const displayed = useMemo(() => {
    let list = departments;
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter((x) => x.name.toLowerCase().includes(f));
    }
    return [...list].sort((a, b) => {
      if (sort === "late") return b.lateRate - a.lateRate;
      if (sort === "volume") return b.tabled - a.tabled;
      return a.avgDays - b.avgDays;
    });
  }, [departments, filter, sort]);

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Parliament"
          title="Do ministers answer MPs on time?"
          right={<LiveBadge timestamp={q.data?.meta.fetchedAt} />}
        />
        <p className="text-muted-foreground max-w-2xl">
          When an MP or peer tables a written question, the relevant government department is
          expected to answer by a deadline. This tracks a settled batch of questions from{" "}
          {d ? `${fmtDay(d.cohortFrom)} – ${fmtDay(d.cohortTo)}` : "about a month ago"} — old enough
          that nearly all have been answered — and scores each department on whether it hit that
          deadline.
        </p>
      </div>

      {!q.isLoading && !q.error && (
        <ContextBlock heading="Why a month-old sample, not the latest questions" variant="warn">
          <p>
            Departments are meant to answer ordinary written questions within a working week, and{" "}
            <strong className="text-foreground">"named day"</strong> questions by a specific date the
            MP names. A <strong className="text-foreground">holding answer</strong> — "I will reply
            shortly" — stops the clock politically but is counted here as answered.
          </p>
          <p>
            We deliberately sample questions tabled around a month ago rather than the newest ones.
            By then almost every question has a reply, so the on-time rate is honest. Sampling the
            most recent questions would quietly leave out the slow answers that haven't come back
            yet — flattering exactly the departments that are running late.
          </p>
        </ContextBlock>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Answered on time"
          value={d ? `${d.onTimePerc}%` : "—"}
          hint={d ? `of ${fmtNumber(d.answeredCount)} answered` : undefined}
          accent="ok"
          loading={q.isLoading}
          shareable={!!d}
          shareText={`UK government departments answered ${d?.onTimePerc}% of MPs' written questions on time in the latest settled batch (UK Parliament data)`}
        />
        <Stat
          label="Answered late"
          value={d ? `${d.latePerc}%` : "—"}
          hint={d ? `${fmtNumber(d.lateCount)} missed the deadline` : undefined}
          accent="flag"
          loading={q.isLoading}
        />
        <Stat
          label="Avg days to answer"
          value={d ? fmtNumber(d.avgDays) : "—"}
          hint="tabled → answered"
          accent="amber"
          loading={q.isLoading}
        />
        <Stat
          label="Still unanswered"
          value={d ? `${d.unansweredPerc}%` : "—"}
          hint={d ? `${fmtNumber(d.unansweredCount)} of ${fmtNumber(d.sampleSize)} a month on` : undefined}
          accent={d && d.unansweredPerc > 5 ? "flag" : "amber"}
          loading={q.isLoading}
        />
      </div>

      {q.error && <ErrorNote>{(q.error as Error).message}</ErrorNote>}

      {q.isLoading && (
        <Card>
          <Skeleton className="h-4 w-1/3 mb-3" />
          <Skeleton className="h-5 w-full mb-3" />
          <Skeleton className="h-3 w-2/3" />
        </Card>
      )}

      {/* Slowest vs fastest departments */}
      {d && d.slowest.length > 0 && d.fastest.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <FlagPill variant="direct">Most often late</FlagPill>
            </div>
            <ul className="space-y-2">
              {d.slowest.map((x) => (
                <li key={x.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground leading-snug">{x.name}</span>
                  <span className="label-mono text-flag shrink-0">{x.lateRate}% late</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <FlagPill variant="ok">Most reliable</FlagPill>
            </div>
            <ul className="space-y-2">
              {d.fastest.map((x) => (
                <li key={x.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground leading-snug">{x.name}</span>
                  <span className="label-mono text-ok shrink-0">{x.lateRate}% late</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Department league table */}
      {d && (
        <>
          <Card>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by department…"
                className="flex-1 min-w-[240px] bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
              />
              <div className="flex gap-1 label-mono text-xs">
                {(["late", "volume", "speed"] as SortKey[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-3 py-2 rounded uppercase tracking-wider ${
                      sort === s
                        ? "bg-amber text-amber-foreground"
                        : "bg-surface-2 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground label-mono mt-3">
              Departments with at least 20 questions in the sample. Sorted by{" "}
              {sort === "late" ? "late rate" : sort === "volume" ? "questions tabled" : "speed"}.
            </p>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {displayed.map((x) => (
              <DeptRow key={x.name} d={x} />
            ))}
            {displayed.length === 0 && (
              <div className="text-muted-foreground text-sm py-12 text-center sm:col-span-2">
                No departments match that filter.
              </div>
            )}
          </div>
        </>
      )}

      {/* Most overdue answers */}
      {d && d.overdue.length > 0 && (
        <Card>
          <h3 className="font-display text-lg font-semibold mb-1">Answered furthest past deadline</h3>
          <p className="text-xs text-muted-foreground mb-3 label-mono">
            Questions that did get a reply, but well after the date due
          </p>
          <ul className="divide-y divide-border">
            {d.overdue.map((o) => (
              <li key={o.uin || o.heading} className="py-2.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm text-foreground leading-snug">{o.heading}</div>
                  <div className="text-[11px] text-muted-foreground label-mono mt-0.5">
                    {o.department} · tabled {fmtDay(o.dateTabled)} · answered {fmtDay(o.dateAnswered)}
                  </div>
                </div>
                <span className="label-mono text-xs text-flag shrink-0 text-right">
                  {o.daysLate}d late
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Still waiting */}
      {d && d.stillWaiting.length > 0 && (
        <Card>
          <h3 className="font-display text-lg font-semibold mb-1">Still unanswered</h3>
          <p className="text-xs text-muted-foreground mb-3 label-mono">
            Questions from this batch that had no reply when we last checked
          </p>
          <ul className="divide-y divide-border">
            {d.stillWaiting.map((w) => (
              <li key={w.uin || w.heading} className="py-2.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm text-foreground leading-snug">{w.heading}</div>
                  <div className="text-[11px] text-muted-foreground label-mono mt-0.5">
                    {w.department} · tabled {fmtDay(w.dateTabled)}
                  </div>
                </div>
                <span className="label-mono text-xs text-amber shrink-0 text-right">
                  {w.daysWaiting}d waiting
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ActionBar
        mpTopic="how quickly government departments answer written parliamentary questions"
        shareText="See which UK government departments answer MPs' written questions on time — and which run late"
        letterTemplate={`Dear [MP Name],

I am writing as a constituent about the timeliness of answers to written parliamentary questions.

Written questions are one of the main ways MPs hold the Government to account on behalf of constituents. Departments are expected to answer within the conventional deadline — and by a firm date for "named day" questions — yet some routinely answer late or rely on holding replies.

I would be grateful to know:
1. How many of your own written questions in the past year were answered late?
2. Will you press departments that consistently miss the deadline to improve?
3. Do you support stronger reporting on departmental answering performance so voters can see it?

Thank you for your work holding the Government to account.

Yours sincerely,
[Your name]
[Your address]`}
      />

      <DataProvenance
        source="UK Parliament — Written Questions API"
        url="https://questions-statements.parliament.uk/"
        licence="Open Parliament Licence v3.0"
        fetchedAt={q.data?.meta.fetchedAt}
      />
    </div>
  );
}

function DeptRow({ d }: { d: Dept }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <FlagPill variant={lateVariant(d.lateRate)}>{d.lateRate}% late</FlagPill>
            {d.holding > 0 && <FlagPill variant="neutral">{d.holding} holding</FlagPill>}
          </div>
          <h3 className="font-display text-base font-semibold leading-snug">{d.name}</h3>
          <div className="text-xs text-muted-foreground mt-1 label-mono">
            {fmtNumber(d.tabled)} tabled · {d.answeredRate}% answered
            {d.unanswered > 0 ? ` · ${d.unanswered} pending` : ""}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl font-bold">{fmtNumber(d.avgDays)}</div>
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            avg days
          </div>
        </div>
      </div>
    </Card>
  );
}
