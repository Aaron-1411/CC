import { readFile } from "fs/promises";
import { join } from "path";

const SNAPSHOT_DIR = join(process.cwd(), "src/data/snapshots");

/**
 * Try to read a pre-built daily snapshot first; fall back to live fetch.
 * Snapshots are populated by GitHub Actions daily and committed to the repo.
 */
export async function withSnapshot<T>(
  key: string,
  live: () => Promise<T>
): Promise<T> {
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
