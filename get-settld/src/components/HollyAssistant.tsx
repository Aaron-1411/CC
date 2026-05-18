import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

// Page-aware suggested prompts. Keep slugs aligned with routes in App.tsx.
// New pages without an entry fall through to GENERIC.
const GENERIC: string[] = [
  "What does 'Mortgage in Principle' actually mean?",
  "How much should I offer below asking price?",
  "What does the buying process look like, step by step?",
];

const SUGGESTIONS: Record<string, string[]> = {
  home: [
    "Where should a first-time buyer start?",
    "How much do I really need saved beyond the deposit?",
    "What's the difference between freehold and leasehold?",
  ],
  decide: [
    "How is the green/amber/red verdict calculated?",
    "What does 'fair price' actually mean?",
    "Should I trust an automated valuation?",
  ],
  mortgage: [
    "What is LTV and why does it matter?",
    "Fixed vs tracker — which is safer for a first-timer?",
    "How does the stress test affect what I can borrow?",
  ],
  remortgage: [
    "When should I start looking at a remortgage?",
    "What is an Early Repayment Charge?",
    "Is it worth paying a product fee for a lower rate?",
  ],
  "true-cost": [
    "What costs do first-time buyers usually forget?",
    "Do I pay stamp duty as a first-time buyer?",
    "How are LBTT and LTT different from SDLT?",
  ],
  deposit: [
    "How does the LISA bonus work?",
    "Is a 5% deposit really enough?",
    "How long should I expect saving to take?",
  ],
  schemes: [
    "Am I eligible for First Homes?",
    "How does Shared Ownership actually work?",
    "What schemes are most useful in 2026?",
  ],
  mip: [
    "Will an AIP affect my credit score?",
    "How long does an AIP last?",
    "Why was my AIP smaller than I expected?",
  ],
  avm: [
    "How accurate are automated valuations?",
    "What are 'comparables' and why do they matter?",
    "Is asking price the same as market value?",
  ],
  areas: [
    "What makes a 'good' area for value growth?",
    "How should I weigh schools vs commute time?",
    "Is the crime data reliable?",
  ],
  "data-twin": [
    "What is a 'lookalike' area?",
    "Why might a cheaper area still be a good fit?",
    "How do you decide which areas are similar?",
  ],
  risk: [
    "What's the difference between a HomeBuyer Report and a Full Structural Survey?",
    "How worried should I be about cladding?",
    "What is Japanese knotweed and why does it matter?",
  ],
  viewings: [
    "What should I look for at a viewing?",
    "What questions should I ask the estate agent?",
    "Signs of damp — what should I check for?",
  ],
  offer: [
    "How much below asking should I offer?",
    "What does 'gazumping' mean?",
    "How do I make my offer more attractive?",
  ],
  journey: [
    "How long does buying typically take?",
    "What happens between offer and exchange?",
    "What can go wrong before completion?",
  ],
  lease: [
    "Why is a short lease a problem?",
    "What is ground rent and is it changing?",
    "What does 'leasehold reform' mean for me?",
  ],
  shortlist: [
    "How should I compare two properties fairly?",
    "What makes one property a better long-term bet?",
    "Should I rule out leasehold flats?",
  ],
  "how-it-works": [
    "Where should I start in this toolkit?",
    "Which tool helps me decide if a price is fair?",
    "How do I export a report for my broker?",
  ],
};

const STORAGE_KEY = "holly.chat.v1";

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m: any) => m && (m.role === "user" || m.role === "assistant"));
  } catch { return []; }
}

function saveHistory(msgs: Msg[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-40))); } catch { /* ignore */ }
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/holly-chat`;

export default function HollyAssistant() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const seenWelcomeRef = useRef(false);

  const slug = useMemo(() => {
    const seg = pathname.replace(/^\/+/, "").split("/")[0] || "home";
    return seg;
  }, [pathname]);

  const suggestions = SUGGESTIONS[slug] ?? GENERIC;

  // Hide on auth and admin routes — chrome would be in the way and there's no value there.
  const hidden =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/__admin") ||
    pathname.startsWith("/admin");

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    // Auto-scroll to latest message as it streams in.
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // First-open welcome (only if no prior history).
  useEffect(() => {
    if (!open || seenWelcomeRef.current) return;
    seenWelcomeRef.current = true;
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content:
          "Hi, I'm **Holly** — your plain-English guide to buying your first home in the UK. " +
          "Ask me anything: jargon, process, what to expect at each stage. I won't give regulated financial advice, but I'll help you understand what questions to ask.",
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next,
          pageSlug: slug,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Holly couldn't respond." }));
        if (resp.status === 429) {
          toast({ title: "Holly is busy", description: "Please try again in a moment.", variant: "destructive" });
        } else if (resp.status === 402) {
          toast({ title: "AI credits exhausted", description: "Top up Lovable AI to continue.", variant: "destructive" });
        } else {
          toast({ title: "Couldn't reach Holly", description: err.error ?? "Network error.", variant: "destructive" });
        }
        setMessages(next); // drop empty assistant placeholder
        return;
      }
      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        textBuffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(payload);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error("holly stream error", e);
        toast({ title: "Holly stopped responding", description: "Please try again.", variant: "destructive" });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function clearChat() {
    abortRef.current?.abort();
    setMessages([]);
    seenWelcomeRef.current = false;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  if (hidden) return null;

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask Holly, your first-time buyer guide"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 group flex items-center gap-2 rounded-full bg-brand text-brand-foreground shadow-lg pl-3 pr-4 py-3 hover:bg-brand/90 transition-all hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-brand-foreground/15">
            <Sparkles className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
          </span>
          <span className="text-sm font-medium">Ask Holly</span>
        </button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="p-0 w-full sm:max-w-md flex flex-col gap-0 [&>button]:text-brand-foreground"
        >
          <SheetHeader className="bg-brand text-brand-foreground p-4 pr-12 space-y-1">
            <SheetTitle className="text-brand-foreground flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-foreground/15">
                <Sparkles className="h-4 w-4" />
              </span>
              Holly — your buying guide
            </SheetTitle>
            <SheetDescription className="text-brand-foreground/80 text-xs">
              Plain-English answers about UK home buying. Not regulated advice.
            </SheetDescription>
          </SheetHeader>

          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-sm shadow-sm max-w-[85%] break-words",
                    m.role === "user"
                      ? "bg-brand text-brand-foreground rounded-br-sm"
                      : "bg-card border rounded-bl-sm",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mt-2 prose-headings:mb-1">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
            ))}
            {streaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-card border shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Suggestions — context-aware to current page */}
          {messages.filter((m) => m.role === "user").length === 0 && (
            <div className="px-4 pt-3 pb-1 border-t bg-card">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Try asking
              </div>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    disabled={streaming}
                    className="text-left text-sm px-3 py-2 rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            className="border-t p-3 flex items-end gap-2 bg-card"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Holly anything…"
              disabled={streaming}
              aria-label="Message Holly"
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={streaming || !input.trim()}
              className="bg-brand text-brand-foreground hover:bg-brand/90 shrink-0"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={clearChat}
                aria-label="Start a new chat"
                className="shrink-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
