import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";

const NotFound = () => {
  const location = useLocation();
  useDocumentTitle("Page not found");

  useEffect(() => {
    console.warn("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-muted text-brand mb-6">
          <Compass className="w-7 h-7" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-brand font-semibold">Error 404</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand mt-3 leading-tight">
          We can't find that page.
        </h1>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          The link may be broken or the page might have moved. Let's get you back on track —
          every tool is one click away from the home screen.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Link to="/"><Home className="w-4 h-4 mr-1.5" /> Go to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/decide"><ArrowLeft className="w-4 h-4 mr-1.5" /> Quick verdict</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-6 font-mono break-all">
          {location.pathname}
        </p>
      </div>
    </div>
  );
};

export default NotFound;
