import { supabase } from "@/integrations/supabase/client";
import type { Scenario } from "@/context/ScenarioContext";

export interface SavedScenario {
  id: string;
  name: string;
  data: Scenario;
  createdAt: number;
}

interface RemoteRow {
  id: string;
  name: string;
  data: Scenario;
  created_at: string;
}

function fromRow(r: RemoteRow): SavedScenario {
  return { id: r.id, name: r.name, data: r.data, createdAt: new Date(r.created_at).getTime() };
}

export async function listScenarios(): Promise<SavedScenario[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data, error } = await supabase
    .from("saved_scenarios")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("listScenarios failed", error);
    return [];
  }
  return (data as unknown as RemoteRow[]).map(fromRow);
}

export async function saveScenario(name: string, scenario: Scenario): Promise<SavedScenario | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase
    .from("saved_scenarios")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert([{ user_id: u.user.id, name, data: scenario as any }])
    .select()
    .single();
  if (error) throw error;
  return fromRow(data as unknown as RemoteRow);
}

export async function deleteScenario(id: string): Promise<void> {
  const { error } = await supabase.from("saved_scenarios").delete().eq("id", id);
  if (error) throw error;
}
