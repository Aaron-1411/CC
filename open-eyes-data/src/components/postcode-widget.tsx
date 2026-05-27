import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useConstituency } from "@/hooks/useConstituency";
import { cn } from "@/lib/utils";

// ─── Compact bar (for header / page tops) ────────────────────────────────────

export function PostcodeBar({ className }: { className?: string }) {
  const { data, loading, error, lookup, clear } = useConstituency();
  const [input, setInput] = useState("");

  if (data) {
    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        <span className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Your area:</span>
        <Link
          to="/my-area"
          className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
        >
          {data.constituency}
        </Link>
        <span className="text-muted-foreground/40">·</span>
        <button
          onClick={clear}
          className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (input.trim().length >= 5) lookup(input);
      }}
      className={cn("flex items-center gap-1.5", className)}
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value.toUpperCase())}
        placeholder="Postcode"
        maxLength={8}
        className="w-24 bg-background border border-border rounded px-2 py-1 text-xs label-mono uppercase focus:border-amber outline-none placeholder:normal-case placeholder:text-muted-foreground/50"
      />
      <button
        type="submit"
        disabled={loading || input.trim().length < 5}
        className="px-2 py-1 bg-amber/10 border border-amber/30 rounded label-mono text-[10px] uppercase tracking-wider text-amber hover:bg-amber/20 disabled:opacity-40"
      >
        {loading ? "…" : "Go"}
      </button>
      {error && <span className="text-[10px] text-flag">{error}</span>}
    </form>
  );
}

// ─── Full widget (for homepage / my-area page) ───────────────────────────────

export function PostcodeWidget() {
  const { data, loading, error, lookup, clear } = useConstituency();
  const [input, setInput] = useState("");

  if (data) {
    return (
      <div className="rounded-lg border border-amber/20 bg-amber/5 p-5">
        <div className="label-mono text-[10px] uppercase tracking-wider text-amber mb-2">Your area</div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-display text-xl font-bold">{data.constituency}</div>
            <div className="text-sm text-muted-foreground">{data.localAuthority}{data.region ? ` · ${data.region}` : ""}</div>
            {data.mp && (
              <div className="flex items-center gap-2 mt-2">
                {data.mp.thumbnailUrl && (
                  <img
                    src={data.mp.thumbnailUrl}
                    alt={data.mp.name}
                    className="w-8 h-8 rounded-full object-cover border border-border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div>
                  <div className="font-semibold text-sm">{data.mp.name}</div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: data.mp.partyColour }}
                    />
                    <span className="label-mono text-[10px] text-muted-foreground">{data.mp.party}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              to="/my-area"
              className="px-3 py-2 bg-amber text-amber-foreground rounded label-mono text-[10px] uppercase tracking-wider text-center hover:opacity-90"
            >
              View my area →
            </Link>
            <button
              onClick={clear}
              className="px-3 py-1 border border-border rounded label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground text-center"
            >
              Change postcode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        Personalise this app
      </div>
      <h3 className="font-display text-lg font-bold mb-1">Enter your postcode</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        See your MP's voting record, local policing data, and which issues affect your area — all filtered to where you live.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim().length >= 5) lookup(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="e.g. SW1A 1AA"
          maxLength={8}
          className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm label-mono uppercase focus:border-amber outline-none min-w-0 placeholder:normal-case placeholder:text-muted-foreground/50"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length < 5}
          className="px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider disabled:opacity-50 shrink-0"
        >
          {loading ? "Looking up…" : "Find my area"}
        </button>
      </form>
      {error && (
        <p className="text-sm text-flag mt-2">{error === "Postcode not found" ? "Postcode not found — try a different format" : `Error: ${error}`}</p>
      )}
      <p className="label-mono text-[9px] text-muted-foreground/60 mt-3">
        Your postcode is stored only in your browser. It is never sent to our servers or shared.
      </p>
    </div>
  );
}
