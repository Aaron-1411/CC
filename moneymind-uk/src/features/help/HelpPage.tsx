import { ExternalLink, Phone, Heart } from "lucide-react";
import { helpServices } from "../../content/help";
import { PageContainer } from "../../components/PageContainer";
import { Card } from "../../components/Card";
import { Pill } from "../../components/Pill";

export function HelpPage() {
  return (
    <PageContainer className="py-10">
      <h1 className="text-3xl font-bold text-navy-900">Find Free Help</h1>
      <p className="mt-2 max-w-2xl text-navy-500">
        You don't have to sort money worries out alone. These UK organisations are independent and free
        at the point of use. Numbers starting 0800, 0808 or 116 are free to call from UK landlines and
        mobiles.
      </p>

      {/* Crisis note */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <Heart className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p>
          If money worries are affecting how you feel, you can talk to <strong>Samaritans</strong> any
          time, day or night, on <a href="tel:116123" className="font-semibold underline">116 123</a> —
          free and confidential.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {helpServices.map((s) => (
          <Card key={s.name} className="flex flex-col gap-2.5" hover>
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold leading-snug text-navy-900">{s.name}</h2>
              <Pill variant="neutral" className="shrink-0">{s.category}</Pill>
            </div>
            <p className="flex-1 text-sm leading-relaxed text-navy-500">{s.description}</p>

            {s.phone && (
              <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-emerald-700">
                <Phone className="h-3.5 w-3.5" aria-hidden />
                <span className="tabular-nums">{s.phone}</span>
                {s.freephone && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Free</span>}
              </a>
            )}

            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
            >
              Visit website <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
