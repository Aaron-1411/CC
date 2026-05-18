import { supabase } from "@/integrations/supabase/client";

// Lightweight, deterministic "signature" — not crypto-grade, but tamper-evident:
// any change to the verdict payload changes the hash, which is stored alongside.
export async function signPayload(payload: unknown): Promise<string> {
  const json = JSON.stringify(payload);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(json));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

export function makeSlug() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}

export interface ReceiptInput {
  propertyRef?: string;
  verdict: Record<string, unknown>;
  score?: number;
  band?: "green" | "amber" | "red";
}

export async function createReceipt(input: ReceiptInput) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sign in to create a Verdict Receipt.");
  const signature = await signPayload({ ...input, ts: Date.now() });
  const slug = makeSlug();
  const { data, error } = await supabase.from("verdict_receipts").insert({
    user_id: u.user.id,
    slug,
    property_ref: input.propertyRef ?? null,
    verdict: input.verdict as never,
    score: input.score ?? null,
    band: input.band ?? null,
    signature,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getReceiptBySlug(slug: string) {
  const { data, error } = await supabase.from("verdict_receipts").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listMyReceipts() {
  const { data, error } = await supabase.from("verdict_receipts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
