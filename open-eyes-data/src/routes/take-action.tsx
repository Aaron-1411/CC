import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/take-action")({
  head: () => ({
    meta: [
      { title: "Take Action — transparenC" },
      {
        name: "description",
        content:
          "How to use transparenC to hold government to account — and how everyone, at every age, can participate in UK democracy and drive real change.",
      },
      { property: "og:title", content: "Take Action — transparenC" },
    ],
  }),
  component: TakeActionPage,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const HOW_TO_STEPS = [
  {
    n: "01",
    title: "Pick an issue that matters to you",
    body: "Start with the Issues page. Choose NHS, housing, the economy, crime, environment, immigration or education to see the data in plain English — or read the Learn guide for how the system works.",
    link: { to: "/issues", label: "Browse issues →" },
  },
  {
    n: "02",
    title: "See what politicians promised — and what they delivered",
    body: "The Parties page shows every major party's pledges with a labelled delivery status — from Delivered to Off track — each with its evidence and source. All parties are assessed against the same published rubric.",
    link: { to: "/parties", label: "Check pledges →" },
  },
  {
    n: "03",
    title: "Follow the money",
    body: "Government contracts, MP expenses, party donations and lobbying are all in one place. Search by keyword, company or minister. Every entry links to the original public record.",
    link: { to: "/contracts", label: "Search contracts →" },
  },
  {
    n: "04",
    title: "Find out what's happening in your area",
    body: "Enter your postcode to find your MP, their voting record, how they've claimed expenses, and how to contact them directly. Make it personal.",
    link: { to: "/my-area", label: "My area →" },
  },
  {
    n: "05",
    title: "Take action",
    body: "Sign open petitions, write to your MP, share verified data on social media, or use the tools here to research an issue before a local meeting or debate.",
    link: { to: "/petitions", label: "Sign a petition →" },
  },
];

const AGE_BANDS = [
  {
    range: "Under 16",
    emoji: "📚",
    color: "text-blue-400",
    borderColor: "border-blue-400/30",
    bgColor: "bg-blue-400/5",
    headline: "Democracy starts here",
    intro:
      "You can't vote yet — but your generation will live with these decisions for the longest. Understanding politics now is one of the most powerful things you can do.",
    actions: [
      {
        icon: "🧠",
        title: "Learn what's actually happening",
        body: "Use the Issues pages to understand NHS waiting lists, climate policy, housing or education in plain numbers — no spin, no opinion, just data.",
      },
      {
        icon: "💬",
        title: "Talk about it",
        body: "Bring real data into conversations with family, friends and teachers. Saying 'did you know A&E has missed its 4-hour target every month since 2015?' is more powerful than an opinion.",
      },
      {
        icon: "🏫",
        title: "Get involved at school",
        body: "School councils, mock elections, Model Parliament and Debate Club all count. These are real civic muscles — and your school is a miniature democracy.",
      },
      {
        icon: "✍️",
        title: "Write to your MP",
        body: "You don't need to be 18 to contact your MP. They represent everyone in their constituency, including you. A well-researched letter from a young person is noticed.",
      },
      {
        icon: "📣",
        title: "Amplify issues you care about",
        body: "Share accurate data about issues affecting young people — education funding, mental health services, climate targets. Misinformation spreads fast; facts spread further with your help.",
      },
    ],
    links: [
      { to: "/issues", label: "Explore issues" },
      { to: "/learn", label: "Learn the system" },
      { to: "/my-area", label: "Find your MP" },
    ],
  },
  {
    range: "16 – 17",
    emoji: "🗳️",
    color: "text-purple-400",
    borderColor: "border-purple-400/30",
    bgColor: "bg-purple-400/5",
    headline: "Almost there — and already powerful",
    intro:
      "16 and 17-year-olds can vote in Scottish Parliament, Senedd (Welsh Parliament) and local elections in Scotland and Wales. In England and Northern Ireland, the vote arrives at 18 — but influence starts now.",
    actions: [
      {
        icon: "🗳️",
        title: "Register to vote (if you're in Scotland or Wales)",
        body: "You can register at 16 to vote in devolved elections. Check gov.uk/register-to-vote. It takes 5 minutes and you'll be on the register for future UK general elections too.",
      },
      {
        icon: "🎟️",
        title: "Join a political party",
        body: "Every major party has a youth wing with reduced membership fees. You can attend conferences, help with campaigns, vote in leadership contests and shape policy from the inside. You don't have to stay forever.",
      },
      {
        icon: "📝",
        title: "Write to your MP — with data",
        body: "MPs take correspondence from young constituents seriously, especially when it cites real evidence. Use transparenC to pull the relevant stats, then write a focused, factual letter.",
      },
      {
        icon: "🙋",
        title: "Campaign and canvass",
        body: "You can leaflet, canvass, run social media for campaigns and attend hustings at any age. Campaigns are always short-staffed and your energy is more valuable than you think.",
      },
      {
        icon: "🏛️",
        title: "UK Youth Parliament",
        body: "The UK Youth Parliament (UKYP) gives 11–18 year olds a real democratic voice. MYPs (Member of Youth Parliament) are elected and debate in the House of Commons chamber.",
      },
    ],
    links: [
      { to: "/my-area", label: "Find your MP" },
      { to: "/parties", label: "Party pledges" },
      { to: "/petitions", label: "Sign petitions" },
    ],
  },
  {
    range: "18 – 25",
    emoji: "🔥",
    color: "text-amber",
    borderColor: "border-amber/30",
    bgColor: "bg-amber/5",
    headline: "You have the vote. Use it — and go further",
    intro:
      "Turnout among 18–24s was 52% at the 2024 election — lower than any other age group. Yet young people are most affected by housing costs, climate policy, student debt and job markets. Your vote matters more than you think.",
    actions: [
      {
        icon: "🗳️",
        title: "Register and vote in everything",
        body: "General elections, local council elections, mayoral elections, Police and Crime Commissioner elections, referendums — they all shape your life. Register at gov.uk/register-to-vote and set a reminder for every polling day.",
      },
      {
        icon: "📊",
        title: "Hold your representatives accountable",
        body: "Check how your MP votes on issues that matter to you. Compare their voting record to their campaign promises. Use transparenC's Votes page filtered to your MP.",
      },
      {
        icon: "🏠",
        title: "Make housing, costs and climate personal",
        body: "Use the Economy, Housing and NHS issue pages to pull real figures into conversations, social media posts and emails to your MP. Data cuts through opinion.",
      },
      {
        icon: "🌐",
        title: "Run for something",
        body: "There is no minimum age for standing as a local councillor (just 18+). Thousands of seats go uncontested every year. You don't have to win to build a public profile and force issues onto the agenda.",
      },
      {
        icon: "📢",
        title: "Organise — online and offline",
        body: "Join or start a local campaign group. Attend a council meeting (they're public). Use FOI requests to dig for information your council is sitting on. Bring people together around a specific, winnable local issue.",
      },
    ],
    links: [
      { to: "/votes", label: "MP voting record" },
      { to: "/economy", label: "Economic data" },
      { to: "/nhs", label: "NHS performance" },
      { to: "/my-area", label: "Your constituency" },
    ],
  },
  {
    range: "26 – 59",
    emoji: "💪",
    color: "text-green-400",
    borderColor: "border-green-400/30",
    bgColor: "bg-green-400/5",
    headline: "Maximum reach, maximum impact",
    intro:
      "This is the age range with the most resources, networks and political leverage. You pay taxes, use public services, employ people and have real influence in your community. Use it.",
    actions: [
      {
        icon: "📬",
        title: "Write considered letters to your MP",
        body: "A single, well-researched constituent letter gets more internal traction than a petition with 10,000 signatures. Use transparenC to back your argument with government's own data, then ask a specific question that requires a written answer.",
      },
      {
        icon: "🏛️",
        title: "Stand for local office",
        body: "Parish, town and district councillors make real decisions about planning, housing, local spending and services. The 2026 local elections are an opportunity to get on the ballot. Most seats are winnable with modest effort.",
      },
      {
        icon: "💰",
        title: "Follow the money at a local level",
        body: "Use the Contracts page to see what public money flows through your area. Submit FOI requests for local contract data. Attend council scrutiny committee meetings — they're public and often under-attended.",
      },
      {
        icon: "📰",
        title: "Engage local media",
        body: "Local journalists are stretched thin. A well-sourced story with a data angle — e.g. 'our council's sewage discharge hours rose 40% last year' — gets published. transparenC gives you the numbers; you provide the local context.",
      },
      {
        icon: "🤝",
        title: "Join or build civic institutions",
        body: "Residents associations, tenants groups, workplace unions, professional bodies and community charities all aggregate individual influence into collective power. Build the infrastructure that outlasts any single campaign.",
      },
    ],
    links: [
      { to: "/contracts", label: "Government contracts" },
      { to: "/foi", label: "FOI data" },
      { to: "/sewage", label: "Sewage discharges" },
      { to: "/spending", label: "Public spending" },
    ],
  },
  {
    range: "60 and over",
    emoji: "🌟",
    color: "text-orange-400",
    borderColor: "border-orange-400/30",
    bgColor: "bg-orange-400/5",
    headline: "Experience, networks and the highest turnout of any age group",
    intro:
      "Voters over 60 consistently have the highest turnout and political engagement of any age group — which means politicians pay attention. But with great power comes great responsibility: the decisions made now shape the world the next generation inherits.",
    actions: [
      {
        icon: "🗳️",
        title: "Vote — and bring others",
        body: "Your turnout rate is already high, but there are still friends, family members and neighbours who don't vote. Peer encouragement from people you trust is far more effective than any political campaign.",
      },
      {
        icon: "👂",
        title: "Share skills and experience with younger people",
        body: "Write a letter to an MP. Help someone fill in a planning objection. Explain how a council meeting works. The civic knowledge accumulated over decades is irreplaceable — and too rarely passed on.",
      },
      {
        icon: "🏘️",
        title: "Engage with planning and local decisions",
        body: "Local planning committees, neighbourhood plans and council consultations are disproportionately attended by older residents. Your presence shapes your community — but it's worth inviting younger voices to the table too.",
      },
      {
        icon: "💡",
        title: "Use transparenC to challenge received wisdom",
        body: "Is the NHS really performing worse than ever? Is immigration at record levels? Is crime up or down? The data often surprises. Use our tools to check claims before sharing them — and to correct misinformation from any direction.",
      },
      {
        icon: "🌱",
        title: "Think long-term",
        body: "Climate, housing supply, fiscal sustainability and infrastructure are 20–40 year challenges. Support for politicians and policies that make hard long-term decisions — even when unpopular in the short term — is one of the most valuable things experienced voters can provide.",
      },
    ],
    links: [
      { to: "/nhs", label: "NHS data" },
      { to: "/economy", label: "Economic indicators" },
      { to: "/parties", label: "Party promises" },
      { to: "/my-area", label: "Your MP" },
    ],
  },
];

const UNIVERSAL_ACTIONS = [
  {
    icon: "🗳️",
    title: "Register to vote",
    body: "Takes 5 minutes. Required for every election. gov.uk/register-to-vote",
    href: "https://www.gov.uk/register-to-vote",
    external: true,
  },
  {
    icon: "✉️",
    title: "Write to your MP",
    body: "Find them via My Area. Replying to constituents is a strong convention, not a legal duty — so a reply is very likely, not guaranteed.",
    to: "/my-area",
    external: false,
  },
  {
    icon: "📋",
    title: "Sign or start a petition",
    body: "10,000 signatures requires a UK Government response; 100,000 means it is considered for debate (debates are usual but not automatic).",
    to: "/petitions",
    external: false,
  },
  {
    icon: "💸",
    title: "Check where public money goes",
    body: "Central government must publish contract details above £12,000 inc VAT (£30,000 for most other public bodies). So are MP expenses.",
    to: "/contracts",
    external: false,
  },
  {
    icon: "🔍",
    title: "Submit an FOI request",
    body: "Any public body must respond in 20 working days. Use whatdotheyknow.com",
    href: "https://www.whatdotheyknow.com",
    external: true,
  },
  {
    icon: "🏛️",
    title: "Attend a council meeting",
    body: "All local council meetings are public. Agenda and minutes are published online.",
    href: "https://www.gov.uk/find-local-council",
    external: true,
  },
  {
    icon: "🙋",
    title: "Stand for election",
    body: "Local councillor, parish council, school governor, Police and Crime Panel.",
    href: "https://www.gov.uk/become-councillor",
    external: true,
  },
  {
    icon: "📣",
    title: "Share verified data",
    body: "Misinformation spreads fast. Share this site. Back claims with sources.",
    to: "/issues",
    external: false,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function TakeActionPage() {
  return (
    <div className="space-y-16 max-w-4xl">
      {/* Hero */}
      <section className="pt-2 space-y-4">
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
          Participation guide
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight">
          Democracy works <span className="text-amber">when you do</span>.
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
          transparenC gives you the data. This page gives you the map: how to use it, how to make
          your voice heard, and how people at every stage of life can push for the change they want
          to see.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href="#how-to-use"
            className="px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider"
          >
            How to use this site
          </a>
          <a
            href="#by-age"
            className="px-4 py-2 border border-border rounded label-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            Participation by age
          </a>
          <a
            href="#actions"
            className="px-4 py-2 border border-border rounded label-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            8 ways to drive change
          </a>
        </div>
      </section>

      {/* How to use this site */}
      <section id="how-to-use" className="scroll-mt-20 space-y-6">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Step by step
          </div>
          <h2 className="font-display text-2xl font-bold">How to use transparenC</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Five steps from "I'm curious" to "I'm taking action."
          </p>
        </div>
        <div className="space-y-3">
          {HOW_TO_STEPS.map((step) => (
            <div key={step.n} className="flex gap-4 rounded-lg border border-border bg-surface p-5">
              <div className="label-mono text-2xl font-black text-amber/30 leading-none shrink-0 pt-0.5">
                {step.n}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="font-display text-base font-bold">{step.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                <Link
                  to={step.link.to}
                  className="inline-block label-mono text-[10px] uppercase tracking-wider text-amber hover:underline mt-1"
                >
                  {step.link.label}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* By age */}
      <section id="by-age" className="scroll-mt-20 space-y-6">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Participation by age
          </div>
          <h2 className="font-display text-2xl font-bold">Everyone has a role. Here's yours.</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Political participation isn't just voting. It's a spectrum of actions — and different
            stages of life open different doors.
          </p>
        </div>

        <div className="space-y-5">
          {AGE_BANDS.map((band) => (
            <details
              key={band.range}
              className={`rounded-lg border ${band.borderColor} ${band.bgColor} group`}
            >
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none select-none">
                <span className="text-2xl" aria-hidden="true">
                  {band.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`label-mono text-[11px] uppercase tracking-wider ${band.color}`}>
                    {band.range}
                  </span>
                  <div className="font-display text-base font-bold leading-snug">
                    {band.headline}
                  </div>
                </div>
                <svg
                  className="shrink-0 transition-transform group-open:rotate-180 text-muted-foreground"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </summary>

              <div className="px-5 pb-5 space-y-5 border-t border-border/50 pt-4 mt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{band.intro}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {band.actions.map((action) => (
                    <div
                      key={action.title}
                      className="rounded-lg bg-surface border border-border p-4 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base" aria-hidden="true">
                          {action.icon}
                        </span>
                        <span className="font-display text-sm font-semibold">{action.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{action.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground self-center">
                    Useful tools:
                  </span>
                  {band.links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="px-3 py-1 rounded border border-border bg-surface-2 label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber hover:border-amber/40 transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Universal actions */}
      <section id="actions" className="scroll-mt-20 space-y-6">
        <div>
          <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
            Start today
          </div>
          <h2 className="font-display text-2xl font-bold">8 ways to drive change</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Any age, any level of experience. These are the concrete actions that move the needle.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {UNIVERSAL_ACTIONS.map((action) => {
            const inner = (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden="true">
                    {action.icon}
                  </span>
                  <span className="font-display text-sm font-semibold group-hover:text-amber transition-colors">
                    {action.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{action.body}</p>
              </>
            );
            return action.external ? (
              <a
                key={action.title}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-4 hover:border-amber/40 hover:bg-surface-2 transition-colors"
              >
                {inner}
              </a>
            ) : (
              <Link
                key={action.title}
                to={action.to!}
                className="group flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-4 hover:border-amber/40 hover:bg-surface-2 transition-colors"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-lg border border-amber/20 bg-amber/5 p-6 space-y-3">
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber">
          One more thing
        </div>
        <h2 className="font-display text-xl font-bold">
          The most powerful thing you can do is stay informed.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          Politicians rely on short memories and complex information staying buried. Every time you
          look up the real figures, share a verified stat, or call out a broken promise with
          evidence, you make the system a little more accountable. That's what this site is for.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            to="/issues"
            className="px-4 py-2 bg-amber text-amber-foreground rounded label-mono text-xs uppercase tracking-wider"
          >
            Start exploring →
          </Link>
          <Link
            to="/learn"
            className="px-4 py-2 border border-amber/30 rounded label-mono text-xs uppercase tracking-wider text-amber hover:bg-amber/10 transition-colors"
          >
            Learn the system
          </Link>
        </div>
      </section>
    </div>
  );
}
