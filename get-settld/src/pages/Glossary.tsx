import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { GLOSSARY } from "@/components/Jargon";

export default function Glossary() {
  const [q, setQ] = useState("");
  const entries = Object.entries(GLOSSARY)
    .map(([k, v]) => ({ key: k, ...v }))
    .filter((e) => {
      if (!q) return true;
      const hay = `${e.key} ${e.short} ${e.long ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Plain-English glossary"
        description="Every acronym and bit of jargon used across the toolkit, in normal language."
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search the glossary (e.g. ERC, leasehold, EPC)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {entries.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">No terms match "{q}".</Card>
        ) : (
          <Card className="divide-y">
            {entries.map((e) => (
              <div key={e.key} className="p-4 sm:p-5">
                <p className="font-serif text-lg font-semibold text-brand">{e.key}</p>
                <p className="text-sm mt-1">{e.short}</p>
                {e.long && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{e.long}</p>}
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
