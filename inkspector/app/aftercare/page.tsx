import Link from 'next/link'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import Nav from '@/components/nav'
import { InstagramIcon } from '@/components/icons'

const phases = [
  {
    title: 'First 24 Hours',
    steps: [
      'Leave the initial wrap on for 2–4 hours (or as instructed).',
      'Wash gently with unscented antibacterial soap and lukewarm water.',
      'Pat dry with a clean paper towel — never rub.',
      'Apply a very thin layer of unscented moisturiser (Bepanthen, Hustle Butter, or Lubriderm).',
      'Keep it uncovered and let it breathe.',
    ],
  },
  {
    title: 'Days 2–7',
    steps: [
      'Wash twice a day — morning and night.',
      'Apply a thin moisturiser layer after each wash.',
      'Expect some redness, swelling, and light peeling — this is normal.',
      'Do not pick, scratch, or peel any flaking skin.',
      'Wear loose clothing over the tattoo to avoid friction.',
    ],
  },
  {
    title: 'Week 2–4',
    steps: [
      'Continue moisturising once or twice daily as needed.',
      'The tattoo will look cloudy or milky as it heals — this is normal.',
      'Avoid submerging in water (baths, pools, sea) until fully healed.',
      'Keep away from direct sunlight — no sunbeds.',
      'If you use second-skin / Saniderm wrap, leave it on for 3–5 days.',
    ],
  },
  {
    title: 'Long-Term Care',
    steps: [
      'Apply SPF 50+ sunscreen whenever the tattoo is exposed to sun.',
      'Moisturise regularly to keep the skin and ink healthy.',
      'Avoid prolonged soaking in baths or hot tubs.',
      'Touch-ups are available if needed once fully healed (usually 6–8 weeks).',
    ],
  },
]

const avoid = [
  'Picking or scratching any peeling skin',
  'Soaking in baths, pools, or the sea',
  'Direct sun exposure without SPF 50+',
  'Sunbeds',
  'Tight clothing rubbing the tattoo',
  'Petroleum jelly (Vaseline)',
  'Perfumed lotions or soaps',
  'Shaving over a healing tattoo',
]

const warningSigns = [
  'Excessive swelling or redness spreading after the first few days',
  'Yellow or green discharge',
  'Fever or feeling unwell',
  'Hot, hard, or very painful skin around the tattoo',
]

export default function AftercarePage() {
  return (
    <>
      <Nav />

      <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Healing</p>
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-4">Aftercare</h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl">
            Your tattoo is an open wound for the first few days. How you care for it directly affects how it heals and how it looks long-term. Follow these steps carefully.
          </p>
        </div>

        {/* Phase guides */}
        <div className="space-y-10 mb-16">
          {phases.map((phase, i) => (
            <div key={phase.title} className="border-l-2 border-primary/30 pl-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-primary font-medium tracking-widest uppercase">Phase {i + 1}</span>
                <h2 className="font-heading text-xl font-semibold">{phase.title}</h2>
              </div>
              <ul className="space-y-2">
                {phase.steps.map(step => (
                  <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle size={14} className="text-primary mt-0.5 shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Avoid */}
        <div className="bg-card border border-border rounded-sm p-6 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">What to Avoid</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {avoid.map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-destructive mt-0.5">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Warning signs */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-sm p-6 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-destructive" />
            <h2 className="font-semibold text-destructive">Signs of Infection</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">If you notice any of the following, seek medical advice promptly:</p>
          <ul className="space-y-1">
            {warningSigns.map(sign => (
              <li key={sign} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-destructive mt-0.5">·</span>
                {sign}
              </li>
            ))}
          </ul>
        </div>

        {/* Products */}
        <div className="border-t border-border pt-10 mb-12">
          <h2 className="font-heading text-xl font-semibold mb-4">Recommended Products</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'Bepanthen', type: 'Moisturiser', note: 'Classic choice, widely available at pharmacies.' },
              { name: 'Hustle Butter', type: 'Specialist Balm', note: 'Tattoo-specific formula, excellent for the healing phase.' },
              { name: 'Saniderm / Tegaderm', type: 'Second Skin', note: 'Breathable bandage for the first 3–5 days. Ask at your appointment.' },
            ].map(p => (
              <div key={p.name} className="bg-card border border-border rounded-sm p-4">
                <p className="font-medium mb-0.5">{p.name}</p>
                <p className="text-xs text-primary mb-2">{p.type}</p>
                <p className="text-xs text-muted-foreground">{p.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Touch-ups + CTA */}
        <div className="text-center border border-border rounded-sm p-8">
          <h2 className="font-heading text-xl mb-2">Need a touch-up?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Once fully healed (6–8 weeks), touch-ups can be arranged. Reach out via the booking form or Instagram.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book" className="px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors">
              Book a Touch-up
            </Link>
            <a href="https://instagram.com/inkspector_" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-sm rounded-sm hover:border-muted-foreground transition-colors">
              <InstagramIcon size={14} /> DM on Instagram
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="font-heading font-bold text-foreground tracking-widest uppercase">Inkspector</p>
          <p>One by One Tattoo · London</p>
          <a href="https://instagram.com/inkspector_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <InstagramIcon size={16} /> @inkspector_
          </a>
        </div>
      </footer>
    </>
  )
}
