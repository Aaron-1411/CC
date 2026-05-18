import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GUIDES } from "@/data/guides";
import { ArrowRight, BookOpen } from "lucide-react";
import { useEffect } from "react";

const AUDIENCE_LABEL: Record<string, string> = {
  "first-time-buyers": "First-time buyers",
  "house-hunters": "House hunters",
  "remortgagers": "Remortgagers",
  "all": "All buyers",
};

export default function Guides() {
  // Inject ItemList JSON-LD for the article index — helps Google surface guides.
  useEffect(() => {
    const ld = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: GUIDES.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${window.location.origin}/guides/${g.slug}`,
        name: g.title,
      })),
    };
    const tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.text = JSON.stringify(ld);
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Guides"
        title="UK Home-Buying Guides"
        description="Plain-English explainers on Stamp Duty, surveys, conveyancing, schemes and more — written for first-time buyers and house hunters."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUIDES.map((g) => (
            <Link key={g.slug} to={`/guides/${g.slug}`} className="group">
              <Card className="h-full p-5 hover:shadow-card hover:border-brand/40 transition-all flex flex-col">
                <Badge variant="outline" className="self-start mb-3 text-[10px] uppercase tracking-widest">
                  {AUDIENCE_LABEL[g.audience]}
                </Badge>
                <h2 className="font-serif text-lg font-bold text-brand leading-snug">{g.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{g.summary}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> {g.readMins} min read
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-brand">
                    Read <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
