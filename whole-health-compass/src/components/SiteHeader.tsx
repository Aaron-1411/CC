import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const onLanding = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled ? "border-border bg-background/85 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg" aria-label={`${clinicConfig.name} — home`}>
          {clinicConfig.logoUrl ? (
            <img src={clinicConfig.logoUrl} alt={clinicConfig.name} className="h-8 w-auto" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Compass className="h-5 w-5" />
            </span>
          )}
          <span className="font-serif text-lg font-medium leading-none">{clinicConfig.logoText}</span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-3">
          {onLanding && (
            <>
              <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
                How it works
              </a>
              <a href="#safety" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
                Staying safe
              </a>
            </>
          )}
          <Link to="/learn" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
            Learn
          </Link>
          <Link to="/for-clinics" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
            For clinics
          </Link>
          {onLanding ? (
            <Link to="/compass" className={buttonClasses("primary", "sm")}>
              Start my Compass
            </Link>
          ) : (
            <a href={clinicConfig.bookingUrl} className={buttonClasses("primary", "sm")}>
              Book a consultation
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
