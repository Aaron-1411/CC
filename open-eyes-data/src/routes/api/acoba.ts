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

type AcobaCase = {
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

async function fetchACOBA(): Promise<{ cases: AcobaCase[] }> {
  // Note: GOV.UK API returns 422 for `order=updated-newest` — never include it.
  const fields =
    "fields%5B%5D=title&fields%5B%5D=description&fields%5B%5D=public_timestamp&fields%5B%5D=link";

  let results = await govSearch(
    `${GOVUK}?filter_organisations%5B%5D=advisory-committee-on-business-appointments&count=25&${fields}`,
  );

  if (!results.length) {
    results = await govSearch(
      `${GOVUK}?filter_document_type=transparency-data&q=ACOBA+advisory+committee+business+appointments&count=25&${fields}`,
    );
  }

  if (!results.length) {
    results = await govSearch(
      `${GOVUK}?q=advisory+committee+business+appointments+decision&count=25`,
    );
  }

  const cases: AcobaCase[] = results.map((item) => ({
    title: item.title ?? "",
    description: item.description,
    url: item.link ? `https://www.gov.uk${item.link}` : "",
    date: item.public_timestamp ?? "",
  }));

  // Sort by date descending
  cases.sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  );

  if (!cases.length) {
    throw new Error("No ACOBA publications found from GOV.UK");
  }

  return { cases };
}

export const Route = createFileRoute("/api/acoba")({
  server: {
    handlers: {
      GET: async ({ request: _request }) => {
        try {
          const data = await cached("acoba:v4", 1_800_000, fetchACOBA);
          return jsonResponse(
            envelope(
              data,
              "ACOBA via GOV.UK",
              "https://www.gov.uk/government/organisations/advisory-committee-on-business-appointments",
            ),
          );
        } catch (e) {
          return errorResponse(`ACOBA fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
