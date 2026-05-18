import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { toast } from "@/hooks/use-toast";
import { logAction } from "@/lib/audit";
import {
  Loader2, Shield, ShieldAlert, Users, ScrollText, RefreshCw, Search,
  BarChart3, Download, ChevronLeft, ChevronRight,
} from "lucide-react";

type Role = "admin" | "pro" | "free";

interface AdminUser {
  user_id: string;
  email: string;
  role: Role;
  created_at: string;
  last_sign_in_at: string | null;
  saved_properties_count: number;
  saved_scenarios_count: number;
  mip_assessments_count: number;
  price_alerts_count: number;
}

interface AuditRow {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  total_count?: number;
}

interface UsageRow {
  tool: string;
  events: number;
  unique_users: number;
  avg_duration_ms: number | null;
  p95_duration_ms: number | null;
  last_used: string;
}

interface DailyRow { day: string; events: number; unique_users: number; }

const PAGE_SIZE = 50;

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, string> = {
    admin: "bg-destructive/10 text-destructive border-destructive/30",
    pro: "bg-brand/10 text-brand border-brand/30",
    free: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={map[role]}>{role}</Badge>;
}

function toCsv(rows: AuditRow[]): string {
  const header = ["when", "actor_email", "user_id", "action", "target_type", "target_id", "metadata"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [header.join(","), ...rows.map(r => [
    r.created_at, r.actor_email, r.user_id, r.action,
    r.target_type, r.target_id, JSON.stringify(r.metadata ?? {}),
  ].map(esc).join(","))].join("\n");
}

function Sparkline({ data }: { data: DailyRow[] }) {
  if (!data.length) return <div className="text-xs text-muted-foreground">No activity yet.</div>;
  const max = Math.max(...data.map(d => d.events), 1);
  const w = 600, h = 60, step = w / Math.max(data.length - 1, 1);
  const pts = data.map((d, i) => `${i * step},${h - (d.events / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
      <polyline fill="none" stroke="hsl(var(--brand))" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

const ACTION_GROUPS = [
  { value: "all", label: "All actions" },
  { value: "tool", label: "Tool usage" },
  { value: "admin", label: "Admin" },
  { value: "invite", label: "Invites" },
  { value: "report", label: "Reports" },
  { value: "auth", label: "Auth" },
];

export default function Admin() {
  const { user } = useAuth();
  useDocumentTitle("Admin dashboard", "Internal administration console.");

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [usage, setUsage] = useState<UsageRow[] | null>(null);
  const [daily, setDaily] = useState<DailyRow[] | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [auditTotal, setAuditTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // Users filters
  const [q, setQ] = useState("");

  // Audit filters
  const [auditQ, setAuditQ] = useState("");
  const [auditAction, setAuditAction] = useState<string>("all");
  const [auditFrom, setAuditFrom] = useState<string>("");
  const [auditTo, setAuditTo] = useState<string>("");
  const [auditPage, setAuditPage] = useState(0);

  // Analytics window
  const [windowDays, setWindowDays] = useState<number>(30);

  async function loadOverview(days: number) {
    setRefreshing(true);
    const [u, usg, dly] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.rpc("admin_usage_stats", { p_days: days }),
      supabase.rpc("admin_daily_activity", { p_days: days }),
    ]);
    if (u.error) toast({ title: "Couldn't load users", description: u.error.message, variant: "destructive" });
    else setUsers((u.data ?? []) as AdminUser[]);
    if (usg.error) toast({ title: "Couldn't load usage", description: usg.error.message, variant: "destructive" });
    else setUsage((usg.data ?? []) as UsageRow[]);
    if (dly.error) toast({ title: "Couldn't load activity", description: dly.error.message, variant: "destructive" });
    else setDaily((dly.data ?? []) as DailyRow[]);
    setLoading(false);
    setRefreshing(false);
  }

  async function loadAudit() {
    setAuditLoading(true);
    const { data, error } = await supabase.rpc("admin_audit_search", {
      p_q: auditQ || null,
      p_action: auditAction === "all" ? null : auditAction,
      p_from: auditFrom ? new Date(auditFrom).toISOString() : null,
      p_to: auditTo ? new Date(auditTo + "T23:59:59").toISOString() : null,
      p_limit: PAGE_SIZE,
      p_offset: auditPage * PAGE_SIZE,
    });
    if (error) {
      toast({ title: "Audit search failed", description: error.message, variant: "destructive" });
    } else {
      const rows = (data ?? []) as AuditRow[];
      setAudit(rows);
      setAuditTotal(rows.length ? Number(rows[0].total_count ?? 0) : 0);
    }
    setAuditLoading(false);
  }

  useEffect(() => { loadOverview(windowDays); /* eslint-disable-next-line */ }, [windowDays]);
  useEffect(() => { loadAudit(); /* eslint-disable-next-line */ }, [auditPage]);
  useEffect(() => { setAuditPage(0); loadAudit(); /* eslint-disable-next-line */ }, [auditAction, auditFrom, auditTo]);

  function onSearchAudit() { setAuditPage(0); loadAudit(); }

  function exportAuditCsv() {
    if (!audit) return;
    const blob = new Blob([toCsv(audit)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    void logAction("admin.audit.exported", { metadata: { rows: audit.length } });
  }

  async function changeRole(target: AdminUser, role: Role) {
    if (target.user_id === user?.id && role !== "admin") {
      toast({ title: "Blocked", description: "You can't demote yourself.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.rpc("admin_set_role", { p_user_id: target.user_id, p_role: role });
    if (error) {
      toast({ title: "Role change failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Role updated", description: `${target.email} → ${role}` });
    await logAction("plan.changed", { targetType: "user", targetId: target.user_id, metadata: { new_role: role } });
    loadOverview(windowDays);
  }

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const t = q.trim().toLowerCase();
    if (!t) return users;
    return users.filter(u => u.email?.toLowerCase().includes(t) || u.user_id.includes(t));
  }, [users, q]);

  const stats = useMemo(() => {
    const list = users ?? [];
    return {
      total: list.length,
      admin: list.filter(u => u.role === "admin").length,
      pro: list.filter(u => u.role === "pro").length,
      free: list.filter(u => u.role === "free").length,
      activeWeek: list.filter(u => u.last_sign_in_at && (Date.now() - +new Date(u.last_sign_in_at)) < 7 * 864e5).length,
      newWeek: list.filter(u => (Date.now() - +new Date(u.created_at)) < 7 * 864e5).length,
    };
  }, [users]);

  const totalEvents = useMemo(() => (daily ?? []).reduce((s, d) => s + d.events, 0), [daily]);
  const dauAvg = useMemo(() => {
    const list = daily ?? [];
    if (!list.length) return 0;
    return Math.round(list.reduce((s, d) => s + d.unique_users, 0) / list.length);
  }, [daily]);

  const totalPages = Math.max(1, Math.ceil(auditTotal / PAGE_SIZE));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-brand" />
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand">Admin dashboard</h1>
            <p className="text-xs text-muted-foreground">Internal use only · all actions are audit-logged.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v))}>
            <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => loadOverview(windowDays)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Total users", value: stats.total },
          { label: "New 7d", value: stats.newWeek },
          { label: "Active 7d", value: stats.activeWeek },
          { label: `Events ${windowDays}d`, value: totalEvents.toLocaleString() },
          { label: "Avg DAU", value: dauAvg },
          { label: "Plans", value: `${stats.pro}p · ${stats.free}f` },
        ].map((s) => (
          <Card key={s.label}><CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-bold text-brand">{s.value}</div>
          </CardContent></Card>
        ))}
      </div>

      {/* Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Daily activity (last {windowDays}d)</CardTitle>
        </CardHeader>
        <CardContent>
          <Sparkline data={daily ?? []} />
        </CardContent>
      </Card>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="w-3.5 h-3.5 mr-1.5" />Users</TabsTrigger>
          <TabsTrigger value="usage"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Tool usage</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="w-3.5 h-3.5 mr-1.5" />Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Users ({filteredUsers.length})</CardTitle>
              <div className="relative w-64 max-w-full">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input className="pl-8 h-8" placeholder="Search email / id" value={q} onChange={e => setQ(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Saved</TableHead>
                    <TableHead className="text-right">Scenarios</TableHead>
                    <TableHead className="text-right">MIPs</TableHead>
                    <TableHead className="text-right">Alerts</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last sign in</TableHead>
                    <TableHead className="text-right">Change role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{u.email}</TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell className="text-right">{u.saved_properties_count}</TableCell>
                      <TableCell className="text-right">{u.saved_scenarios_count}</TableCell>
                      <TableCell className="text-right">{u.mip_assessments_count}</TableCell>
                      <TableCell className="text-right">{u.price_alerts_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(u.created_at)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(u.last_sign_in_at)}</TableCell>
                      <TableCell className="text-right">
                        <Select value={u.role} onValueChange={(v) => changeRole(u, v as Role)}>
                          <SelectTrigger className="h-8 w-[100px] ml-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">free</SelectItem>
                            <SelectItem value="pro">pro</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No users match.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tool usage (last {windowDays}d)</CardTitle>
              <p className="text-xs text-muted-foreground">Where users spend time. Drives onboarding and growth decisions.</p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Unique users</TableHead>
                    <TableHead className="text-right">Adoption</TableHead>
                    <TableHead>Last used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(usage ?? []).map(r => (
                    <TableRow key={r.tool}>
                      <TableCell className="font-mono text-xs">{r.tool}</TableCell>
                      <TableCell className="text-right">{r.events.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.unique_users}</TableCell>
                      <TableCell className="text-right">
                        {stats.total ? `${Math.round((r.unique_users / stats.total) * 100)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(r.last_used)}</TableCell>
                    </TableRow>
                  ))}
                  {(!usage || usage.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tool events yet — they'll appear once users navigate the app.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">
                  Recent activity ({auditTotal.toLocaleString()} match{auditTotal === 1 ? "" : "es"})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={exportAuditCsv} disabled={!audit?.length}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div className="relative md:col-span-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input className="pl-8 h-8" placeholder="Action / email / target"
                    value={auditQ}
                    onChange={e => setAuditQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") onSearchAudit(); }}
                  />
                </div>
                <Select value={auditAction} onValueChange={setAuditAction}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTION_GROUPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" className="h-8" value={auditFrom} onChange={e => setAuditFrom(e.target.value)} aria-label="From date" />
                <Input type="date" className="h-8" value={auditTo} onChange={e => setAuditTo(e.target.value)} aria-label="To date" />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onSearchAudit} disabled={auditLoading}>
                  {auditLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-1.5" />}
                  Search
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setAuditQ(""); setAuditAction("all"); setAuditFrom(""); setAuditTo(""); setAuditPage(0);
                  setTimeout(loadAudit, 0);
                }}>Reset</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(audit ?? []).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">{fmt(r.created_at)}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{r.actor_email || r.user_id?.slice(0, 8) || "system"}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-[10px]">{r.action}</Badge></TableCell>
                      <TableCell className="text-xs">{r.target_type ? `${r.target_type}:${r.target_id?.slice(0, 12) ?? ""}` : "—"}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[300px] truncate">
                        {r.metadata && Object.keys(r.metadata).length ? JSON.stringify(r.metadata) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!audit || audit.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No entries.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
                <span>Page {auditPage + 1} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setAuditPage(p => Math.max(0, p - 1))} disabled={auditPage === 0 || auditLoading}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setAuditPage(p => Math.min(totalPages - 1, p + 1))} disabled={auditPage >= totalPages - 1 || auditLoading}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5" />
        Every role change, invite, report download and admin view is recorded in the audit log.
      </div>
    </div>
  );
}
