'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PillarResult, AnalysisJob, OpportunityMatrix } from '@/types/analysis';

/* ─────────────────────────────────────────
   DATA
   ───────────────────────────────────────── */

const AUDIT_PILLARS = [
  { id: 1,  name: 'Trust & Social Proof',   desc: 'Reviews, ratings, trust signals, press mentions, UGC' },
  { id: 2,  name: 'Product Pages',          desc: 'Copy, imagery, specs, objection handling, buy-box friction' },
  { id: 3,  name: 'Checkout & Friction',    desc: 'Steps, payment options, BNPL, cart abandonment triggers' },
  { id: 4,  name: 'Email & Retention',      desc: 'Flows, segmentation, lifecycle coverage, Klaviyo health' },
  { id: 5,  name: 'Paid Traffic',           desc: 'Ad creative, landing page alignment, ROAS signals, retargeting' },
  { id: 6,  name: 'SEO & Organic',          desc: 'Rankings, content gaps, technical issues, search demand' },
  { id: 7,  name: 'Brand & Positioning',    desc: 'Differentiation, messaging clarity, value proposition' },
  { id: 8,  name: 'Loyalty & LTV',          desc: 'Repeat purchase mechanics, referral, membership, winback' },
  { id: 9,  name: 'UX & Site Speed',        desc: 'Mobile experience, Core Web Vitals, navigation friction' },
  { id: 10, name: 'Merchandising',          desc: 'Collection structure, sorting, cross-sell, search' },
  { id: 11, name: 'Offers & Promotions',    desc: 'Discount strategy, urgency mechanics, AOV levers' },
  { id: 12, name: 'Analytics & Data',       desc: 'Tracking coverage, attribution, reporting gaps' },
  { id: 13, name: 'Post-Purchase',          desc: 'Delivery comms, unboxing, NPS, review capture' },
];

const SERVICES = [
  { title: 'Conversion Rate Optimisation', desc: 'Fix the friction points your audit flagged — from product pages to checkout.' },
  { title: 'Email & Retention',            desc: 'Build and fix your flows: welcome, abandon, post-purchase, winback, VIP.' },
  { title: 'Paid Media',                   desc: 'Restructure campaigns, refresh creative, and align ads to your best-converting pages.' },
  { title: 'SEO & Content',                desc: 'Fill the content gaps, fix the technical issues, and build authority in your category.' },
  { title: 'UX & Development',             desc: 'Improve mobile UX, Core Web Vitals, and every friction point between browse and buy.' },
  { title: 'Analytics & Attribution',      desc: 'Clean up tracking, implement proper attribution, and build the dashboards you need.' },
];

/* ─────────────────────────────────────────
   ICONS (inline SVG)
   ───────────────────────────────────────── */

function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 2v4h4M7 9h6M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconSlides() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="1" y="3" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 18h6M10 15v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 9l2.5 2L11 7l3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconChevron({ down }: { down?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden
      style={{ transform: down ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }}>
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────── */

function deriveBrand(u: string): string {
  try {
    const host = new URL(u).hostname.replace('www.', '');
    const slug = host.split('.')[0];
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  } catch { return ''; }
}

function statusBadge(status: string) {
  if (status === 'GREEN')   return <span className="badge badge-green">● Green</span>;
  if (status === 'AMBER')   return <span className="badge badge-amber">● Amber</span>;
  if (status === 'RED')     return <span className="badge badge-red">● Red</span>;
  if (status === 'RUNNING') return <span className="badge badge-running animate-pillar-pulse">◌ Scanning</span>;
  return <span className="badge" style={{ color: 'var(--text-tertiary)', background: 'var(--surface-2)' }}>Pending</span>;
}

/* ─────────────────────────────────────────
   NAV
   ───────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 'var(--z-nav)' as never,
        height: '56px',
        background: scrolled ? 'rgba(8,10,15,0.92)' : 'rgba(8,10,15,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'background 300ms var(--ease-out), border-color 300ms var(--ease-out)',
      }}
    >
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Wordmark */}
        <a
          href="https://fulcrumsolutions.online"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '1px' }}
        >
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Fulcrum</span>
          <span style={{ fontSize: '15px', fontWeight: 400, color: 'var(--text-tertiary)', letterSpacing: '-0.02em' }}>Solutions</span>
        </a>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="#how-it-works" className="nav-text-link" style={navLinkStyle}>How it works</a>
          <a href="#services" className="nav-text-link" style={navLinkStyle}>Services</a>
          <a href="#audit" className="nav-text-link" style={navLinkStyle}>Audit</a>
          <a href="#audit" className="btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>
            Run Free Audit
          </a>
        </div>
      </div>
    </nav>
  );
}

const navLinkStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 400,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  padding: '4px 10px',
  borderRadius: 'var(--r-sm)',
  transition: 'color 160ms',
};

/* ─────────────────────────────────────────
   HERO
   ───────────────────────────────────────── */
function Hero() {
  return (
    <section
      className="dot-grid"
      style={{
        paddingTop: '140px',
        paddingBottom: '96px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial accent — low opacity, single hue, no rainbow */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '680px' }}>
          {/* Overline */}
          <p
            className="label"
            data-reveal
            style={{ marginBottom: '24px' }}
          >
            Free Ecommerce Audit
          </p>

          {/* H1 */}
          <h1
            data-reveal
            style={{
              fontSize: 'var(--size-display)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'var(--text-primary)',
              marginBottom: '24px',
              transitionDelay: '80ms',
            }}
          >
            Your store is leaking revenue. Find out exactly where.
          </h1>

          {/* Subhead */}
          <p
            data-reveal
            style={{
              fontSize: '18px',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              maxWidth: '520px',
              marginBottom: '40px',
              transitionDelay: '160ms',
            }}
          >
            Paste your URL. Our AI audits 13 revenue pillars in real time using live web research.
            You get a full gap analysis — and we build the fixes.
          </p>

          {/* CTAs */}
          <div data-reveal style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', transitionDelay: '240ms' }}>
            <a href="#audit" className="btn-primary">
              Run your free audit <IconArrow />
            </a>
            <a href="#services" className="btn-ghost">
              See what we fix
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   HOW IT WORKS
   ───────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Paste your URL',
      body: 'We pull live data on your store using Google Search grounding — no login, no integration, nothing to install.',
    },
    {
      n: '02',
      title: 'AI audits 13 pillars',
      body: 'Each pillar is scored GREEN, AMBER, or RED with specific findings from your actual store — not generic advice.',
    },
    {
      n: '03',
      title: 'Get your report, then we build',
      body: 'Download your Word report and deck. Book a call and we turn the findings into fixes, implementation first.',
    },
  ];

  return (
    <section id="how-it-works" className="section" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <p className="label" data-reveal style={{ marginBottom: '48px' }}>Process</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '48px',
          }}
        >
          {steps.map((step, i) => (
            <div key={step.n} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
              <p
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '48px',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: 'var(--accent-glow)',
                  background: `linear-gradient(135deg, var(--accent) 0%, rgba(37,99,235,0.3) 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '16px',
                  display: 'block',
                }}
              >
                {step.n}
              </p>
              <h3 style={{ fontSize: 'var(--size-h3)', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 'var(--size-body)', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '300px' }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   13 PILLARS GRID
   ───────────────────────────────────────── */
function PillarsGrid() {
  return (
    <section className="section" style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div data-reveal style={{ marginBottom: '48px' }}>
          <p className="label" style={{ marginBottom: '12px' }}>What We Audit</p>
          <h2 style={{ fontSize: 'var(--size-h1)', fontWeight: 700, letterSpacing: '-0.03em', maxWidth: '520px', color: 'var(--text-primary)' }}>
            13 areas where ecommerce brands leak revenue
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-card)',
            overflow: 'hidden',
          }}
        >
          {AUDIT_PILLARS.map((pillar, i) => (
            <div
              key={pillar.id}
              data-reveal
              style={{
                background: 'var(--surface-1)',
                padding: '20px 24px',
                transitionDelay: `${(i % 4) * 60}ms`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: 'var(--size-label)',
                    color: 'var(--text-tertiary)',
                    fontWeight: 500,
                    lineHeight: '20px',
                    minWidth: '20px',
                    marginTop: '1px',
                    letterSpacing: '0.04em',
                  }}
                >
                  {String(pillar.id).padStart(2, '0')}
                </span>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                    {pillar.name}
                  </p>
                  <p style={{ fontSize: 'var(--size-small)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    {pillar.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   DELIVERABLES
   ───────────────────────────────────────── */
function Deliverables() {
  const items = [
    {
      icon: <IconDashboard />,
      title: 'Interactive Dashboard',
      desc: 'All 13 pillars with RAG status, specific findings, and an opportunity matrix — live in your browser as the audit runs.',
    },
    {
      icon: <IconDoc />,
      title: 'Word Report',
      desc: 'A full audit document with findings, evidence, and prioritised recommendations. Ready to share with your team.',
    },
    {
      icon: <IconSlides />,
      title: 'PowerPoint Deck',
      desc: 'Board-ready slides. Bring it to your leadership meeting, investor call, or agency briefing.',
    },
  ];

  return (
    <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div data-reveal style={{ marginBottom: '48px' }}>
          <p className="label" style={{ marginBottom: '12px' }}>Deliverables</p>
          <h2 style={{ fontSize: 'var(--size-h1)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Three outputs, one audit
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {items.map((item, i) => (
            <div
              key={item.title}
              className="card"
              data-reveal
              style={{ padding: '28px', transitionDelay: `${i * 80}ms` }}
            >
              <div
                style={{
                  width: '40px', height: '40px', borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)', marginBottom: '20px',
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ fontSize: 'var(--size-h3)', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 'var(--size-body)', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   SERVICES
   ───────────────────────────────────────── */
function Services() {
  return (
    <section id="services" className="section" style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div data-reveal style={{ maxWidth: '560px', marginBottom: '48px' }}>
          <p className="label" style={{ marginBottom: '12px' }}>Services</p>
          <h2 style={{ fontSize: 'var(--size-h1)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '16px', color: 'var(--text-primary)' }}>
            We don't just find the problems. We fix them.
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Every audit maps directly to our implementation services. The report tells you what's broken; we build the fix.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className="card"
              data-reveal
              style={{ padding: '24px', transitionDelay: `${(i % 3) * 80}ms` }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 'var(--size-small)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <div data-reveal>
          <a
            href="mailto:mraaronmanu@gmail.com"
            className="btn-primary"
            style={{ fontSize: '14px', padding: '13px 28px' }}
          >
            Book a strategy call <IconArrow />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   LEAD CAPTURE FORM
   ───────────────────────────────────────── */
function LeadCapture({ brandUrl }: { brandUrl: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, brand_url: brandUrl, message: 'Interested in implementation.' }),
      });
      if (!res.ok) throw new Error('Failed');
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div
        style={{
          marginTop: '32px', padding: '20px 24px',
          background: 'var(--green-bg)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 'var(--r-card)', display: 'flex', alignItems: 'center', gap: '12px',
        }}
      >
        <span style={{ color: 'var(--green)', fontSize: '18px' }}>✓</span>
        <p style={{ color: 'var(--green)', fontSize: 'var(--size-body)' }}>
          Got it — we'll be in touch within one business day.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: '32px', padding: '24px',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-card)',
      }}
    >
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
        Want us to implement these fixes?
      </p>
      <p style={{ fontSize: 'var(--size-small)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Leave your email and we'll reach out with a tailored proposal.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="field"
          style={{ flex: '1 1 200px', fontSize: 'var(--size-small)', padding: '10px 14px' }}
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="btn-primary"
          style={{ fontSize: 'var(--size-small)', padding: '10px 20px', opacity: state === 'loading' ? 0.7 : 1 }}
        >
          {state === 'loading' ? 'Sending…' : 'Get in touch'}
        </button>
      </form>

      {state === 'error' && (
        <p style={{ color: 'var(--red)', fontSize: 'var(--size-small)', marginTop: '8px' }}>
          Something went wrong — email us directly at mraaronmanu@gmail.com
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   OPPORTUNITY MATRIX
   ───────────────────────────────────────── */
function OpportunityMatrixView({ matrix }: { matrix: OpportunityMatrix }) {
  const sections = [
    { label: 'High impact, quick wins',     items: matrix.highImpactEasy,       color: 'var(--green)' },
    { label: 'High impact, needs investment', items: matrix.highImpactInvestment, color: 'var(--amber)' },
    { label: 'Lower impact, easy',          items: matrix.lowerImpactEasy,       color: 'var(--text-secondary)' },
    { label: 'Longer-term plays',           items: matrix.longerTerm,            color: 'var(--text-tertiary)' },
  ];

  return (
    <div
      style={{
        marginTop: '32px', padding: '24px',
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-card)',
      }}
    >
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>
        Opportunity matrix
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {sections.filter(s => s.items?.length > 0).map(sec => (
          <div key={sec.label}>
            <p style={{ fontSize: 'var(--size-label)', fontWeight: 600, color: sec.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'var(--font-mono), monospace' }}>
              {sec.label}
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sec.items.map((item, i) => (
                <li key={i} style={{ fontSize: 'var(--size-small)', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: sec.color, marginTop: '2px', flexShrink: 0 }}>—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PILLAR ROW
   ───────────────────────────────────────── */
function PillarRow({ pillar }: { pillar: PillarResult }) {
  const [open, setOpen] = useState(false);
  const isRunning = pillar.status === 'RUNNING';

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-card)',
        overflow: 'hidden',
        transition: 'border-color var(--dur-std) var(--ease-out)',
      }}
    >
      <button
        onClick={() => !isRunning && setOpen(o => !o)}
        disabled={isRunning}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', background: 'none', border: 'none',
          cursor: isRunning ? 'default' : 'pointer', textAlign: 'left',
        }}
      >
        {/* Pillar # */}
        <span
          style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 'var(--size-label)',
            color: 'var(--text-tertiary)',
            minWidth: '24px',
            letterSpacing: '0.04em',
          }}
        >
          {String(pillar.id).padStart(2, '0')}
        </span>

        {/* Name */}
        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
          {pillar.name}
        </span>

        {/* Status badge */}
        {statusBadge(pillar.status)}

        {/* Expand icon */}
        {!isRunning && (
          <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
            <IconChevron down={open} />
          </span>
        )}

        {/* Running shimmer */}
        {isRunning && (
          <div
            style={{
              position: 'relative', overflow: 'hidden',
              width: '80px', height: '4px', borderRadius: '2px',
              background: 'var(--surface-2)', flexShrink: 0,
            }}
          >
            <div
              className="animate-scan-bar"
              style={{
                position: 'absolute', top: 0, height: '100%', width: '60%',
                background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                borderRadius: '2px',
              }}
            />
          </div>
        )}
      </button>

      {/* Expanded findings */}
      {open && pillar.findings?.length > 0 && (
        <div
          className="animate-fade-up"
          style={{
            borderTop: '1px solid var(--border)',
            padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}
        >
          {pillar.findings.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '10px', letterSpacing: '0.06em',
                  padding: '2px 6px', borderRadius: '4px',
                  background: 'var(--surface-2)', color: 'var(--text-tertiary)',
                  flexShrink: 0, marginTop: '2px',
                }}
              >
                {f.type}
              </span>
              <p style={{ fontSize: 'var(--size-small)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {f.text}
              </p>
            </div>
          ))}

          {pillar.opportunity && (
            <div
              style={{
                marginTop: '8px', padding: '12px',
                background: 'var(--accent-dim)', border: '1px solid rgba(37,99,235,0.12)',
                borderRadius: 'var(--r-sm)',
              }}
            >
              <p style={{ fontSize: 'var(--size-label)', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono), monospace', marginBottom: '6px' }}>
                Opportunity
              </p>
              <p style={{ fontSize: 'var(--size-small)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {pillar.opportunity}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   AUDIT TOOL
   ───────────────────────────────────────── */
function AuditTool() {
  const [url, setUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [supplementary, setSupplementary] = useState('');
  const [showSupp, setShowSupp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [pillars, setPillars] = useState<PillarResult[]>([]);
  const [jobStatus, setJobStatus] = useState<'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | null>(null);
  const [opportunityMatrix, setOpportunityMatrix] = useState<OpportunityMatrix | null>(null);
  const [auditUrl, setAuditUrl] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const handleUrlChange = (v: string) => {
    setUrl(v);
    if (!brandName) setBrandName(deriveBrand(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;
    try { new URL(targetUrl); } catch { setError('Please enter a valid URL'); return; }

    setLoading(true);
    setPillars([]);
    setJobStatus(null);
    setOpportunityMatrix(null);
    setAuditUrl(targetUrl);

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          brandName: brandName || deriveBrand(targetUrl),
          supplementaryData: supplementary || undefined,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const { jobId: id } = await res.json();
      setJobId(id);
      setJobStatus('RUNNING');
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch {
      setError('Failed to start analysis. Check your API key and try again.');
      setLoading(false);
    }
  };

  const subscribe = useCallback((id: string) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource(`/api/status/${id}`);
    eventSourceRef.current = es;

    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'pillar_complete') {
          setPillars(prev => {
            const filtered = prev.filter(p => p.id !== msg.data.id);
            return [...filtered, msg.data].sort((a, b) => a.id - b.id);
          });
        } else if (msg.type === 'pillar_running') {
          setPillars(prev => {
            const exists = prev.find(p => p.id === msg.data.id);
            if (exists) return prev;
            const running: PillarResult = {
              id: msg.data.id, name: msg.data.name,
              status: 'RUNNING', findings: [], opportunity: '',
            };
            return [...prev, running].sort((a, b) => a.id - b.id);
          });
        } else if (msg.type === 'job_complete') {
          const job: AnalysisJob = msg.data;
          setPillars(job.pillars.sort((a, b) => a.id - b.id));
          setJobStatus('COMPLETE');
          if (job.opportunityMatrix) setOpportunityMatrix(job.opportunityMatrix);
          setLoading(false);
          es.close();
        } else if (msg.type === 'error') {
          setError('Job not found');
          setLoading(false);
          es.close();
        }
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => {
      setLoading(false);
      es.close();
    };
  }, []);

  useEffect(() => {
    if (jobId) subscribe(jobId);
    return () => eventSourceRef.current?.close();
  }, [jobId, subscribe]);

  const download = (format: 'docx' | 'pptx') => {
    if (!jobId) return;
    window.location.href = `/api/download/${jobId}?format=${format}`;
  };

  const completedCount = pillars.filter(p => p.status !== 'RUNNING' && p.status !== 'PENDING').length;
  const greenCount = pillars.filter(p => p.status === 'GREEN').length;
  const amberCount = pillars.filter(p => p.status === 'AMBER').length;
  const redCount   = pillars.filter(p => p.status === 'RED').length;

  return (
    <section id="audit" className="section" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="container">
        {/* Header */}
        <div data-reveal style={{ maxWidth: '520px', marginBottom: '48px' }}>
          <p className="label" style={{ marginBottom: '12px' }}>Free Audit</p>
          <h2 style={{ fontSize: 'var(--size-h1)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Run your audit now
          </h2>
          <p style={{ fontSize: 'var(--size-body)', color: 'var(--text-secondary)' }}>
            Takes ~8 minutes. No signup required.
          </p>
        </div>

        {/* Form */}
        <div data-reveal style={{ maxWidth: '600px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* URL input */}
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)', pointerEvents: 'none', fontSize: '15px',
                  fontFamily: 'var(--font-mono), monospace',
                }}
              >
                ⌖
              </span>
              <input
                type="text"
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://your-store.com"
                className="field"
                style={{ paddingLeft: '40px', fontSize: '15px' }}
                required
                autoFocus
              />
            </div>

            {/* Brand name */}
            <input
              type="text"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              placeholder="Brand name (auto-detected)"
              className="field"
              style={{ fontSize: 'var(--size-small)' }}
            />

            {/* Supplementary toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowSupp(s => !s)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: 'var(--text-tertiary)', fontSize: 'var(--size-small)',
                  fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.05em',
                  padding: '4px 0',
                  transition: 'color var(--dur-std)',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <IconChevron down={showSupp} />
                Supplementary data
              </button>

              {showSupp && (
                <textarea
                  value={supplementary}
                  onChange={e => setSupplementary(e.target.value)}
                  placeholder="Paste SEMrush exports, Similarweb data, ad library screenshots, or any context to improve accuracy…"
                  rows={4}
                  className="field animate-fade-up"
                  style={{ marginTop: '8px', resize: 'vertical', fontSize: 'var(--size-small)' }}
                />
              )}
            </div>

            {error && (
              <p style={{ color: 'var(--red)', fontSize: 'var(--size-small)', fontFamily: 'var(--font-mono), monospace' }}>
                ✗ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                justifyContent: 'center', padding: '14px',
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      display: 'inline-block', width: '14px', height: '14px',
                      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Analysing…
                </>
              ) : 'Run free audit →'}
            </button>
          </form>
        </div>

        {/* Results */}
        {pillars.length > 0 && (
          <div ref={resultsRef} style={{ marginTop: '56px', maxWidth: '720px' }}>
            {/* Progress header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {jobStatus === 'COMPLETE' ? 'Audit complete' : `Auditing… ${completedCount} of 13`}
                </p>
                {jobStatus === 'COMPLETE' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: 'var(--size-small)', color: 'var(--green)' }}>{greenCount} green</span>
                    <span style={{ fontSize: 'var(--size-small)', color: 'var(--amber)' }}>{amberCount} amber</span>
                    <span style={{ fontSize: 'var(--size-small)', color: 'var(--red)' }}>{redCount} red</span>
                  </div>
                )}
              </div>

              {jobStatus === 'COMPLETE' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => download('docx')} className="btn-ghost" style={{ fontSize: 'var(--size-small)', padding: '8px 14px', gap: '6px' }}>
                    <IconDownload /> Word report
                  </button>
                  <button onClick={() => download('pptx')} className="btn-ghost" style={{ fontSize: 'var(--size-small)', padding: '8px 14px', gap: '6px' }}>
                    <IconDownload /> Deck
                  </button>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {jobStatus !== 'COMPLETE' && (
              <div
                style={{
                  height: '3px', background: 'var(--surface-2)', borderRadius: '2px',
                  marginBottom: '20px', overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(completedCount / 13) * 100}%`,
                    background: 'var(--accent)',
                    borderRadius: '2px',
                    transition: 'width 600ms var(--ease-out)',
                  }}
                />
              </div>
            )}

            {/* Pillar rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pillars.map(p => (
                <PillarRow key={p.id} pillar={p} />
              ))}
            </div>

            {/* Opportunity matrix */}
            {opportunityMatrix && <OpportunityMatrixView matrix={opportunityMatrix} />}

            {/* Lead capture */}
            {jobStatus === 'COMPLETE' && <LeadCapture brandUrl={auditUrl} />}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────── */
function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '48px 0',
        background: 'var(--surface-1)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '32px', flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px', marginBottom: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Fulcrum</span>
            <span style={{ fontSize: '15px', fontWeight: 400, color: 'var(--text-tertiary)', letterSpacing: '-0.02em' }}>Solutions</span>
          </div>
          <p style={{ fontSize: 'var(--size-small)', color: 'var(--text-tertiary)' }}>
            Ecommerce growth, built.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <a
            href="https://fulcrumsolutions.online"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 'var(--size-small)', color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            fulcrumsolutions.online
          </a>
          <a
            href="mailto:mraaronmanu@gmail.com"
            style={{ fontSize: 'var(--size-small)', color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            mraaronmanu@gmail.com
          </a>
          <p style={{ fontSize: 'var(--size-label)', color: 'var(--text-tertiary)', marginTop: '8px', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.04em' }}>
            © 2026 Fulcrum Solutions
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────
   SCROLL REVEAL HOOK
   ───────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

/* ─────────────────────────────────────────
   ROOT
   ───────────────────────────────────────── */
export default function Home() {
  useScrollReveal();

  return (
    <>
      <Nav />
      <main style={{ paddingTop: '56px' }}>
        <Hero />
        <HowItWorks />
        <PillarsGrid />
        <Deliverables />
        <Services />
        <AuditTool />
      </main>
      <Footer />
    </>
  );
}
