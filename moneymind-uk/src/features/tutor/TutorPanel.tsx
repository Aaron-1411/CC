import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { SlidePanel } from "../../components/SlidePanel";
import { Markdown } from "../../components/Markdown";
import type { ModuleId } from "../../lib/types";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface TutorPanelProps {
  open: boolean;
  onClose: () => void;
  moduleId: ModuleId;
  moduleTitle: string;
  suggestedQuestions: string[];
}

export function TutorPanel({ open, onClose, moduleId, moduleTitle, suggestedQuestions }: TutorPanelProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ moduleId, messages: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string };
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "Sorry — something went wrong. Please try again." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry — I couldn't reach the tutor. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SlidePanel open={open} onClose={onClose} title="AI Tutor">
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-navy-100 bg-navy-50 px-5 py-2.5 text-xs text-navy-500">
          Friendly guidance on <span className="font-medium text-navy-700">{moduleTitle}</span> using UK
          figures — not regulated financial advice.
        </div>

        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-navy-700">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-sm font-medium">Ask me anything about this topic.</p>
              </div>
              <div className="flex flex-col gap-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-left text-sm text-navy-700 transition-colors duration-150 ease-out hover:border-emerald-400 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-500 px-3.5 py-2.5 text-sm text-white"
                    : "mr-auto max-w-[90%] rounded-2xl rounded-bl-sm bg-navy-50 px-3.5 py-2.5 text-navy-800"
                }
              >
                {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
              </div>
            ))
          )}
          {loading && (
            <div className="mr-auto flex items-center gap-1 rounded-2xl rounded-bl-sm bg-navy-50 px-4 py-3">
              <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex shrink-0 items-center gap-2 border-t border-navy-100 p-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            aria-label="Your question for the tutor"
            className="flex-1 rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white transition-[background-color,transform] duration-150 ease-out hover:bg-emerald-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-40 disabled:active:scale-100"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </SlidePanel>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return <span className="h-2 w-2 animate-bounce rounded-full bg-navy-300" style={{ animationDelay: delay }} />;
}
