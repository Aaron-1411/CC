import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Calculator, BookOpen } from "lucide-react";
import { getGuide, relatedGuides } from "@/data/guides";
import { useDocumentTitle } from "@/hooks/use-document-title";

const AUDIENCE_LABEL: Record<string, string> = {
  "first-time-buyers": "First-time buyers",
  "house-hunters": "House hunters",
  "remortgagers": "Remortgagers",
  "all": "All buyers",
};

export default function GuideArticle() {
  const { slug = "" } = useParams();
  const guide = getGuide(slug);
  useDocumentTitle(guide?.title, guide?.summary);

  // Article + optional FAQPage JSON-LD for rich results.
  useEffect(() => {
    if (!guide) return;
    const tags: HTMLScriptElement[] = [];
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.summary,
      datePublished: guide.updated,
      dateModified: guide.updated,
      author: { "@type": "Organization", name: "Settld" },
      mainEntityOfPage: `${window.location.origin}/guides/${guide.slug}`,
    };
    const a = document.createElement("script");
    a.type = "application/ld+json";
    a.text = JSON.stringify(article);
    document.head.appendChild(a);
    tags.push(a);
    if (guide.faq?.length) {
      const faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      };
      const f = document.createElement("script");
      f.type = "application/ld+json";
      f.text = JSON.stringify(faq);
      document.head.appendChild(f);
      tags.push(f);
    }
    return () => { tags.forEach((t) => document.head.removeChild(t)); };
  }, [guide]);

  if (!guide) return <Navigate to="/guides" replace />;
  const related = relatedGuides(slug);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/guides" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> All guides
      </Link>
      <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-widest">
        {AUDIENCE_LABEL[guide.audience]}
      </Badge>
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand leading-tight">{guide.title}</h1>
      <p className="text-muted-foreground mt-3 text-base md:text-lg leading-relaxed">{guide.summary}</p>
      <p className="text-xs text-muted-foreground mt-3 inline-flex items-center gap-3">
        <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {guide.readMins} min read</span>
        <span>·</span>
        <span>Updated {new Date(guide.updated).toLocaleDateString("en-GB", { year: "numeric", month: "long" })}</span>
      </p>

      <div className="prose prose-sm sm:prose-base max-w-none mt-8 text-foreground">
        <p className="text-base leading-relaxed">{guide.intro}</p>
        {guide.sections.map((s) => (
          <section key={s.h2} className="mt-8">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-brand mt-0">{s.h2}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="leading-relaxed text-foreground/90">{p}</p>
            ))}
          </section>
        ))}

        {guide.faq && guide.faq.length > 0 && (
          <section className="mt-10">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-brand">Frequently asked questions</h2>
            <dl className="space-y-4 mt-4">
              {guide.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="text-muted-foreground mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {/* CTA — funnels article readers into the public calculator. */}
      <Card className="mt-10 p-6 bg-gradient-warm border-brand/30">
        <p className="font-serif text-lg font-bold text-brand">Ready to plan your full buying costs?</p>
        <p className="text-sm text-muted-foreground mt-1">
          Use our free True Cost Calculator — Stamp Duty, fees, surveys and more, all in one number.
        </p>
        <Button asChild className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to="/calculator">
            <Calculator className="h-4 w-4 mr-1.5" /> Open the True Cost Calculator
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </Card>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-xl font-bold text-brand mb-4">Related guides</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link key={r.slug} to={`/guides/${r.slug}`} className="group">
                <Card className="h-full p-4 hover:shadow-card hover:border-brand/40 transition-all">
                  <p className="font-serif font-bold text-brand text-sm leading-snug">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.summary}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
