"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WaitlistFormProps {
  /** Visual theme — dark sits on pine, light sits on mint. */
  tone?: "light" | "dark";
  className?: string;
  /** Where the signup came from, for the (stubbed) analytics log. */
  source?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm({
  tone = "light",
  className,
  source = "hero",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError("That email looks a little off — mind checking it?");
      return;
    }
    setError(null);
    // TODO(waitlist): POST to a real list (Klaviyo / Resend audience) when backend lands.
    console.info("[DOSE waitlist] signup", { email, source });
    setDone(true);
  }

  const dark = tone === "dark";
  const inputBase =
    "w-full rounded-pill px-5 py-3.5 text-sm font-medium outline-none transition-shadow placeholder:font-normal";
  const inputTone = dark
    ? "bg-white/10 text-white placeholder:text-white/50 focus:bg-white/15 focus:ring-2 focus:ring-sun"
    : "bg-white text-ink placeholder:text-ink/40 shadow-soft focus:ring-2 focus:ring-raspberry";

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={[
              "flex items-center gap-3 rounded-pill px-5 py-3.5 text-sm font-semibold",
              dark ? "bg-sun text-ink" : "bg-pine text-white",
            ].join(" ")}
            role="status"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/10">
              <Check size={16} strokeWidth={3} />
            </span>
            You&apos;re on the list. We&apos;ll be in touch before the first drop.
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submit}
            noValidate
            className="flex flex-col gap-2.5 sm:flex-row"
          >
            <label htmlFor={`waitlist-${source}`} className="sr-only">
              Email address
            </label>
            <input
              id={`waitlist-${source}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `waitlist-${source}-err` : undefined}
              className={[inputBase, inputTone, "sm:flex-1"].join(" ")}
            />
            <Button
              type="submit"
              variant={dark ? "sun" : "primary"}
              size="md"
              className="shrink-0 px-6"
            >
              Get early access
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {error && (
        <p
          id={`waitlist-${source}-err`}
          className={[
            "mt-2 px-2 text-xs font-medium",
            dark ? "text-sun" : "text-raspberry",
          ].join(" ")}
        >
          {error}
        </p>
      )}
    </div>
  );
}
