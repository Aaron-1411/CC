# Mission — Whole Health Compass

> Help a person understand their health from every angle, then walk them to the
> right qualified practitioner — without ever pretending to be one.

---

## What this is

Whole Health Compass (WHC) is a patient-facing web app that a clinic runs under
its own brand. A visitor describes a health concern through a short guided form,
or browses the `/learn` knowledge base, and receives an **education-only
"Compass"**: a side-by-side view of how different medical traditions —
conventional/Western, Traditional Chinese Medicine, and Ayurveda — make sense of
that concern. For each tradition the Compass shows how it sees the concern, what
it tends to *link* the concern to, what a practitioner of that tradition looks
at, the *kinds* of approaches it draws on, and who you'd actually see.

Every route — guided journey or knowledge base — ends the same way: a calm,
explicit hand-off to a **qualified, registered practitioner.** The app explains;
it never treats.

## Why it exists

Most people meet their health with very little shared language for it. They feel
"tired all the time" or "wound up and not sleeping" and don't know whether that's
a GP conversation, a nutrition conversation, an acupuncture conversation, or all
three. They arrive at appointments unprepared, under-informed, and quietly
anxious — and they often dismiss whole traditions of care they've never had
explained to them fairly.

WHC exists to close that gap respectfully. It gives a person an honest,
plural, side-by-side map *before* the appointment — so they arrive understood,
oriented, and ready to have a better conversation with a real human who can
actually help.

## Who it serves

- **The patient / visitor** — gets free, trustworthy, jargon-light education that
  respects more than one way of understanding the body, and a clear next step.
- **The clinic** — gets a white-label front door that educates visitors, earns
  trust, and converts genuine interest into booked enquiries. One config file
  re-skins the whole app for a clinic (brand, content, contact) in minutes; a
  pluggable **content pack** re-targets it at a different specialism with no app
  changes.

## What we are trying to do (aims)

1. **Make every visitor arrive understood and prepared.** The output is a
   conversation-starter for a real appointment, not a verdict.
2. **Present traditions as equals.** Conventional, TCM and Ayurvedic lenses sit
   side by side, none ranked above another, each described in its own terms and
   the language it uses for itself.
3. **Always route to a qualified, registered human.** Education is the on-ramp;
   the destination is always a regulated practitioner. Safety and the clinic's
   booking funnel are the same line.
4. **Be honest by default.** No efficacy claims, no invented testimonials, no
   dark patterns. The product degrades gracefully and shows the real state of
   things — including when a feature isn't configured.
5. **Be auditable.** Curated content carries visible provenance (who reviewed it,
   when, against which public sources) so "static copy" becomes a
   regulator-ready, trust-building asset.
6. **Be re-targetable.** The content-pack architecture lets WHC become a
   different clinic, or a different specialism entirely, without touching the app.

## Principles we will not trade away

These are the spine of the product. They are baked into the content layer, not
left to the author's discretion, and they hold for **every** concern, tradition,
pack and surface.

WHC is **education only**. It:

- **never diagnoses** — it describes how a tradition *tends* to think, never what
  *you* have;
- **never names** a remedy, herb, formula, supplement or dose;
- **never claims** any approach treats, cures, or works;
- **never ranks** one tradition above another;
- **always routes** every path to a qualified, registered practitioner.

What is allowed: naming *categories* of care ("acupuncture", "talking therapy",
physiotherapy) and **safety-framed**, tradition-level notes (e.g. using a
registered herbal practitioner and telling your GP and pharmacist; the
heavy-metal caution around some traditional herbal-mineral preparations). What is
never allowed: specific herbs, formulas, doses, or efficacy claims.

> If a proposed change would let the app diagnose, prescribe, rank, or claim a
> cure — the change is wrong, however helpful it looks. The compliance line wins.

## How it delivers

| Surface | What it does |
| --- | --- |
| `/` | The branded front door and the live sample Compass. |
| `/compass` | The short guided journey → a personalised, education-only Compass. |
| `/learn`, `/learn/:id` | A browseable, demographic-aware knowledge base over the same curated content. |
| `/compliance` | The content-governance page — provenance, review, and the safety stance, in the open. |
| `/for-clinics` | The white-label pitch for the practice. |
| `/clinic` | The clinic's enquiry + funnel dashboard. |

Under the hood: one curated **content pack** (the flagship *integrative* pack —
three traditions, nine concerns, plus the knowledge base) drives both the guided
journey and the knowledge base through a single comparative-lens component, so
the rules and the sourcing are enforced in one place and inherited everywhere.

## What success looks like

- A visitor leaves able to say, in their own words, *what they want to ask and
  who they want to ask* — and feels respected, not sold to.
- A clinic sees more, better-prepared enquiries, and can stand behind every word
  on the site because the provenance is on the page.
- Not a single screen does anything a regulator, a GP, or a careful patient would
  object to.

## What this is deliberately NOT

- **Not a diagnosis or triage tool.** It orients; it does not assess or decide.
- **Not a recommendation engine.** It never tells you which tradition is "best"
  or what to take.
- **Not a replacement for care.** It is the considered five minutes *before* you
  see someone who can actually help — and it always sends you to them.
