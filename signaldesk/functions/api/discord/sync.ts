// POST /api/discord/sync -> SyncResult.
//
// Incrementally pulls new messages from one Discord channel via the bot REST
// API (v10) and stores each as a parsed signal. Idempotent: we track the last
// seen message id in sync_state and request `after={lastId}`; INSERT OR IGNORE
// dedupes on re-runs. Requires DISCORD_BOT_TOKEN + DISCORD_CHANNEL_ID; without
// them the route reports source:'disabled' so the UI degrades cleanly.
import { type Env, json, requireDB } from '../../_lib/http';
import { getLastMessageId, insertSignalIfNew, setLastMessageId } from '../../_lib/db';
import { parseSignal } from '../../_lib/parse';
import type { D1Database } from '@cloudflare/workers-types';
import type { RawDiscordMessage, SyncResult } from '../../../src/types/contract';

const API = 'https://discord.com/api/v10';
const PAGE_LIMIT = 50; // messages per request (Discord caps at 100)
const MAX_PAGES = 10; // safety cap per sync run

interface DiscordMessage {
  id: string;
  channel_id: string;
  author?: { id: string; username?: string; global_name?: string | null };
  content: string;
  timestamp: string;
  embeds?: {
    title?: string;
    description?: string;
    fields?: { name: string; value: string }[];
  }[];
  attachments?: { url: string; content_type?: string; filename: string }[];
}

function toRaw(m: DiscordMessage): RawDiscordMessage {
  return {
    id: m.id,
    channelId: m.channel_id,
    authorId: m.author?.id ?? 'unknown',
    authorName: m.author?.global_name || m.author?.username || 'unknown',
    content: m.content ?? '',
    embeds: (m.embeds ?? []).map((e) => ({
      title: e.title,
      description: e.description,
      fields: e.fields,
    })),
    attachments: (m.attachments ?? []).map((a) => ({
      url: a.url,
      contentType: a.content_type,
      filename: a.filename,
    })),
    createdAt: m.timestamp,
  };
}

async function fetchPage(
  channelId: string,
  token: string,
  after: string | null,
): Promise<DiscordMessage[]> {
  const url = new URL(`${API}/channels/${channelId}/messages`);
  url.searchParams.set('limit', String(PAGE_LIMIT));
  if (after) url.searchParams.set('after', after);

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bot ${token}` },
    });
    if (res.status === 429) {
      const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
      const waitMs = Math.min((body.retry_after ?? 1) * 1000, 5000);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) throw new Error(`Discord ${res.status}: ${await res.text()}`);
    return (await res.json()) as DiscordMessage[];
  }
  throw new Error('Discord rate limit: retries exhausted.');
}

async function runSync(db: D1Database, env: Env): Promise<SyncResult> {
  const token = env.DISCORD_BOT_TOKEN!;
  const channelId = env.DISCORD_CHANNEL_ID!;

  let after = await getLastMessageId(db, channelId);
  let fetched = 0;
  let added = 0;
  let skipped = 0;
  let newestId = after;

  for (let page = 0; page < MAX_PAGES; page++) {
    const messages = await fetchPage(channelId, token, after);
    if (messages.length === 0) break;

    // Discord returns newest-first; process oldest-first so newestId advances
    // monotonically and `after` paginates forward in time.
    messages.reverse();
    for (const m of messages) {
      fetched++;
      const raw = toRaw(m);
      const signal = await parseSignal(raw, env);
      const isNew = await insertSignalIfNew(db, signal, raw);
      if (isNew) added++;
      else skipped++;
      if (!newestId || BigInt(m.id) > BigInt(newestId)) newestId = m.id;
    }

    after = messages[messages.length - 1].id;
    if (messages.length < PAGE_LIMIT) break;
  }

  if (newestId) await setLastMessageId(db, channelId, newestId);
  return { fetched, added, skipped, source: 'discord' };
}

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const db = requireDB(env);
  if (db instanceof Response) return db;

  if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_CHANNEL_ID) {
    const disabled: SyncResult = {
      fetched: 0,
      added: 0,
      skipped: 0,
      source: 'disabled',
      error: 'Discord not configured (set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID).',
    };
    return json(disabled);
  }

  try {
    return json(await runSync(db, env));
  } catch (e) {
    const failed: SyncResult = {
      fetched: 0,
      added: 0,
      skipped: 0,
      source: 'discord',
      error: e instanceof Error ? e.message : 'Sync failed.',
    };
    return json(failed, 502);
  }
};
