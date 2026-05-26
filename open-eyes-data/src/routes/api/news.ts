import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

export type NewsStory = {
  id: string;
  title: string;
  description: string;
  topic: string | null;
  sources: Array<{ name: string; url: string; bias: string; lean: number }>;
  pubDate: string;
  coverage: number;
};

type FeedSource = {
  name: string;
  url: string;
  bias: string;
  lean: number;
};

const FEEDS: FeedSource[] = [
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/uk/rss.xml", bias: "Centre", lean: 0 },
  { name: "The Guardian", url: "https://www.theguardian.com/uk-news/rss", bias: "Centre-Left", lean: -2 },
  { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/uk.xml", bias: "Centre", lean: 0 },
  { name: "The Independent", url: "https://www.independent.co.uk/news/uk/rss", bias: "Centre-Left", lean: -1 },
];

const TOPICS: Record<string, string[]> = {
  NHS: ["nhs", "hospital", "health", "waiting list", "gp", "ambulance", "cancer", "surgery"],
  Housing: ["housing", "rent", "landlord", "mortgage", "home", "property", "eviction", "planning"],
  Economy: ["economy", "inflation", "gdp", "budget", "tax", "cost of living", "unemployment", "wages", "growth"],
  Crime: ["crime", "knife", "murder", "police", "stabbing", "drugs", "gang", "prison", "court"],
  Environment: ["sewage", "climate", "energy", "flood", "pollution", "net zero", "water company"],
  Immigration: ["immigration", "migration", "asylum", "refugee", "border", "channel", "visa"],
  Education: ["school", "teacher", "university", "ofsted", "pupil", "curriculum", "tuition"],
};

function stripCdata(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

type RawItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
};

function parseRssItems(xml: string): RawItem[] {
  const items: RawItem[] = [];
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];

    const titleM = block.match(/<title>([\s\S]*?)<\/title>/i);
    const descM = block.match(/<description>([\s\S]*?)<\/description>/i);
    const linkM = block.match(/<link>([\s\S]*?)<\/link>/i)
      ?? block.match(/<link\s+[^>]*href="([^"]+)"/i);
    const dateM = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)
      ?? block.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);

    const title = titleM ? stripHtml(stripCdata(titleM[1])) : "";
    if (!title) continue;

    items.push({
      title,
      description: descM ? stripHtml(stripCdata(descM[1])) : "",
      link: linkM ? stripCdata(linkM[1]).trim() : "",
      pubDate: dateM ? stripCdata(dateM[1]).trim() : "",
    });
  }

  return items;
}

function matchTopic(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPICS)) {
    if (keywords.some((kw) => lower.includes(kw))) return topic;
  }
  return null;
}

function titleWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

/** Returns true if two titles share 4+ consecutive common words (sliding window). */
function titlesSimilar(a: string, b: string): boolean {
  const wa = titleWords(a);
  const wb = titleWords(b);
  const setB = new Set(wb);

  // Check for 4+ consecutive words from wa appearing in wb
  for (let i = 0; i <= wa.length - 4; i++) {
    if (wa.slice(i, i + 4).every((w) => setB.has(w))) return true;
  }
  // Also check from wb's perspective
  const setA = new Set(wa);
  for (let i = 0; i <= wb.length - 4; i++) {
    if (wb.slice(i, i + 4).every((w) => setA.has(w))) return true;
  }
  return false;
}

function toIso(pubDate: string): string {
  if (!pubDate) return new Date().toISOString();
  try {
    const d = new Date(pubDate);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {
    // fallthrough
  }
  return new Date().toISOString();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function fetchFeed(feed: FeedSource): Promise<Array<RawItem & { source: FeedSource }>> {
  try {
    const res = await fetch(feed.url, {
      headers: { "user-agent": "transparenC/1.0 (accountability dashboard)", accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRssItems(xml);
    return items.map((item) => ({ ...item, source: feed }));
  } catch {
    return [];
  }
}

async function fetchAllNews(): Promise<NewsStory[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const allItems = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Deduplicate by title similarity — cluster stories
  const clusters: Array<{
    title: string;
    description: string;
    pubDate: string;
    topic: string | null;
    sources: Array<{ name: string; url: string; bias: string; lean: number }>;
  }> = [];

  for (const item of allItems) {
    // find an existing cluster this belongs to
    const existing = clusters.find((c) => titlesSimilar(c.title, item.title));

    if (existing) {
      // Add source if not already present from that outlet
      const alreadyHas = existing.sources.some((s) => s.name === item.source.name);
      if (!alreadyHas) {
        existing.sources.push({
          name: item.source.name,
          url: item.link,
          bias: item.source.bias,
          lean: item.source.lean,
        });
      }
      // Use earliest pubDate
      if (item.pubDate && toIso(item.pubDate) < toIso(existing.pubDate)) {
        existing.pubDate = item.pubDate;
      }
    } else {
      const topic = matchTopic(`${item.title} ${item.description}`);
      clusters.push({
        title: item.title,
        description: item.description,
        pubDate: item.pubDate,
        topic,
        sources: [
          {
            name: item.source.name,
            url: item.link,
            bias: item.source.bias,
            lean: item.source.lean,
          },
        ],
      });
    }
  }

  // Shape into NewsStory, sort by coverage desc then pubDate desc, take top 40
  const stories: NewsStory[] = clusters
    .map((c, i) => ({
      id: `${slugify(c.title)}-${i}`,
      title: c.title,
      description: c.description,
      topic: c.topic,
      sources: c.sources,
      pubDate: toIso(c.pubDate),
      coverage: c.sources.length,
    }))
    .sort((a, b) => {
      if (b.coverage !== a.coverage) return b.coverage - a.coverage;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    })
    .slice(0, 40);

  return stories;
}

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await cached("news:uk:v1", 60 * 60_000, fetchAllNews);
          return jsonResponse(
            envelope(
              data,
              "BBC News · The Guardian · Sky News · The Independent — RSS feeds",
              "https://www.bbc.co.uk/news",
            ),
          );
        } catch (e) {
          return errorResponse(`News fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
