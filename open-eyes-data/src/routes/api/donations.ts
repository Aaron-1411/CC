import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, envelope, errorResponse, jsonResponse } from "@/lib/proxy";

const EC_BASE = "https://search.electoralcommission.org.uk/api/search/Donations";

type ECDonation = {
  Id?: string | number;
  RegulatedEntityName?: string;
  DonorName?: string;
  Value?: number;
  ReceivedDate?: string;
  DonationType?: string;
  RegulatedEntityType?: string;
  NatureOfDonation?: string;
  IsBequest?: boolean;
  IsAggregation?: boolean;
  CampaignId?: string | null;
  PurposeName?: string | null;
};

type ECResponse = {
  Total?: number;
  Result?: ECDonation[];
};

type Donation = {
  id: string;
  party: string;
  donor: string;
  amount: number;
  receivedDate: string;
  type: string;
  nature: string;
  purpose?: string;
};

type DonationsResponse = {
  donations: Donation[];
  totalResults: number;
  totalValue: number;
};

function normalise(d: ECDonation): Donation {
  return {
    id: String(d.Id ?? Math.random()),
    party: d.RegulatedEntityName ?? "Unknown party",
    donor: d.DonorName ?? "Unknown donor",
    amount: d.Value ?? 0,
    receivedDate: d.ReceivedDate ?? "",
    type: d.DonationType ?? "—",
    nature: d.NatureOfDonation ?? "—",
    purpose: d.PurposeName ?? undefined,
  };
}

async function fetchDonations(take: number, skip: number, party?: string): Promise<DonationsResponse> {
  let url = `${EC_BASE}?take=${take}&skip=${skip}`;
  if (party) url += `&party=${encodeURIComponent(party)}`;

  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`Electoral Commission API returned ${r.status}`);
  const j = (await r.json()) as ECResponse;

  const donations = (j.Result ?? []).map(normalise);
  const totalValue = donations.reduce((s, d) => s + d.amount, 0);

  return {
    donations,
    totalResults: j.Total ?? donations.length,
    totalValue,
  };
}

export const Route = createFileRoute("/api/donations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const party = url.searchParams.get("party") ?? undefined;
          const take = Math.min(Number(url.searchParams.get("take") ?? 100), 200);
          const skip = Number(url.searchParams.get("skip") ?? 0);

          const cacheKey = `donations:v1:${party ?? "all"}:${take}:${skip}`;
          const data = await cached(cacheKey, 30 * 60_000, () => fetchDonations(take, skip, party));

          return jsonResponse(
            envelope(
              data,
              "Electoral Commission — Register of Donations",
              "https://search.electoralcommission.org.uk/Search/Donations",
              "Open Government Licence v3.0",
            ),
          );
        } catch (e) {
          return errorResponse(`Donations fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
