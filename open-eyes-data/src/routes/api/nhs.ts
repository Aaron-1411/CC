import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

type Publication = {
  title: string;
  link: string;
  date: string;
  summary: string;
};

type ContextStat = {
  label: string;
  value: string;
  target?: string;
  context: string;
};

type NHSData = {
  publications: Publication[];
  stats: ContextStat[];
};

const CONTEXT_STATS: ContextStat[] = [
  {
    label: "4-hour A&E target performance",
    value: "76%",
    target: "95%",
    context: "As of early 2025 — NHS has missed 95% target consistently since 2015",
  },
  {
    label: "Average A&E wait time",
    value: "2h 30m",
    context: "Approximate average wait across all type 1 emergency departments",
  },
  {
    label: "Monthly A&E attendances",
    value: "~2.4 million",
    context: "Approximate monthly attendances across all A&E departments in England",
  },
];

async function fetchNHSPublications(): Promise<NHSData> {
  const publications: Publication[] = [];

  // Try NHS England WordPress REST API
  try {
    const wpRes = await fetch(
      "https://www.england.nhs.uk/wp-json/wp/v2/posts?search=A%26E+waiting+times&per_page=5&_fields=id,title,date,link,excerpt",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (wpRes.ok) {
      const posts = (await wpRes.json()) as Array<{
        id: number;
        title: { rendered: string };
        date: string;
        link: string;
        excerpt: { rendered: string };
      }>;
      for (const post of posts) {
        const summary = post.excerpt?.rendered
          ?.replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 200);
        publications.push({
          title: post.title?.rendered?.replace(/&#\d+;/g, (m) => {
            const code = parseInt(m.slice(2, -1), 10);
            return String.fromCharCode(code);
          }) ?? "Untitled",
          link: post.link,
          date: post.date,
          summary: summary ?? "",
        });
      }
    }
  } catch {
    // fallthrough to GOV.UK search
  }

  // Try GOV.UK search for NHS England A&E stats
  try {
    const govRes = await fetch(
      "https://www.gov.uk/api/search.json?filter_organisations=nhs-england&q=A%26E+waiting+4+hour&count=10&fields%5B%5D=title,description,public_timestamp,link",
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) },
    );
    if (govRes.ok) {
      const govData = (await govRes.json()) as {
        results?: Array<{
          title: string;
          description?: string;
          public_timestamp?: string;
          link: string;
        }>;
      };
      for (const item of govData.results ?? []) {
        // deduplicate by link
        if (!publications.some((p) => p.link === item.link)) {
          publications.push({
            title: item.title ?? "Untitled",
            link: item.link,
            date: item.public_timestamp ?? "",
            summary: item.description ?? "",
          });
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    publications: publications.slice(0, 15),
    stats: CONTEXT_STATS,
  };
}

export const Route = createFileRoute("/api/nhs")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await cached("nhs:v1", 60 * 60_000, fetchNHSPublications);
          return jsonResponse(
            envelope(
              data,
              "NHS England — A&E Attendances and Emergency Admissions",
              "https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/",
            ),
          );
        } catch (e) {
          return errorResponse(`NHS fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
