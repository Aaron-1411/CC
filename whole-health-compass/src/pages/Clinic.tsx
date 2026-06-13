import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Lock, LogOut, RefreshCw, Inbox, BarChart3, Mail, Phone, ShieldCheck, AlertTriangle,
  TrendingUp, Users, Target, Clock, FileText,
} from "lucide-react";
import { Card, Eyebrow, Button, Input, Label, Pill, Callout, buttonClasses } from "@/components/ui";
import { clinicConfig } from "@/config/clinic";

const TOKEN_KEY = "whc_admin_token";

type FunnelStep = { key: string; label: string; count: number };
type Impact = {
  uniqueVisitors: number;
  enquiries: number;
  preparedEnquiries: number;
  enquiryRatePct: number;
  preparednessPct: number;
  avgMinutesToEnquiry: number | null;
  convertingSessions: number;
  trend: { last30: number; prev30: number };
};
type Stats = {
  ok: boolean;
  storage: boolean;
  totals: { events: number; leads: number };
  funnel: FunnelStep[];
  byConcern: { concernId: string; count: number }[];
  impact: Impact;
};

type Lead = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  concernLabel?: string;
  includeSummary?: boolean;
  consentVersion?: string;
  consentedAt?: string;
  when: number | string;
};

// Normalise a server row (snake_case). Leads are read only from authenticated
// server storage — never from the browser — so health data never lingers client-side.
function normalizeLead(r: Record<string, unknown>): Lead {
  return {
    id: (r.id as string) || undefined,
    name: (r.name as string) || "—",
    email: (r.email as string) || "",
    phone: (r.phone as string) || "",
    message: (r.message as string) || "",
    concernLabel: (r.concern_label as string) || (r.concernLabel as string) || "",
    includeSummary: r.include_summary === 1 || r.includeSummary === true,
    consentVersion: (r.consent_version as string) || (r.consentVersion as string) || "",
    consentedAt: (r.consented_at as string) || (r.submittedAt as string) || "",
    when: (r.ts as number) || (r.submittedAt as string) || Date.now(),
  };
}

function fmtWhen(w: number | string): string {
  const d = new Date(w);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-GB");
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** A single outcome metric tile for the impact report. */
function StatTile({ icon, value, label, sub, tone }: {
  icon: ReactNode;
  value: string;
  label: string;
  sub?: string;
  tone?: "primary" | "foreground";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={"mt-2 font-serif text-3xl tabular-nums " + (tone === "primary" ? "text-primary" : "text-foreground")}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

export function Clinic() {
  const [token, setToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  });
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  async function load(tok: string) {
    setLoading(true);
    setError("");
    setNotConfigured(false);
    try {
      const headers = { Authorization: `Bearer ${tok}` };
      const [statsRes, leadsRes] = await Promise.all([
        fetch(`/api/admin/stats?clinicId=${encodeURIComponent(clinicConfig.clinicId)}`, { headers }),
        fetch(`/api/admin/leads?clinicId=${encodeURIComponent(clinicConfig.clinicId)}`, { headers }),
      ]);

      if (statsRes.status === 401 || leadsRes.status === 401) {
        setAuthed(false);
        setError("That token wasn't accepted. Check it and try again.");
        try {
          sessionStorage.removeItem(TOKEN_KEY);
        } catch {
          /* ignore */
        }
        return;
      }

      // ADMIN_TOKEN isn't set server-side → the server can't verify any token.
      // Fail CLOSED: never grant access (and never read browser-stored health
      // data) just because auth is unconfigured.
      if (statsRes.status === 503 || leadsRes.status === 503) {
        setAuthed(false);
        setError("This dashboard isn't switched on yet. Set an ADMIN_TOKEN secret (and bind a D1 database) on the deployment — see ACTIVATION.md.");
        try {
          sessionStorage.removeItem(TOKEN_KEY);
        } catch {
          /* ignore */
        }
        return;
      }

      if (!statsRes.ok || !leadsRes.ok) {
        setAuthed(false);
        setError("Couldn't reach the dashboard service. Please try again in a moment.");
        return;
      }

      const statsJson = (await statsRes.json()) as Stats;
      const leadsJson = (await leadsRes.json()) as { storage: boolean; leads: Record<string, unknown>[] };

      // A 200 means the server verified the bearer token. Leads come ONLY from
      // authenticated server storage — never the browser.
      setAuthed(true);
      setStats(statsJson);
      setLeads((leadsJson.leads || []).map(normalizeLead));
      // Authenticated but D1 may be unbound: honest empty state, not invented data.
      setNotConfigured(!(leadsJson.storage && statsJson.storage));
    } catch {
      // Network error / backend unreachable — fail CLOSED, do not authenticate.
      setAuthed(false);
      setError("Couldn't reach the dashboard service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) void load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = (e: FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    try {
      sessionStorage.setItem(TOKEN_KEY, token.trim());
    } catch {
      /* ignore */
    }
    void load(token.trim());
  };

  const signOut = () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken("");
    setAuthed(false);
    setStats(null);
    setLeads([]);
  };

  if (!authed) {
    return (
      <div className="bg-paper">
        <section className="container flex min-h-[60vh] items-center justify-center py-16">
          <Card className="w-full max-w-sm p-6 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Lock className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-serif text-2xl">Clinic dashboard</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your access token to see enquiries and how your front door is performing.
            </p>
            <form onSubmit={signIn} className="mt-5 space-y-4">
              <div>
                <Label htmlFor="tok">Access token</Label>
                <Input id="tok" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="••••••••••••" autoComplete="off" />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Checking…" : "View dashboard"}
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              The token is the <code className="rounded bg-muted px-1">ADMIN_TOKEN</code> set on your deployment.
            </p>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-paper">
      <section className="container py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{clinicConfig.name}</Eyebrow>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => load(token)} disabled={loading}>
              <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>

        {notConfigured && (
          <Callout tone="warning" icon={<AlertTriangle className="h-5 w-5" />} title="Central storage isn't switched on yet" className="mt-6">
            You're signed in, but no <code className="rounded bg-muted px-1">D1</code> database is bound, so enquiries
            aren't stored centrally and funnel analytics stay empty. Bind a D1 database on the Pages project to store
            enquiries and unlock live stats. See <span className="font-medium">ACTIVATION.md</span>.
          </Callout>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" /> <span className="text-sm font-medium">Conversion funnel</span>
            </div>
            {stats && stats.storage ? (
              <ul className="mt-4 space-y-3">
                {stats.funnel.map((step) => {
                  const top = stats.funnel[0]?.count || 0;
                  const pct = top > 0 ? Math.round((step.count / top) * 100) : 0;
                  return (
                    <li key={step.key}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-foreground/90">{step.label}</span>
                        <span className="tabular-nums font-medium">{step.count}{top > 0 && <span className="ml-1 text-xs text-muted-foreground">({pct}%)</span>}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Live funnel analytics appear here once a D1 database is bound.</p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Inbox className="h-4 w-4" /> <span className="text-sm font-medium">At a glance</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="font-serif text-4xl text-primary">{leads.length}</div>
                <div className="text-sm text-muted-foreground">Enquiries shown</div>
              </div>
              <div>
                <div className="font-serif text-4xl text-foreground">{stats?.totals.events ?? "—"}</div>
                <div className="text-sm text-muted-foreground">Events tracked</div>
              </div>
            </div>
            {stats && stats.storage && stats.byConcern.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Top concerns</div>
                <div className="flex flex-wrap gap-2">
                  {stats.byConcern.slice(0, 6).map((c) => (
                    <Pill key={c.concernId} tint="muted">{c.concernId} · {c.count}</Pill>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Impact report — outcomes, not just activity. This is the ROI story a
            buyer underwrites: conversion, lead quality, velocity and momentum. */}
        {stats && stats.storage && (
          <div className="mt-8">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-serif text-2xl">Impact</h2>
              </div>
              <span className="text-sm text-muted-foreground">— what the front door delivers, not just activity</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                icon={<Users className="h-4 w-4" />}
                value={fmtNum(stats.impact.uniqueVisitors)}
                label="Unique visitors"
                sub={`${fmtNum(stats.impact.enquiries)} became enquiries`}
              />
              <StatTile
                icon={<Target className="h-4 w-4" />}
                value={`${stats.impact.enquiryRatePct}%`}
                label="Enquiry rate"
                tone="primary"
                sub="Visitors who reached out"
              />
              <StatTile
                icon={<FileText className="h-4 w-4" />}
                value={`${stats.impact.preparednessPct}%`}
                label="Arrive prepared"
                sub={`${fmtNum(stats.impact.preparedEnquiries)} brought their summary`}
              />
              <StatTile
                icon={<Clock className="h-4 w-4" />}
                value={stats.impact.avgMinutesToEnquiry != null ? fmtDuration(stats.impact.avgMinutesToEnquiry) : "—"}
                label="Time to enquiry"
                sub="First visit → sending"
              />
            </div>
            {(() => {
              const { last30, prev30 } = stats.impact.trend;
              const delta = prev30 > 0 ? Math.round(((last30 - prev30) / prev30) * 100) : null;
              return (
                <Card className="mt-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Enquiries · last 30 days</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl tabular-nums text-foreground">{fmtNum(last30)}</span>
                      {delta != null ? (
                        <Pill tint={delta >= 0 ? "success" : "muted"}>
                          {delta >= 0 ? "+" : ""}{delta}% vs prior 30
                        </Pill>
                      ) : (
                        <span className="text-xs text-muted-foreground">vs {fmtNum(prev30)} prior 30</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })()}
          </div>
        )}

        {/* Leads inbox */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-serif text-2xl">Enquiries</h2>
          </div>
          {leads.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No enquiries yet. They'll appear here as they come in.</Card>
          ) : (
            <div className="grid gap-3">
              {leads.map((l, i) => (
                <Card key={l.id || i} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg">{l.name}</h3>
                        {l.concernLabel && <Pill tint="primary">{l.concernLabel}</Pill>}
                        {l.includeSummary && <Pill tint="success">summary shared</Pill>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 hover:text-primary"><Mail className="h-3.5 w-3.5" />{l.email}</a>
                        {l.phone && <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary"><Phone className="h-3.5 w-3.5" />{l.phone}</a>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmtWhen(l.when)}</span>
                  </div>
                  {l.message && <p className="mt-3 rounded-lg bg-surface p-3 text-sm text-foreground/90">{l.message}</p>}
                  {l.consentVersion && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" /> Consent {l.consentVersion}{l.consentedAt ? ` · ${fmtWhen(l.consentedAt)}` : ""}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <a href={`mailto:${clinicConfig.contactEmail}`} className={buttonClasses("ghost", "sm")}>Need help? {clinicConfig.contactEmail}</a>
        </p>
      </section>
    </div>
  );
}
