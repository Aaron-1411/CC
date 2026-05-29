import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Card, DataProvenance, ErrorNote, FlagPill, SectionHeader } from "@/components/primitives";
import { fmtGBP, relTime } from "@/lib/api";
import type { ProxyEnvelope } from "@/lib/proxy";

export const Route = createFileRoute("/crossref")({
  head: () => ({
    meta: [
      { title: "Cross-Reference Tool — transparenC" },
      { name: "description", content: "Search a company or person name across government contracts, political donations, ACOBA revolving door cases, and the lobbying register." },
    ],
  }),
  component: CrossRefPage,
});

type ContractResult = { id: string; title: string; organisationName: string; awardedSupplier: string; awardedValue: number; awardedDate?: string; procedureType?: string; link?: string };
type ContractsResp = { results: ContractResult[] };

type AcobaCase = { title: string; description?: string; url: string; date: string };
type AcobaResp = { cases: AcobaCase[] };

type LobbyingEntry = { name: string; clients?: string[]; activities?: string };
type LobbyingPub = { title: string; description?: string; url: string; date: string };
type LobbyingResp = { publications: LobbyingPub[]; registerEntries?: LobbyingEntry[] };

type Donation = { id?: string; party: string; donor: string; amount: number; receivedDate: string; type: string; nature?: string };
type DonationsResp = { donations: Donation[] };

type Results = {
  contracts: ContractResult[];
  acoba: AcobaCase[];
  lobbying: { publications: LobbyingPub[]; entries: LobbyingEntry[] };
  donations: Donation[];
};

type Status = "idle" | "loading" | "done" | "error";

function CrossRefPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<Results | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function search(q: string) {
    if (!q.trim()) return;
    setSubmitted(q.trim());
    setStatus("loading");
    setResults(null);
    setErrors([]);

    const errs: string[] = [];
    const term = q.trim().toLowerCase();

    const [contractsRes, acobaRes, lobbyingRes, donationsRes] = await Promise.allSettled([
      fetch("/api/contracts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: q.trim() }),
      }).then((r) => r.json() as Promise<ProxyEnvelope<ContractsResp>>),

      fetch("/api/acoba").then((r) => r.json() as Promise<ProxyEnvelope<AcobaResp>>),
      fetch("/api/lobbying").then((r) => r.json() as Promise<ProxyEnvelope<LobbyingResp>>),
      fetch(`/api/donations?party=${encodeURIComponent(q.trim())}`).then((r) => r.json() as Promise<ProxyEnvelope<DonationsResp>>),
    ]);

    let contracts: ContractResult[] = [];
    if (contractsRes.status === "fulfilled" && !contractsRes.value.error) {
      contracts = (contractsRes.value.data.results ?? []).filter((c) =>
        [c.title, c.organisationName, c.awardedSupplier].some((v) => v?.toLowerCase().includes(term)),
      );
    } else {
      errs.push("Contracts: " + (contractsRes.status === "rejected" ? contractsRes.reason : contractsRes.value.error));
    }

    let acobaItems: AcobaCase[] = [];
    if (acobaRes.status === "fulfilled" && !acobaRes.value.error) {
      acobaItems = (acobaRes.value.data.cases ?? []).filter((c) =>
        [c.title, c.description].some((v) => v?.toLowerCase().includes(term)),
      );
    } else {
      errs.push("ACOBA: " + (acobaRes.status === "rejected" ? acobaRes.reason : acobaRes.value.error));
    }

    let lobbyingPubs: LobbyingPub[] = [];
    let lobbyingEntries: LobbyingEntry[] = [];
    if (lobbyingRes.status === "fulfilled" && !lobbyingRes.value.error) {
      lobbyingPubs = (lobbyingRes.value.data.publications ?? []).filter((p) =>
        [p.title, p.description].some((v) => v?.toLowerCase().includes(term)),
      );
      lobbyingEntries = (lobbyingRes.value.data.registerEntries ?? []).filter((e) =>
        [e.name, ...(e.clients ?? [])].some((v) => v?.toLowerCase().includes(term)),
      );
    } else {
      errs.push("Lobbying: " + (lobbyingRes.status === "rejected" ? lobbyingRes.reason : lobbyingRes.value.error));
    }

    let donations: Donation[] = [];
    if (donationsRes.status === "fulfilled" && !donationsRes.value.error) {
      donations = (donationsRes.value.data.donations ?? []).filter((d) =>
        [d.donor, d.party].some((v) => v?.toLowerCase().includes(term)),
      );
    } else {
      errs.push("Donations: " + (donationsRes.status === "rejected" ? donationsRes.reason : (donationsRes.value as { error?: string }).error));
    }

    setResults({ contracts, acoba: acobaItems, lobbying: { publications: lobbyingPubs, entries: lobbyingEntries }, donations });
    setErrors(errs);
    setStatus("done");
  }

  const totalHits = results
    ? results.contracts.length + results.acoba.length + results.lobbying.publications.length + results.lobbying.entries.length + results.donations.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          eyebrow="Cross-Reference Tool"
          title="Follow the money and connections"
        />
        <p className="text-muted-foreground max-w-2xl">
          Search a company or person name across government contracts, political donations,
          the ACOBA revolving door register, and the lobbying register simultaneously.
          Uncover hidden connections between public money and private interests.
        </p>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2">
        {["Serco", "G4S", "Capita", "BAE Systems", "McKinsey"].map((example) => (
          <button
            key={example}
            onClick={() => { setQuery(example); search(example); }}
            className="px-3 py-1.5 bg-surface border border-border rounded-full label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber hover:border-amber/40 transition-colors"
          >
            {example}
          </button>
        ))}
        <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground self-center">— or type any name</span>
      </div>

      {/* Search box */}
      <Card>
        <form
          onSubmit={(e) => { e.preventDefault(); search(query); }}
          className="flex gap-3 items-center"
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Company or person name — e.g. Serco, G4S, BAE Systems, Nigel Farage…"
            className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:border-amber outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading" || !query.trim()}
            className="px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {status === "loading" ? "Searching…" : "Search →"}
          </button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-2 label-mono">
          Searches simultaneously: Contracts (£1m+) · Donations (Electoral Commission) · Revolving Door (ACOBA) · Lobbying Register
        </p>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e, i) => <ErrorNote key={i}>{e}</ErrorNote>)}
        </div>
      )}

      {/* Loading */}
      {status === "loading" && (
        <div className="text-muted-foreground text-sm text-center py-8 label-mono animate-pulse">
          Searching all databases for "{query}"…
        </div>
      )}

      {/* Results */}
      {status === "done" && results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-amber">{totalHits}</span>
            <span className="text-muted-foreground text-sm">
              {totalHits === 0 ? "matches found" : `matches found for "${submitted}"`}
            </span>
          </div>

          {totalHits === 0 && (
            <div className="text-muted-foreground text-sm py-8 text-center">
              No matches across any database. Try a broader search term.
            </div>
          )}

          {/* Party connection summary — aggregate donations by party */}
          {results.donations.length > 0 && (() => {
            const byParty = new Map<string, number>();
            for (const d of results.donations) {
              byParty.set(d.party, (byParty.get(d.party) ?? 0) + d.amount);
            }
            const sorted = Array.from(byParty.entries()).sort(([, a], [, b]) => b - a);
            return (
              <Card className="border-amber/20 bg-amber/5">
                <div className="label-mono text-[10px] uppercase tracking-wider text-amber mb-3">
                  Party connections — total donations matched
                </div>
                <div className="flex flex-wrap gap-4">
                  {sorted.map(([party, total]) => (
                    <div key={party}>
                      <div className="font-display text-xl font-bold text-amber">{fmtGBP(total)}</div>
                      <div className="label-mono text-[10px] text-muted-foreground uppercase tracking-wider">{party}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Total from {results.donations.length} donation{results.donations.length !== 1 ? "s" : ""} matching "{submitted}" across all parties in the Electoral Commission register.
                </p>
              </Card>
            );
          })()}

          {/* Contracts */}
          {results.contracts.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                Government Contracts
                <span className="label-mono text-xs text-muted-foreground font-normal">
                  {results.contracts.length} match{results.contracts.length !== 1 ? "es" : ""}
                </span>
              </h2>
              <div className="grid gap-2">
                {results.contracts.slice(0, 20).map((c) => (
                  <Card key={c.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 mb-1">
                          <FlagPill variant="neutral">Contract</FlagPill>
                          {c.procedureType?.toLowerCase().includes("direct") && (
                            <FlagPill variant="direct">Direct award</FlagPill>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm leading-snug">
                          {c.link ? <a href={c.link} target="_blank" rel="noreferrer" className="hover:text-amber">{c.title}</a> : c.title}
                        </h3>
                        <div className="text-xs text-muted-foreground mt-1 label-mono">
                          <span className="text-foreground">{c.organisationName}</span>
                          {c.awardedSupplier && c.awardedSupplier !== "—" && (
                            <> → <span className="text-amber">{c.awardedSupplier}</span></>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-xl font-bold text-amber">{fmtGBP(c.awardedValue)}</div>
                        {c.awardedDate && (
                          <div className="label-mono text-[10px] text-muted-foreground mt-0.5">
                            {relTime(c.awardedDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Donations */}
          {results.donations.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                Political Donations
                <span className="label-mono text-xs text-muted-foreground font-normal">
                  {results.donations.length} match{results.donations.length !== 1 ? "es" : ""}
                </span>
              </h2>
              <div className="grid gap-2">
                {results.donations.slice(0, 20).map((d, i) => (
                  <Card key={d.id ?? i}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 mb-1">
                          <FlagPill variant="neutral">Donation</FlagPill>
                        </div>
                        <div className="font-semibold text-sm">{d.donor}</div>
                        <div className="text-xs text-muted-foreground label-mono mt-0.5">
                          → <span className="text-amber">{d.party}</span>
                          <span className="ml-2">{d.type}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-xl font-bold text-amber">{fmtGBP(d.amount)}</div>
                        <div className="label-mono text-[10px] text-muted-foreground mt-0.5">
                          {relTime(d.receivedDate)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* ACOBA */}
          {results.acoba.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                Revolving Door (ACOBA)
                <span className="label-mono text-xs text-muted-foreground font-normal">
                  {results.acoba.length} match{results.acoba.length !== 1 ? "es" : ""}
                </span>
              </h2>
              <div className="grid gap-2">
                {results.acoba.slice(0, 10).map((a, i) => (
                  <Card key={i}>
                    <div className="flex gap-2 mb-1">
                      <FlagPill variant="direct">Revolving door</FlagPill>
                    </div>
                    <h3 className="font-semibold text-sm">
                      <a href={a.url} target="_blank" rel="noreferrer" className="hover:text-amber">{a.title}</a>
                    </h3>
                    {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                    <div className="label-mono text-[10px] text-muted-foreground mt-1">{relTime(a.date)}</div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Lobbying */}
          {(results.lobbying.publications.length > 0 || results.lobbying.entries.length > 0) && (
            <section>
              <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                Lobbying Register
                <span className="label-mono text-xs text-muted-foreground font-normal">
                  {results.lobbying.publications.length + results.lobbying.entries.length} match{results.lobbying.publications.length + results.lobbying.entries.length !== 1 ? "es" : ""}
                </span>
              </h2>
              <div className="grid gap-2">
                {results.lobbying.entries.slice(0, 10).map((e, i) => (
                  <Card key={i}>
                    <div className="flex gap-2 mb-1">
                      <FlagPill variant="neutral">Lobbyist</FlagPill>
                    </div>
                    <div className="font-semibold text-sm">{e.name}</div>
                    {e.clients && e.clients.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Clients: {e.clients.join(", ")}
                      </div>
                    )}
                  </Card>
                ))}
                {results.lobbying.publications.slice(0, 5).map((p, i) => (
                  <Card key={`pub-${i}`}>
                    <div className="flex gap-2 mb-1">
                      <FlagPill variant="neutral">Publication</FlagPill>
                    </div>
                    <h3 className="font-semibold text-sm">
                      <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-amber">{p.title}</a>
                    </h3>
                    <div className="label-mono text-[10px] text-muted-foreground mt-1">{relTime(p.date)}</div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <DataProvenance
        source="Contracts Finder · Electoral Commission · ACOBA via GOV.UK · ORCL"
        licence="Open Government Licence v3.0"
      />
    </div>
  );
}
