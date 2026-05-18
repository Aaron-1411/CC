import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const KEY = "ftb-cookie-ack-v1";

/**
 * Minimal, no-tracking cookie banner. We only set strictly-necessary cookies,
 * so this is an acknowledgement rather than a consent gate. Dismisses to
 * localStorage so it never re-appears on the same device.
 */
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // private mode — safe to ignore
    }
  }, []);

  if (!show) return null;

  const ack = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-2 inset-x-2 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-50 bg-card border shadow-card rounded-lg p-4"
    >
      <div className="flex items-start gap-3">
        <Cookie className="w-5 h-5 text-brand shrink-0 mt-0.5" aria-hidden />
        <div className="text-sm">
          <div className="font-semibold text-brand">Cookies</div>
          <p className="text-muted-foreground mt-1">
            We use a few strictly-necessary cookies to keep you signed in. No tracking, no ads.
            See our <Link to="/privacy" className="text-brand underline">Privacy Policy</Link>.
          </p>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={ack} className="bg-brand text-brand-foreground hover:bg-brand/90">
              OK, got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
