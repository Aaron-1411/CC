import { Link } from "react-router-dom";

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t bg-card/40 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid gap-6 md:grid-cols-4 text-sm">
        <div>
          <img src="/logo-settld.png" alt="settld" className="h-9 sm:h-10 md:h-11 w-auto object-contain mx-auto md:mx-0" />
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            The free first-time buyer toolkit. Independent, plain-English, UK only.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Tools</div>
          <ul className="space-y-1.5">
            <li><Link to="/calculator" className="hover:text-brand">True Cost Calculator</Link></li>
            <li><Link to="/decide" className="hover:text-brand">Quick verdict</Link></li>
            <li><Link to="/mortgage" className="hover:text-brand">Affordability</Link></li>
            <li><Link to="/areas" className="hover:text-brand">Areas</Link></li>
            <li><Link to="/journey" className="hover:text-brand">Buying journey</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">About</div>
          <ul className="space-y-1.5">
            <li><Link to="/how-it-works" className="hover:text-brand">How it works</Link></li>
            <li><Link to="/guides" className="hover:text-brand">Guides</Link></li>
            <li><Link to="/methodology" className="hover:text-brand">Methodology & data</Link></li>
            <li><Link to="/faqs" className="hover:text-brand">FAQs</Link></li>
            <li><Link to="/glossary" className="hover:text-brand">Glossary</Link></li>
            <li><Link to="/contact" className="hover:text-brand">Contact & support</Link></li>
            <li><Link to="/disclaimer" className="hover:text-brand">Not financial advice</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Legal</div>
          <ul className="space-y-1.5">
            <li><Link to="/privacy" className="hover:text-brand">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-brand">Terms of Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div>© {year} settld · First-Time Buyer Toolkit. Information only — not regulated financial advice.</div>
          <div className="flex items-center gap-2">
            <span>Made in the UK · Data: HM Land Registry, ONS, BoE, EA, EPC, police.uk, TfL</span>
            {/* Hidden admin entry — discoverable via the dot, not labelled. */}
            <Link
              to="/__admin"
              aria-label="Staff"
              title=""
              className="text-muted-foreground/30 hover:text-muted-foreground select-none"
            >
              ·
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
