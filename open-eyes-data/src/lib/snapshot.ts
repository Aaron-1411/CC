import { readFile, readdir } from "fs/promises";
import { join } from "path";

const SNAPSHOT_DIR = join(process.cwd(), "src/data/snapshots");

export type SnapshotHealth = {
  key: string;
  fetchedAt: string | null;
  ageHours: number | null;
  status: "fresh" | "stale" | "unreadable";
};

/** Report freshness of every committed snapshot, for /api/status. */
export async function snapshotHealth(): Promise<SnapshotHealth[]> {
  let files: string[] = [];
  try {
    files = (await readdir(SNAPSHOT_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const out: SnapshotHealth[] = [];
  for (const file of files) {
    const key = file.replace(/\.json$/, "");
    try {
      const raw = await readFile(join(SNAPSHOT_DIR, file), "utf-8");
      const { fetchedAt } = JSON.parse(raw) as { fetchedAt?: string };
      if (!fetchedAt) {
        out.push({ key, fetchedAt: null, ageHours: null, status: "unreadable" });
        continue;
      }
      const ageMs = Date.now() - new Date(fetchedAt).getTime();
      out.push({
        key,
        fetchedAt,
        ageHours: Math.round(ageMs / 3_600_000),
        status: ageMs < 26 * 60 * 60_000 ? "fresh" : "stale",
      });
    } catch {
      out.push({ key, fetchedAt: null, ageHours: null, status: "unreadable" });
    }
  }
  return out;
}

/**
 * Try to read a pre-built daily snapshot first; fall back to live fetch.
 * Snapshots are populated by GitHub Actions daily and committed to the repo.
 */
export async function withSnapshot<T>(key: string, live: () => Promise<T>): Promise<T> {
  try {
    const path = join(SNAPSHOT_DIR, `${key}.json`);
    const raw = await readFile(path, "utf-8");
    const { data, fetchedAt } = JSON.parse(raw) as { data: T; fetchedAt: string };
    // Accept snapshot if < 26h old (buffer for delayed Actions runs)
    const age = Date.now() - new Date(fetchedAt).getTime();
    if (age < 26 * 60 * 60_000) return data;
  } catch {
    // file missing or stale — fall through to live fetch
  }
  return live();
}
