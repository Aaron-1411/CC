import { Link } from "react-router-dom";
import { Compass, ShieldCheck } from "lucide-react";
import { clinicConfig } from "@/config/clinic";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Compass className="h-4.5 w-4.5" />
              </span>
              <span className="font-serif text-lg">{clinicConfig.name}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{clinicConfig.aboutBlurb}</p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <a href={clinicConfig.bookingUrl} className="font-medium text-foreground hover:text-primary">
              Book a consultation
            </a>
            {clinicConfig.contactEmail && (
              <a href={`mailto:${clinicConfig.contactEmail}`} className="text-muted-foreground hover:text-foreground">
                {clinicConfig.contactEmail}
              </a>
            )}
            {clinicConfig.contactPhone && (
              <a href={`tel:${clinicConfig.contactPhone}`} className="text-muted-foreground hover:text-foreground">
                {clinicConfig.contactPhone}
              </a>
            )}
            <Link to="/about" className="text-muted-foreground hover:text-foreground">About this tool</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy & your data</Link>
            <Link to="/compliance" className="text-muted-foreground hover:text-foreground">Compliance & safety</Link>
            <Link to="/for-clinics" className="text-muted-foreground hover:text-foreground">For clinics</Link>
            <Link to="/clinic" className="text-muted-foreground hover:text-foreground">Clinic login</Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            This tool provides general education and is not medical advice. It always routes you to a qualified,
            registered practitioner.
          </p>
          <p>© {new Date().getFullYear()} {clinicConfig.name}</p>
        </div>
      </div>
    </footer>
  );
}
