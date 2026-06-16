"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { LinkButton } from "@/components/ui/Button";
import { useBox } from "@/components/providers/BoxProvider";

const LINKS = [
  { href: "#build", label: "Build a box" },
  { href: "#quiz", label: "Find my DOSE" },
  { href: "#lines", label: "The lines" },
  { href: "#honesty", label: "What's in it" },
];

export function Nav() {
  const reduce = useReducedMotion();
  const box = useBox();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      className={[
        "sticky top-0 z-40 transition-colors duration-300",
        scrolled
          ? "border-b border-pine/10 bg-mint-light/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <a
          href="#top"
          className="rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raspberry"
          aria-label="DOSE — back to top"
        >
          <Wordmark variant="horizontal" height={30} />
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-pill px-3.5 py-2 text-sm font-semibold text-pine/80 transition-colors hover:bg-pine/5 hover:text-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raspberry"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LinkButton
            href="#build"
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <ShoppingBag size={16} strokeWidth={2.5} />
            Build my box
            {box.count > 0 && (
              <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-white/25 px-1 text-xs font-extrabold tabular-nums">
                {box.count}
              </span>
            )}
          </LinkButton>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-pill text-pine transition-colors hover:bg-pine/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raspberry lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default bg-[rgba(15,28,22,0.55)] backdrop-blur-sm"
              tabIndex={-1}
            />
            <motion.div
              className="absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col gap-1 bg-mint-light p-5 shadow-lift"
              initial={reduce ? { x: 0 } : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reduce ? { x: 0 } : { x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <Wordmark variant="horizontal" height={26} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-pill text-pine transition-colors hover:bg-pine/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raspberry"
                  aria-label="Close menu"
                >
                  <X size={22} strokeWidth={2.5} />
                </button>
              </div>

              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-gummy px-4 py-3 text-lg font-bold text-pine transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raspberry"
                >
                  {l.label}
                </a>
              ))}

              <LinkButton
                href="#build"
                variant="primary"
                size="lg"
                className="mt-3 w-full"
                onClick={() => setOpen(false)}
              >
                <ShoppingBag size={18} strokeWidth={2.5} />
                Build my box
                {box.count > 0 && (
                  <span className="ml-0.5 grid h-6 min-w-6 place-items-center rounded-full bg-white/25 px-1 text-sm font-extrabold tabular-nums">
                    {box.count}
                  </span>
                )}
              </LinkButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
