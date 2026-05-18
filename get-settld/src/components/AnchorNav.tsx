// Sticky in-page anchor nav for long pages (Decide, True Cost, Risk).
// Pass `sections` and it scroll-spies as you read.
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface Section { id: string; label: string }

export default function AnchorNav({ sections, className }: { sections: Section[]; className?: string }) {
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="On this page"
      className={cn(
        "hidden lg:block sticky top-32 self-start max-h-[calc(100vh-9rem)] overflow-auto",
        className,
      )}
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">On this page</p>
      <ul className="space-y-1 border-l">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={cn(
                "block pl-3 -ml-px border-l text-xs py-1 transition-colors",
                active === s.id
                  ? "border-brand text-brand font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
