import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useScenario } from "@/context/ScenarioContext";
import { Users, Trash2, Mail, Check, Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import { logAction } from "@/lib/audit";

interface Collaborator {
  id: string;
  scenario_id: string;
  invited_email: string;
  collaborator_user_id: string | null;
  role: "viewer" | "editor";
  accepted_at: string | null;
  created_at: string;
}

interface Scenario {
  id: string; name: string; created_at: string;
  data: unknown;
}

export default function CoBuyer() {
  const { user } = useAuth();
  const { scenario } = useScenario();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");
  const [name, setName] = useState("My purchase");

  // Fetch user's scenarios
  const scenarios = useQuery({
    queryKey: ["my-scenarios", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_scenarios")
        .select("id,name,created_at,data")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Scenario[];
    },
  });

  useEffect(() => {
    if (!activeId && scenarios.data?.length) setActiveId(scenarios.data[0].id);
  }, [scenarios.data, activeId]);

  // Shared with me
  const sharedWithMe = useQuery({
    queryKey: ["shared-with-me", user?.id, user?.email],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenario_collaborators")
        .select("id,scenario_id,role,accepted_at,invited_email,owner_id,saved_scenarios(name)")
        .or(`collaborator_user_id.eq.${user!.id},invited_email.eq.${user!.email?.toLowerCase()}`);
      if (error) throw error;
      return data ?? [];
    },
  });

  const collabs = useQuery({
    queryKey: ["collabs", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenario_collaborators")
        .select("*")
        .eq("scenario_id", activeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Collaborator[];
    },
  });

  const createScenario = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("saved_scenarios")
        .insert({ user_id: user!.id, name, data: scenario as never })
        .select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => { setActiveId(id); qc.invalidateQueries({ queryKey: ["my-scenarios"] }); toast.success("Scenario created"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const invite = useMutation({
    mutationFn: async () => {
      if (!activeId) throw new Error("Select a scenario first");
      const invitee = email.toLowerCase().trim();
      const { error } = await supabase
        .from("scenario_collaborators")
        .insert({
          scenario_id: activeId, owner_id: user!.id,
          invited_email: invitee, role,
        });
      if (error) throw error;
      await logAction("invite.sent", {
        targetType: "scenario", targetId: activeId,
        metadata: { invited_email: invitee, role },
      });
    },
    onSuccess: () => { setEmail(""); qc.invalidateQueries({ queryKey: ["collabs"] }); toast.success("Invite added — share the link with them."); },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scenario_collaborators").delete().eq("id", id);
      if (error) throw error;
      await logAction("invite.revoked", { targetType: "collaborator", targetId: id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collabs"] }),
  });

  const shareLink = activeId ? `${window.location.origin}/decide?scenario=${activeId}` : "";

  if (!user) {
    return (
      <>
        <PageHeader eyebrow="Co-buyer" title="Buy together" description="Invite a partner, parent or friend to share a verdict, shortlist and budget." />
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <Card className="p-8">
            <p className="text-muted-foreground mb-4">Sign in to invite a co-buyer.</p>
            <Button asChild><a href="/auth">Sign in</a></Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Co-buyer"
        title="Buy together"
        description="Invite a partner, parent or friend to share a scenario. They'll see the same verdict, shortlist and budget — and can edit if you let them."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-3">
            <h3 className="font-serif font-bold text-brand">Your scenarios</h3>
            {scenarios.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {scenarios.data?.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">You haven't saved a scenario yet — create one from your current inputs.</p>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Scenario name" />
                <Button size="sm" onClick={() => createScenario.mutate()} disabled={createScenario.isPending}>Save current scenario</Button>
              </div>
            )}
            {scenarios.data && scenarios.data.length > 0 && (
              <ul className="space-y-1 text-sm">
                {scenarios.data.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setActiveId(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                        activeId === s.id ? "bg-brand-muted border-brand" : "hover:bg-muted"
                      }`}
                    >
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {scenarios.data && scenarios.data.length > 0 && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => createScenario.mutate()}>
                Save another from current inputs
              </Button>
            )}
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-serif font-bold text-brand">Shared with me</h3>
            {sharedWithMe.data?.length === 0 && <p className="text-xs text-muted-foreground">Nothing shared with you yet.</p>}
            <ul className="space-y-1 text-sm">
              {(sharedWithMe.data ?? []).map((s: { id: string; scenario_id: string; role: string; accepted_at: string | null; saved_scenarios?: { name?: string } | null }) => (
                <li key={s.id} className="border rounded-md px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.saved_scenarios?.name ?? "Shared scenario"}</p>
                    <p className="text-xs text-muted-foreground">{s.role}</p>
                  </div>
                  {s.accepted_at
                    ? <Badge className="bg-success/15 text-success border-0"><Check className="h-3 w-3" /></Badge>
                    : <Badge variant="outline"><Clock className="h-3 w-3" /></Badge>}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {activeId && (
            <>
              <Card className="p-6 bg-gradient-warm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-brand" />
                  <h2 className="font-serif text-xl font-bold text-brand">Invite a co-buyer</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">They'll need to sign in with the same email to access the scenario.</p>
                <div className="grid sm:grid-cols-[1fr_140px_auto] gap-2">
                  <Input type="email" placeholder="partner@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Select value={role} onValueChange={(v: "viewer" | "editor") => setRole(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Can view</SelectItem>
                      <SelectItem value="editor">Can edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => invite.mutate()} disabled={!email || invite.isPending}>
                    <Mail className="h-4 w-4 mr-1.5" />Invite
                  </Button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Input readOnly value={shareLink} className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(shareLink); toast.success("Link copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-serif font-bold text-brand mb-3">Collaborators</h3>
                {collabs.data?.length === 0 && <p className="text-sm text-muted-foreground">No-one invited yet.</p>}
                <ul className="space-y-2 text-sm">
                  {(collabs.data ?? []).map((c) => (
                    <li key={c.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <div>
                        <p className="font-medium">{c.invited_email}</p>
                        <p className="text-xs text-muted-foreground">{c.role} · {c.accepted_at ? "joined" : "invited"}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => remove.mutate(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
