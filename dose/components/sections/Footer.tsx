import { Instagram, Twitter, Youtube } from "lucide-react";
import { COLORS } from "@/lib/brand";
import { Wordmark } from "@/components/brand/Wordmark";

interface FooterLink {
  href: string;
  label: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { href: "#build", label: "Build a box" },
      { href: "#quiz", label: "Find my DOSE" },
      { href: "#lines", label: "EVERYDAY" },
      { href: "#lines", label: "FUEL" },
    ],
  },
  {
    title: "The honest bit",
    links: [
      { href: "#honesty", label: "What's actually in it" },
      { href: "#honesty", label: "Lab results" },
      { href: "#waitlist", label: "Join the waitlist" },
    ],
  },
];

const SOCIALS = [
  { href: "#", label: "DOSE on Instagram", Icon: Instagram },
  { href: "#", label: "DOSE on TikTok", Icon: Twitter },
  { href: "#", label: "DOSE on YouTube", Icon: Youtube },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-ink text-white/70">
      <div
        className="pointer-events-none absolute inset-0 candy-dots opacity-[0.05]"
        style={{ color: COLORS.white }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-5 py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* brand lockup */}
          <div>
            <a
              href="#top"
              className="inline-flex rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
              aria-label="DOSE — back to top"
            >
              <Wordmark
                variant="horizontal"
                height={30}
                color={COLORS.white}
                accent={COLORS.sun}
              />
            </a>
            <p className="mt-4 max-w-xs font-serif text-lg italic text-white/80">
              Kick the sugar, keep the sweet.
            </p>
            <p className="mt-3 max-w-xs text-sm text-white/55">
              Low-sugar sweets that taste like the real thing — made honestly, tested
              properly, and built to eat the whole pack.
            </p>

            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.07] text-white/70 transition-colors hover:bg-sun hover:text-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
                >
                  <Icon size={18} strokeWidth={2.25} />
                </a>
              ))}
            </div>
          </div>

          {/* link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-sun">
                {col.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-sun"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* age-gate + honesty note */}
        <div className="mt-12 rounded-gummy bg-white/[0.05] px-5 py-4 text-xs leading-relaxed text-white/50">
          <span className="font-bold text-white/70">A quick honest note:</span> FUEL packs
          contain caffeine and are strictly for ages 16+. DOSE sweets are treats, not
          medicine — we make no health or medical claims. Sugar and calorie figures are
          per pack as sold and independently tested. This is a concept site; nothing is on
          sale yet.
        </div>

        {/* bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
          <p>&copy; {year} DOSE. All sweets reserved.</p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <li>
              <a
                href="#"
                className="transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
              >
                Privacy
              </a>
            </li>
            <li>
              <a
                href="#"
                className="transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
              >
                Terms
              </a>
            </li>
            <li>
              <a
                href="#"
                className="transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
