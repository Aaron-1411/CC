import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const GOVUK = "https://www.gov.uk/api/search.json";

type GovUKResult = {
  title?: string;
  description?: string;
  link?: string;
  public_timestamp?: string;
};

type Publication = {
  title: string;
  description?: string;
  url: string;
  date: string;
};

async function govSearch(url: string): Promise<GovUKResult[]> {
  const r = await fetch(url);
  if (!r.ok) return [];
  const json = await r.json();
  return (json.results ?? []) as GovUKResult[];
}

async function fetchLobbying(): Promise<{ publications: Publication[] }> {
  // Note: GOV.UK API returns 422 for `order=updated-newest` — do not include it.
  // Resilient fallback chain, same pattern as meetings.ts.
  const fields =
    "fields%5B%5D=title&fields%5B%5D=description&fields%5B%5D=public_timestamp&fields%5B%5D=link";

  let results = await govSearch(
    `${GOVUK}?filter_organisations%5B%5D=office-of-the-registrar-of-consultant-lobbyists&count=20&${fields}`,
  );

  if (!results.length) {
    results = await govSearch(
      `${GOVUK}?filter_document_type=transparency-data&q=consultant+lobbyists+register&count=20&${fields}`,
    );
  }

  if (!results.length) {
    results = await govSearch(
      `${GOVUK}?q=office+registrar+consultant+lobbyists+quarterly+return&count=20`,
    );
  }

  const publications: Publication[] = results.map((item) => ({
    title: item.title ?? "",
    description: item.description,
    url: item.link ? `https://www.gov.uk${item.link}` : "",
    date: item.public_timestamp ?? "",
  }));

  // Sort by date descending
  publications.sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  );

  if (!publications.length) {
    throw new Error("No lobbying publications found from GOV.UK");
  }

  return { publications };
}

export const Route = createFileRoute("/api/lobbying")({
  server: {
    handlers: {
      GET: async ({ request: _request }) => {
        try {
          const data = await cached("lobbying:v4", 1_800_000, fetchLobbying);
          return jsonResponse(
            envelope(
              data,
              "ORCL · GOV.UK — Office of the Registrar of Consultant Lobbyists",
              "https://www.gov.uk/government/organisations/office-of-the-registrar-of-consultant-lobbyists",
            ),
          );
        } catch (e) {
          return errorResponse(`Lobbying fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
