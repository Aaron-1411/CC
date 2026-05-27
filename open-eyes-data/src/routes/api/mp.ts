import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { cached, jsonResponse, errorResponse } from "@/lib/proxy";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MPVote = {
  divisionId: number;
  title: string;
  date: string;
  votedAye: boolean;
  tiedVote: boolean;
  actedAsTeller: boolean;
};

export type MPInterest = {
  category: string;
  description: string;
  registeredLate: boolean;
  interestId: number;
};

export type MPProfile = {
  id: number;
  name: string;
  party: string;
  constituency: string;
  recentVotes: MPVote[];
  interests: MPInterest[];
};

// ─── Fetch votes ──────────────────────────────────────────────────────────────

type ParliamentVotingItem = {
  value: {
    divisionId: number;
    divisionTitle: string;
    date: string;
    memberVotedAye: boolean;
    tiedVote: boolean;
    actedAsTeller: boolean;
  };
};

async function fetchVotes(memberId: number): Promise<MPVote[]> {
  const res = await fetch(
    `https://members-api.parliament.uk/api/Members/${memberId}/Voting?house=Commons&page=1`,
    {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!res.ok) throw new Error(`Votes API: ${res.status}`);
  const data = (await res.json()) as { items: ParliamentVotingItem[] };
  return (data.items ?? []).slice(0, 20).map((i) => ({
    divisionId: i.value.divisionId,
    title: i.value.divisionTitle,
    date: i.value.date,
    votedAye: i.value.memberVotedAye,
    tiedVote: i.value.tiedVote,
    actedAsTeller: i.value.actedAsTeller,
  }));
}

// ─── Fetch financial interests ────────────────────────────────────────────────

type ParliamentInterest = {
  id: number;
  interests: Array<{
    id: number;
    category: { name: string };
    summary: string;
    registeredLate: boolean;
  }>;
};

async function fetchInterests(memberId: number): Promise<MPInterest[]> {
  const res = await fetch(
    `https://members-api.parliament.uk/api/Members/${memberId}/RegisteredInterests`,
    {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!res.ok) throw new Error(`Interests API: ${res.status}`);
  const data = (await res.json()) as { value: ParliamentInterest[] };
  const interests: MPInterest[] = [];
  for (const category of data.value ?? []) {
    for (const interest of category.interests ?? []) {
      interests.push({
        category: interest.category?.name ?? "Other",
        description: interest.summary ?? "",
        registeredLate: interest.registeredLate ?? false,
        interestId: interest.id,
      });
    }
  }
  return interests;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/mp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const idParam = url.searchParams.get("id");
        const memberId = idParam ? parseInt(idParam, 10) : NaN;
        if (isNaN(memberId)) {
          return errorResponse("id parameter required (Parliament member ID)", 400);
        }
        try {
          const [votes, interests] = await Promise.all([
            cached(`mp:votes:${memberId}`, 4 * 60 * 60_000, () => fetchVotes(memberId)),
            cached(`mp:interests:${memberId}`, 24 * 60 * 60_000, () => fetchInterests(memberId)),
          ]);
          return jsonResponse({
            data: { id: memberId, recentVotes: votes, interests },
            meta: { fetchedAt: new Date().toISOString() },
          });
        } catch (e) {
          return errorResponse(`MP data fetch failed: ${(e as Error).message}`);
        }
      },
    },
  },
});
