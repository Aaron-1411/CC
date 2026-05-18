import PageHeader from "@/components/PageHeader";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Not Financial Advice"
        description="What this toolkit is — and what it isn't."
        documentTitle="Disclaimer"
      />
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="border rounded-lg bg-warning/10 border-warning/40 p-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            The First-Time Buyer Toolkit provides <strong>information and calculations only</strong>.
            It is not regulated financial advice and is not a substitute for speaking to a qualified
            mortgage broker, solicitor, surveyor or financial adviser.
          </div>
        </div>

        <div className="prose prose-slate">
          <h2 className="font-serif text-2xl font-bold text-brand">What we do</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Run transparent calculations on the numbers you give us.</li>
            <li>Surface public data (HM Land Registry, ONS, Bank of England, EA flood maps, EPC, police.uk, TfL, etc.) with citations.</li>
            <li>Help you compare scenarios, areas and properties side by side.</li>
            <li>Show you what to ask, what to check and what to do next.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-brand mt-6">What we don't do</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Recommend a specific mortgage product, lender or property.</li>
            <li>Guarantee an estimated value, rate or future house price.</li>
            <li>Replace a Mortgage in Principle, AVM, valuation, survey, conveyancing search or legal advice.</li>
          </ul>

          <h2 className="font-serif text-2xl font-bold text-brand mt-6">Your responsibility</h2>
          <p>
            Property is the biggest purchase most people make. Always check the figures with a
            qualified professional before exchanging contracts or borrowing money. Past house-price
            performance is not a guide to future returns. Interest rates can rise as well as fall.
          </p>

          <h2 className="font-serif text-2xl font-bold text-brand mt-6">Data sources & freshness</h2>
          <p>
            See the <a href="/methodology" className="text-brand underline">Methodology page</a>
            for every dataset we use, when it was last refreshed and how each calculation is built.
          </p>
        </div>
      </div>
    </>
  );
}
