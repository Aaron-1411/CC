import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/primitives";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How to use transparenC — Guide" },
      {
        name: "description",
        content:
          "A complete guide to using transparenC — the UK government accountability platform built on open public data.",
      },
      { property: "og:title", content: "How to use transparenC" },
    ],
  }),
  component: AboutPage,
});

// ─── Section components ────────────────────────────────────────────────────────

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      {children}
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-1">
        {eyebrow}
      </div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
    </div>
  );
}

function ToolCard({
  to,
  eyebrow,
  title,
  copy,
  status = "live",
}: {
  to: string;
  eyebrow: string;
  title: string;
  copy: string;
  status?: "live" | "requires-key";
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col bg-surface border border-border rounded-lg p-4 hover:border-amber/40 hover:bg-surface-2 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="label-mono text-[9px] uppercase tracking-[0.2em] text-amber">{eyebrow}</div>
        {status === "requires-key" && (
          <span className="label-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
            Needs API key
          </span>
        )}
      </div>
      <h3 className="font-display text-sm font-bold group-hover:text-amber transition-colors leading-snug mb-1">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{copy}</p>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AboutPage() {
  return (
    <div className="max-w-3xl space-y-16">
      {/* Hero */}
      <section className="pt-2">
        <div className="label-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-3">
          Guide
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black leading-[1.08] tracking-tight">
          How to use <span className="text-amber">transparenC</span>
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed">
          transparenC pulls live data from Parliament, the Electoral Commission, NHS England, the
          Environment Agency, ONS and more — and puts it in one place, free of spin. This guide
          walks you through every tool.
        </p>
      </section>

      {/* Table of contents */}
      <Card className="space-y-2">
        <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
          Contents
        </div>
        {[
          { href: "#start", label: "Start here — set your constituency" },
          { href: "#issues", label: "Browse by issue" },
          { href: "#democracy", label: "Democracy: Parliament, votes & committees" },
          { href: "#economy", label: "Economy: indicators & spending" },
          { href: "#money", label: "Follow the money: contracts, donations & influence" },
          { href: "#services", label: "Public services: NHS, sewage, policing & welfare" },
          { href: "#investigate", label: "Investigate: cross-reference, AI & projects" },
          { href: "#action", label: "Taking action" },
          { href: "#sources", label: "Data sources & reliability" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block label-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber transition-colors py-0.5"
          >
            → {item.label}
          </a>
        ))}
      </Card>

      {/* Start here */}
      <Section id="start">
        <SectionTitle eyebrow="Step one" title="Set your constituency" />
        <p className="text-muted-foreground leading-relaxed">
          The first thing to do is enter your postcode in{" "}
          <Link to="/my-area" className="text-amber hover:underline">
            My Area
          </Link>
          . This unlocks personalised data across the whole site:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Your MP's name, party, photo and contact details",
            "Every vote your MP has cast in the House of Commons",
            "Your MP's declared financial interests",
            "Your local police force on the Stop & Search page — auto-selected",
            "A direct link to Write to Them with your constituency pre-filled",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-amber shrink-0">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Card className="bg-amber/5 border-amber/20">
          <div className="label-mono text-[10px] uppercase tracking-wider text-amber mb-1">
            Privacy note
          </div>
          <p className="text-sm text-muted-foreground">
            Your postcode is sent directly from your browser to postcodes.io — an open-source lookup
            service built on ONS open data — solely to find your constituency. It never touches our
            servers and is never logged by us. The result is saved only in your browser, and you can
            clear it at any time.
          </p>
        </Card>
      </Section>

      {/* Issues */}
      <Section id="issues">
        <SectionTitle eyebrow="Quick entry" title="Browse by issue" />
        <p className="text-muted-foreground leading-relaxed">
          If you care about a specific topic — NHS, Housing, Economy, Crime, Environment,
          Immigration or Education — start at{" "}
          <Link to="/issues" className="text-amber hover:underline">
            Issues
          </Link>
          . Each issue page shows you:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "The key facts", copy: "What the data says right now, in plain English" },
            {
              label: "What parties promised",
              copy: "Every pledge from every major party, with delivery status",
            },
            {
              label: "Latest news",
              copy: "Stories from multiple outlets, ranked by how many are covering it",
            },
            { label: "Direct links", copy: "Jump straight to the relevant tool for that issue" },
          ].map((item) => (
            <div key={item.label} className="border border-border rounded-lg p-4 bg-surface">
              <div className="font-display text-sm font-bold mb-1">{item.label}</div>
              <p className="text-xs text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Democracy */}
      <Section id="democracy">
        <SectionTitle eyebrow="Democracy" title="Parliament, votes & committees" />
        <p className="text-muted-foreground leading-relaxed">
          Three tools covering what Parliament is actually doing — what laws are being debated, how
          MPs vote, and what scrutiny committees are finding.
        </p>
        <div className="grid gap-3">
          <ToolCard
            to="/parliament"
            eyebrow="Bills"
            title="Legislation in motion"
            copy="Every active bill passing through Parliament right now — current stage, last updated, straight from the Parliament Bills API."
          />
          <ToolCard
            to="/votes"
            eyebrow="Votes"
            title="How MPs actually vote"
            copy="Every House of Commons division live from Parliament. See the ayes, noes, and which way each vote went. Use My Area to see your own MP's record."
          />
          <ToolCard
            to="/committees"
            eyebrow="Select Committees"
            title="Parliamentary scrutiny reports"
            copy="Commons and Lords committee reports — often the most rigorous analysis of government performance. Reports are published here but rarely covered in the press."
          />
          <ToolCard
            to="/petitions"
            eyebrow="Petitions"
            title="What the public is demanding"
            copy="Open petitions sorted by signatures. 10,000 signatures gets a UK Government response; 100,000 means the petition is considered for debate (debates are usual but not automatic)."
          />
        </div>
      </Section>

      {/* Economy */}
      <Section id="economy">
        <SectionTitle eyebrow="Economy" title="The economic scorecard" />
        <p className="text-muted-foreground leading-relaxed">
          Live ONS figures and Treasury data — the numbers politicians argue about, without the
          spin.
        </p>
        <div className="grid gap-3">
          <ToolCard
            to="/economy"
            eyebrow="Economic Indicators"
            title="GDP, inflation, wages & debt"
            copy="Six live ONS time-series with sparklines: GDP growth, CPI inflation, unemployment, real wages, net debt and the government deficit. Hover any card to share the stat."
          />
          <ToolCard
            to="/spending"
            eyebrow="Public Spending"
            title="Where your £1.2 trillion goes"
            copy="HM Treasury PESA data: total managed expenditure by government department. Health, welfare, defence, education — with resource vs capital breakdown."
          />
        </div>
        <Card className="bg-surface-2/40 border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Tip:</strong> The deficit and debt figures on the
            economy page are often confused by politicians. "Deficit" is the annual gap between
            spending and tax revenue. "Debt" is the accumulated total owed. A falling deficit means
            the government is still borrowing, just less than before.
          </p>
        </Card>
      </Section>

      {/* Money */}
      <Section id="money">
        <SectionTitle eyebrow="Follow the money" title="Contracts, donations & influence" />
        <p className="text-muted-foreground leading-relaxed">
          Six tools for tracing where public money goes and who has access to government. These are
          the hardest things to find on GOV.UK — we pull them into one place.
        </p>
        <div className="grid gap-3">
          <ToolCard
            to="/contracts"
            eyebrow="Contracts"
            title="Top recipients & direct awards"
            copy="Every contract over £1m awarded in the last 10 months via Contracts Finder. Direct awards are flagged — they're legal, but they bypass open competition. Top suppliers aggregated by total value."
          />
          <ToolCard
            to="/donations"
            eyebrow="Donations"
            title="Who funds the parties"
            copy="The Electoral Commission register of political donations. See who is bankrolling which party, sorted by amount. Covers all regulated political parties."
          />
          <ToolCard
            to="/expenses"
            eyebrow="Expenses"
            title="What MPs are claiming"
            copy="IPSA 2024-25 expense totals per MP, sorted by total spend. Covers office costs, staffing, accommodation, travel and other claims."
          />
          <ToolCard
            to="/meetings"
            eyebrow="Ministers"
            title="Who ministers are meeting"
            copy="Quarterly returns showing which companies, organisations and lobbyists are getting access to government ministers. Published under transparency obligations."
          />
          <ToolCard
            to="/lobbying"
            eyebrow="Lobbying"
            title="Paid influence register"
            copy="Organisations legally required to disclose paid lobbying activity under the Transparency of Lobbying Act 2014. Who is paying whom to lobby government."
          />
          <ToolCard
            to="/acoba"
            eyebrow="Revolving Door"
            title="Ministers into private sector"
            copy="ACOBA publishes every case of a minister or senior official taking a private-sector role after leaving government, along with the conditions it set. We show the register; you draw your own conclusions."
          />
        </div>
        <Card className="bg-surface-2/40 border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Cross-reference tip:</strong> Use the{" "}
            <Link to="/crossref" className="text-amber hover:underline">
              Cross-Reference tool
            </Link>{" "}
            to search a company or person name across contracts, donations, ACOBA and the lobbying
            register at once. Useful when a company appears in the news.
          </p>
        </Card>
      </Section>

      {/* Services */}
      <Section id="services">
        <SectionTitle eyebrow="Public services" title="NHS, environment, policing & welfare" />
        <p className="text-muted-foreground leading-relaxed">
          Real-world data on the services that affect everyone, from NHS waiting times to sewage
          discharge hours to racial disparity in policing.
        </p>
        <div className="grid gap-3">
          <ToolCard
            to="/nhs"
            eyebrow="NHS"
            title="Waiting times & performance"
            copy="A&E four-hour target performance (the 95% target has not been met since 2015), elective waiting lists and latest NHS England statistics."
          />
          <ToolCard
            to="/sewage"
            eyebrow="Sewage"
            title="Water companies & raw sewage"
            copy="Environment Agency EDM data: every storm overflow site in England, how many hours each water company discharged untreated sewage in 2024, and into which waterway. Hover stats to share on X."
          />
          <ToolCard
            to="/stop-search"
            eyebrow="Stop & Search"
            title="Racial disparity in policing"
            copy="Every stop and search in England and Wales by ethnicity, outcome and object of search. If you've set your postcode in My Area, your local force is selected automatically."
          />
          <ToolCard
            to="/sanctions"
            eyebrow="Sanctions"
            title="Benefits conditionality"
            copy="DWP Universal Credit sanctions data: how many claimants are sanctioned, for how long, and the official recorded reason categories."
          />
          <ToolCard
            to="/foi"
            eyebrow="FOI"
            title="Freedom of Information refusals"
            copy="Which public bodies refuse the most FOI requests? The Cabinet Office league table of government departments that withhold information most often."
          />
        </div>
      </Section>

      {/* Investigate */}
      <Section id="investigate">
        <SectionTitle eyebrow="Investigate" title="Cross-reference, AI & major projects" />
        <p className="text-muted-foreground leading-relaxed">
          Power tools for deeper investigation — searching across multiple databases at once,
          generating briefings, and tracking project cost overruns.
        </p>
        <div className="grid gap-3">
          <ToolCard
            to="/crossref"
            eyebrow="Cross-Reference"
            title="One search, four databases"
            copy="Type a company or person name to search contracts, donations, ACOBA and the lobbying register simultaneously. Good starting point when a name appears in the news."
          />
          <ToolCard
            to="/projects"
            eyebrow="Major Projects"
            title="HS2, Hinkley C & beyond"
            copy="Every IPA Government Major Projects Portfolio entry — delivery confidence RAG status (Green to Red), whole-life cost estimate, and department. Includes a notable cost overruns section for the most notorious cases."
          />
          <ToolCard
            to="/briefing"
            eyebrow="AI Briefing"
            title="Ask about any UK issue"
            copy="Generate a non-partisan briefing on any UK accountability topic — drawn only from the cached official data behind this site, with every figure linked to its source."
          />
        </div>
        <Card className="bg-surface-2/40 border-border">
          <div className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            About AI Briefing
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The AI Briefing tool answers from the official data already cached on transparenC, and
            lists the sources it used beneath every answer. It does not browse the open web for
            figures. Briefings are AI-generated — always verify against the linked sources before
            sharing.
          </p>
        </Card>
      </Section>

      {/* Taking action */}
      <Section id="action">
        <SectionTitle eyebrow="Taking action" title="What you can do with this data" />
        <p className="text-muted-foreground leading-relaxed">
          Data without action is just noise. Every page has an action bar at the bottom.
        </p>
        <div className="space-y-3">
          {[
            {
              icon: "✉",
              title: "Write to your MP",
              copy: "Every data page has a 'Write to your MP' link that goes to Write to Them — the easiest way to send a letter to your representative. If you've set your postcode in My Area, your MP is pre-selected.",
            },
            {
              icon: "✦",
              title: "Use the pre-drafted letters",
              copy: "Pages covering NHS, sewage, sanctions and stop & search include a pre-drafted letter template. Click 'Draft letter', review and personalise it, copy, then paste into Write to Them. Takes 2 minutes.",
            },
            {
              icon: "↗",
              title: "Share stats on X / Twitter",
              copy: "Click 'Share on X' in the action bar for a pre-formatted tweet ready to post. On economy and sewage pages, hover over individual stat cards to share that specific number — the tweet copy is written to land.",
            },
            {
              icon: "✦",
              title: "Ask AI for a briefing",
              copy: "The 'Ask AI about this' link pre-fills the briefing tool with a topic related to the page you're on. Good for generating a quick summary before a meeting or writing a letter.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-4 p-4 bg-surface border border-border rounded-lg"
            >
              <div className="text-amber text-xl shrink-0 w-6 text-center">{item.icon}</div>
              <div>
                <div className="font-display text-sm font-bold mb-1">{item.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Sources */}
      <Section id="sources">
        <SectionTitle eyebrow="Data sources" title="Where the data comes from" />
        <p className="text-muted-foreground leading-relaxed">
          Every piece of data on transparenC comes from official UK public sources. No third-party
          data aggregators, no scraping. Most content is published under the{" "}
          <a
            href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
            className="text-amber hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Open Government Licence v3.0
          </a>
          .
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            ["Parliament Bills API", "bills.parliament.uk", "Bills, votes, committees"],
            ["Electoral Commission", "electoralcommission.org.uk", "Donations register"],
            [
              "Contracts Finder (Cabinet Office)",
              "contractsfinder.service.gov.uk",
              "Government contracts",
            ],
            ["ONS API", "api.ons.gov.uk", "GDP, inflation, unemployment, wages, debt"],
            ["HM Treasury PESA", "gov.uk/collections/pesa", "Departmental spending"],
            ["NHS England", "england.nhs.uk", "Waiting times, A&E performance"],
            ["Environment Agency (ArcGIS)", "environment.data.gov.uk", "Sewage overflow EDM data"],
            ["data.police.uk", "data.police.uk", "Stop & search records"],
            ["IPSA", "theipsa.org.uk", "MP expenses"],
            ["DWP", "gov.uk/dwp", "Benefits sanctions data"],
            [
              "GOV.UK (search API)",
              "gov.uk/api/search.json",
              "Ministerial meetings, lobbying, ACOBA",
            ],
            [
              "Parliament Members API",
              "members-api.parliament.uk",
              "MP profiles, votes, interests",
            ],
            [
              "IPA GMPP",
              "gov.uk/government/collections/government-major-projects",
              "Major projects",
            ],
            ["postcodes.io", "postcodes.io", "Postcode → constituency lookup"],
          ].map(([name, domain, covers]) => (
            <div key={domain} className="border border-border rounded-lg p-3 bg-surface">
              <div className="font-display text-xs font-bold text-foreground">{name}</div>
              <div className="label-mono text-[9px] text-muted-foreground mt-0.5">{domain}</div>
              <div className="text-xs text-muted-foreground mt-1">{covers}</div>
            </div>
          ))}
        </div>
        <Card className="bg-amber/5 border-amber/20 space-y-2">
          <div className="label-mono text-[10px] uppercase tracking-wider text-amber">
            Non-partisan commitment
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Where a number can settle it, the number does. Where judgement is unavoidable — such as
            assessing whether a pledge is on track — the rubric, the evidence, and every status
            change are published on our{" "}
            <Link to="/methodology" className="text-amber hover:underline">
              methodology page
            </Link>
            , and anyone can challenge an assessment with evidence. All parties are held to the same
            standard. The goal is to make public data harder to ignore, not to push a political
            line.
          </p>
        </Card>
      </Section>

      {/* Back to home */}
      <div className="pt-4 border-t border-border">
        <Link
          to="/"
          className="label-mono text-[10px] uppercase tracking-wider text-amber hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
