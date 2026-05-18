import { supabase } from "@/integrations/supabase/client";

export type ShortlistSource = "screenshot" | "url" | "manual";

export interface SavedProperty {
  id: string;
  source: ShortlistSource;
  address: string;
  area?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  url?: string;
  imageDataUrl?: string;
  tags: string[];
  notes?: string;
  createdAt: number;
}

const KEY = "homestead.shortlist.v1";

// ---------- Local fallback (used when signed-out) ----------

export function loadLocal(): SavedProperty[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(items: SavedProperty[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to persist shortlist locally", e);
  }
}

function clearLocal() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

// ---------- Mappers ----------

interface RemoteRow {
  id: string;
  source: string;
  address: string;
  area: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  url: string | null;
  image_url: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
}

function fromRow(r: RemoteRow): SavedProperty {
  return {
    id: r.id,
    source: (r.source as ShortlistSource) ?? "manual",
    address: r.address,
    area: r.area ?? undefined,
    price: r.price ?? undefined,
    beds: r.beds ?? undefined,
    baths: r.baths ?? undefined,
    sqft: r.sqft ?? undefined,
    url: r.url ?? undefined,
    imageDataUrl: r.image_url ?? undefined,
    tags: r.tags ?? [],
    notes: r.notes ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
  };
}

function toRow(p: Omit<SavedProperty, "id" | "createdAt">, userId: string) {
  return {
    user_id: userId,
    source: p.source,
    address: p.address,
    area: p.area ?? null,
    price: p.price ?? null,
    beds: p.beds ?? null,
    baths: p.baths ?? null,
    sqft: p.sqft ?? null,
    url: p.url ?? null,
    image_url: p.imageDataUrl ?? null,
    tags: p.tags ?? [],
    notes: p.notes ?? null,
  };
}

// ---------- Public async API (auto chooses remote when authed) ----------

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listProperties(): Promise<SavedProperty[]> {
  const uid = await getUserId();
  if (!uid) return loadLocal();
  const { data, error } = await supabase
    .from("saved_properties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("listProperties failed", error);
    return loadLocal();
  }
  return (data as RemoteRow[]).map(fromRow);
}

export async function addProperty(item: Omit<SavedProperty, "id" | "createdAt">): Promise<SavedProperty> {
  const uid = await getUserId();
  if (!uid) {
    const next: SavedProperty = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
    const all = loadLocal();
    all.unshift(next);
    saveLocal(all);
    return next;
  }
  const { data, error } = await supabase
    .from("saved_properties")
    .insert(toRow(item, uid))
    .select()
    .single();
  if (error) throw error;
  return fromRow(data as RemoteRow);
}

export async function removeProperty(id: string): Promise<void> {
  const uid = await getUserId();
  if (!uid) {
    saveLocal(loadLocal().filter((p) => p.id !== id));
    return;
  }
  const { error } = await supabase.from("saved_properties").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProperty(id: string, patch: Partial<SavedProperty>): Promise<void> {
  const uid = await getUserId();
  if (!uid) {
    saveLocal(loadLocal().map((p) => (p.id === id ? { ...p, ...patch } : p)));
    return;
  }
  type RemotePatch = Partial<{
    address: string; area: string | null; price: number | null;
    beds: number | null; baths: number | null; sqft: number | null;
    url: string | null; image_url: string | null; tags: string[]; notes: string | null;
  }>;
  const remotePatch: RemotePatch = {};
  if (patch.address !== undefined) remotePatch.address = patch.address;
  if (patch.area !== undefined) remotePatch.area = patch.area ?? null;
  if (patch.price !== undefined) remotePatch.price = patch.price ?? null;
  if (patch.beds !== undefined) remotePatch.beds = patch.beds ?? null;
  if (patch.baths !== undefined) remotePatch.baths = patch.baths ?? null;
  if (patch.sqft !== undefined) remotePatch.sqft = patch.sqft ?? null;
  if (patch.url !== undefined) remotePatch.url = patch.url ?? null;
  if (patch.imageDataUrl !== undefined) remotePatch.image_url = patch.imageDataUrl ?? null;
  if (patch.tags !== undefined) remotePatch.tags = patch.tags;
  if (patch.notes !== undefined) remotePatch.notes = patch.notes ?? null;
  const { error } = await supabase.from("saved_properties").update(remotePatch).eq("id", id);
  if (error) throw error;
}

/** Migrate any locally-saved properties up to the user's account on first sign-in. */
export async function migrateLocalToRemote(userId: string): Promise<number> {
  const local = loadLocal();
  if (local.length === 0) return 0;
  const rows = local.map((p) => toRow(p, userId));
  const { error } = await supabase.from("saved_properties").insert(rows);
  if (error) {
    console.warn("Migration failed", error);
    return 0;
  }
  clearLocal();
  return rows.length;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
