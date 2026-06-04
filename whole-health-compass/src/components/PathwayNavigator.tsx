import { Backpack, MessageCircleQuestion, ClipboardList, Clock, CalendarCheck, ArrowRight } from "lucide-react";
import { Card, Eyebrow, buttonClasses } from "@/components/ui";
import { clinicConfig } from "@/config/clinic";

const STEPS = [
  {
    icon: <Backpack className="h-5 w-5" />,
    title: "What to bring",
    body: "Your practitioner summary, a list of any medicines and supplements you take, and a note of anything that's been worrying you. Nothing formal — just what helps you tell your story.",
  },
  {
    icon: <MessageCircleQuestion className="h-5 w-5" />,
    title: "Good questions to ask",
    body: "“How do you see what's going on?”, “What would the first steps look like?”, “How will we know if it's helping?”, and “How do conventional and traditional approaches fit together for me?”",
  },
  {
    icon: <ClipboardList className="h-5 w-5" />,
    title: "What a first visit involves",
    body: "Usually an unhurried conversation about your history, lifestyle and goals. Your practitioner listens, asks questions, and explains how they understand your situation — then you decide together what's next.",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "How long it takes",
    body: "A first consultation is typically longer than a standard GP appointment — often 45–60 minutes — because there's more space to understand the whole picture.",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    title: "How follow-ups work",
    body: "Care is usually a series of steps, reviewed as you go. You stay in control, and every decision is made with a qualified practitioner — never automatically.",
  },
];

export function PathwayNavigator() {
  return (
    <div>
      <div className="mb-5">
        <Eyebrow>What happens next</Eyebrow>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl">Knowing what to expect from your first visit</h2>
        <p className="measure mt-2 text-muted-foreground">
          No surprises — here's what a first consultation at an integrative practice usually looks like.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <Card key={i} className="flex gap-4 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              {s.icon}
            </span>
            <div>
              <h3 className="font-serif text-lg leading-tight">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </Card>
        ))}
        <Card className="flex flex-col items-start justify-center gap-3 bg-primary p-5 text-primary-foreground">
          <h3 className="font-serif text-xl leading-tight text-primary-foreground">Ready when you are</h3>
          <p className="text-sm leading-relaxed text-primary-foreground/85">
            When it feels right, book a consultation with {clinicConfig.name}. A real practitioner takes it from here.
          </p>
          <a href={clinicConfig.bookingUrl} className={buttonClasses("accent", "md")}>
            Book a consultation
            <ArrowRight className="h-4 w-4" />
          </a>
        </Card>
      </div>
    </div>
  );
}
