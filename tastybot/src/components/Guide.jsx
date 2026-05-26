import React, { useState } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { useIsMobile } from '../useIsMobile.js'

function Section({ title, icon, children }) {
  const { theme: C } = useTheme()
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 18, paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: C.fontMono, fontSize: 12, color: C.accent, letterSpacing: 2, fontWeight: 700 }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function Card({ children, accent }) {
  const { theme: C } = useTheme()
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${accent ? accent + '44' : C.border}`,
      borderLeft: accent ? `3px solid ${accent}` : `1px solid ${C.border}`,
      borderRadius: 10, padding: 20, marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

function CodeBlock({ children }) {
  const { theme: C } = useTheme()
  return (
    <pre style={{
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '14px 18px', margin: '10px 0',
      fontFamily: C.fontMono, fontSize: 12, color: C.gold,
      overflowX: 'auto', lineHeight: 1.7,
    }}>{children}</pre>
  )
}

function Step({ n, title, children }) {
  const { theme: C } = useTheme()
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <div style={{
        flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
        background: C.accent + '20', border: `1px solid ${C.accent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: C.fontMono, fontSize: 14, color: C.accent, fontWeight: 700,
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 8, lineHeight: 1 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}

function Faq({ q, a }) {
  const { theme: C } = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      marginBottom: 8, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '14px 20px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ fontFamily: C.fontMono, fontSize: 13, color: C.text, fontWeight: 500 }}>{q}</span>
        <span style={{ color: C.accent, fontFamily: C.fontMono, fontSize: 16, flexShrink: 0, marginLeft: 12 }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{
          padding: '14px 20px 16px', fontSize: 13, color: C.muted,
          lineHeight: 1.7, borderTop: `1px solid ${C.border}`,
        }}>
          {a}
        </div>
      )}
    </div>
  )
}

function ModeChip({ label, color, description }) {
  const { theme: C } = useTheme()
  return (
    <div style={{
      background: color + '10', border: `1px solid ${color + '50'}`,
      borderRadius: 10, padding: '14px 18px', flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
        <span style={{ fontFamily: C.fontMono, fontSize: 13, color, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
      </div>
      <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}

const FAQS = [
  {
    q: "Why isn't the bot entering any trades?",
    a: "All 8 signals must pass simultaneously. This is intentionally strict. On quiet market days with low ADX or flat EMAs, the bot will find zero qualifying setups — that's the filter doing its job. Check the Scan Feed on the Live Monitor to see recent scanner scores and which signals are failing.",
  },
  {
    q: 'What does DRY_RUN mode mean?',
    a: "In dry-run mode (launched with --dry-run), the bot runs the full scan-and-decision cycle including option selection and sizing, but submits no real orders. Trades are recorded in the database with status DRY_RUN so you can evaluate the strategy without capital at risk. Switch to paper or live mode in your .env file.",
  },
  {
    q: 'What is paper trading vs live trading?',
    a: "Paper mode uses Tastytrade's paper trading account — all orders are real API calls but go to a simulated account with no real money. Live mode targets your real brokerage account. Set TRADING_MODE=paper or TRADING_MODE=live in your .env file. Always validate with dry-run and paper first.",
  },
  {
    q: 'The API shows OFFLINE — what do I do?',
    a: "The backend Flask server on port 5050 isn't reachable. Make sure you ran `python main.py --dry-run` in the tastybot directory. If you see credential errors in the terminal, check your TASTYTRADE_USERNAME and TASTYTRADE_PASSWORD in the .env file.",
  },
  {
    q: 'What triggers the kill switch?',
    a: "The weekly loss limit (default 20% of account) being breached. Once triggered, all new entries are blocked. You can manually resolve it from the Live Monitor tab once you've reviewed the situation. It also auto-resolves on Monday morning if losses haven't re-triggered the threshold.",
  },
  {
    q: 'How is IVR calculated?',
    a: 'IVR (Implied Volatility Rank) compares current IV to its 52-week range: IVR = (current IV − 52w low) / (52w high − 52w low) × 100. Below 50 means IV is in the cheaper half of its annual range — a good time to buy options. The bot uses yfinance data to approximate this.',
  },
  {
    q: 'Why does the bot use options instead of shares?',
    a: 'Options provide leverage, allowing the bot to express a directional view with a defined maximum loss (the premium paid). A -30% loss on an option position that represents 25% of the account is only a 7.5% drawdown on total equity — far less than holding the same notional exposure in shares.',
  },
  {
    q: 'Can I add more tickers to the watchlist?',
    a: 'Yes — edit scanner.py and add tickers to the T1 or T2 universe lists. Keep in mind the signal filter is calibrated for liquid, high-volume equities. Adding illiquid names may result in noisy signals or wide option spreads that make fills harder.',
  },
  {
    q: 'How do I get Telegram notifications?',
    a: 'Create a Telegram bot via @BotFather, get the token, then find your chat ID by messaging @userinfobot. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to your .env file. The bot sends alerts on trade entry, partial exits, full exits, and kill switch events.',
  },
]

export default function Guide() {
  const { theme: C } = useTheme()
  const isMobile = useIsMobile()
  const [activeTabId, setActiveTabId] = useState('LIVE MONITOR')
  const col2 = isMobile ? '1fr' : '1fr 1fr'

  const TABS_INFO = [
    {
      icon: '◉', id: 'LIVE MONITOR', color: C.green,
      desc: 'Your trading cockpit. Shows all open positions with live P&L, entry/target/stop bars, and signal badges. Recently closed trades appear below. Click any trade to expand the full detail panel on the right — rationale, SMC confluence, signals, and exit breakdown.',
      tips: [
        'The progress bar on each position shows Stop → Entry → Current → Target on a price scale.',
        'A ⚡ SWEEP badge means a liquidity sweep was detected at entry — generally a stronger signal.',
        'The kill switch resolve button appears here when the weekly loss limit has been triggered.',
        'The Scan Feed shows the last 20 scanner results so you can see what the bot is evaluating.',
      ],
    },
    {
      icon: '≡', id: 'JOURNAL', color: C.muted,
      desc: 'Full trade history with filters. Use the filter bar to slice by tier (T1/T2/T3), status (OPEN/CLOSED), or exit type (TARGET_HIT, STOP_LOSS, TIME_STOP). Each trade card is expandable to show the full rationale and bot notes.',
      tips: [
        'Filter by STOP_LOSS to review losing trades and look for patterns.',
        'Filter by TARGET_HIT to see your winners and check which tickers perform best.',
        'The SWEEP indicator on each card shows whether SMC sweep confluence was present at entry.',
      ],
    },
    {
      icon: '↗', id: 'PERFORMANCE', color: C.cyan,
      desc: 'Strategy analytics. KPI cards show total P&L, win rate, average win/loss, and expectancy (the average dollar outcome per trade — must be positive for a viable strategy). Charts show equity curve and account value history.',
      tips: [
        'Expectancy is the most important single number — aim for > $0 per trade.',
        'The "By Exit Type" table reveals whether your stop losses or time stops are hurting you most.',
        'The "By Tier" table shows which tier is contributing most to returns.',
        'Account Value shows real net liquidating value tracked every 5 minutes during market hours.',
      ],
    },
    {
      icon: '⊡', id: 'BACKTEST', color: C.gold,
      desc: 'Monte Carlo simulator. Set your assumptions (win rate, avg win/loss, position size, tier allocation) and run thousands of simulated trade paths. Results show the distribution of outcomes across all runs, not just the average.',
      tips: [
        'Run with the actual win rate from your Performance tab to see forward projections.',
        'Max drawdown is the key risk metric — if it exceeds your risk tolerance, reduce position size.',
        'The Sharpe ratio above 1.0 indicates good risk-adjusted returns.',
        'Save runs and compare them using the history dropdown to test parameter sensitivity.',
      ],
    },
    {
      icon: '⊞', id: 'STRATEGY', color: C.accent,
      desc: 'This is the strategy reference — a complete breakdown of entry signals, tiers, position sizing, SMC concepts, and exit rules. Return here whenever you need to understand why the bot made a decision.',
      tips: [],
    },
  ]

  const activeTab = TABS_INFO.find(t => t.id === activeTabId)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.muted, letterSpacing: 3, marginBottom: 8, textTransform: 'uppercase' }}>
          How It Works
        </div>
        <h1 style={{ fontFamily: C.fontMono, fontSize: 22, color: C.accent, margin: '0 0 12px', fontWeight: 700, letterSpacing: 2 }}>
          TastyBot Setup &amp; Usage Guide
        </h1>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, margin: 0, maxWidth: 700 }}>
          TastyBot is a fully automated momentum options trading system built on top of the Tastytrade API.
          This guide covers setup, the three trading modes, what each dashboard tab does, and answers to common questions.
        </p>
      </div>

      {/* System overview */}
      <Section title="HOW IT WORKS — SYSTEM OVERVIEW" icon="🔁">
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(5, minmax(80px, 1fr))' : 'repeat(5, 1fr)', gap: 0,
          marginBottom: 20, background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 10,
          overflow: isMobile ? 'auto' : 'hidden',
        }}>
          {[
            { icon: '📡', label: 'SCANNER', sub: 'Polls price data every 5 min', color: C.blue },
            { icon: '⚙', label: 'SIGNALS', sub: '8-point filter applied', color: C.gold },
            { icon: '📐', label: 'STRATEGY', sub: 'Tier, delta & expiry selected', color: C.cyan },
            { icon: '⚖', label: 'RISK CHECK', sub: 'Position size & limits verified', color: C.purple },
            { icon: '📤', label: 'EXECUTOR', sub: 'Order sent to Tastytrade', color: C.green },
          ].map((step, i) => (
            <div key={step.label} style={{
              padding: '18px 14px', textAlign: 'center',
              borderRight: i < 4 ? `1px solid ${C.border}` : 'none',
              position: 'relative',
            }}>
              {i > 0 && (
                <div style={{
                  position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
                  color: C.dim, fontFamily: C.fontMono, fontSize: 14, zIndex: 1,
                }}>→</div>
              )}
              <div style={{ fontSize: 24, marginBottom: 8 }}>{step.icon}</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: step.color, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                {step.label}
              </div>
              <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.4 }}>{step.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 12 }}>
          <Card accent={C.blue}>
            <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.blue, marginBottom: 8, fontWeight: 700 }}>BACKEND (Python)</div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', color: C.muted, fontSize: 13, lineHeight: 2 }}>
              <li>Flask API on port 5050 serves the dashboard</li>
              <li>APScheduler runs scan cycles Mon–Fri market hours</li>
              <li>Positions monitored every 5 minutes for exits</li>
              <li>Account value snapshotted every 5 minutes</li>
              <li>All data stored in local SQLite database</li>
            </ul>
          </Card>
          <Card accent={C.gold}>
            <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.gold, marginBottom: 8, fontWeight: 700 }}>DASHBOARD (React)</div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', color: C.muted, fontSize: 13, lineHeight: 2 }}>
              <li>Vite dev server on port 5173</li>
              <li>Polls /api/status every 10 seconds</li>
              <li>Polls /api/trades every 30 seconds</li>
              <li>Polls /api/performance every 60 seconds</li>
              <li>No build step needed for local use</li>
            </ul>
          </Card>
        </div>
      </Section>

      {/* Setup */}
      <Section title="INITIAL SETUP" icon="🛠">
        <Step n="1" title="Extract & navigate">
          <CodeBlock>{`unzip tastybot.zip
cd tastybot`}</CodeBlock>
        </Step>

        <Step n="2" title="Configure credentials">
          <CodeBlock>{`cp .env.example .env
# Then edit .env with your details:`}</CodeBlock>
          <div style={{
            background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '14px 18px', fontFamily: C.fontMono, fontSize: 12, color: C.text, lineHeight: 2,
          }}>
            <div><span style={{ color: C.dim }}># Required</span></div>
            <div><span style={{ color: C.cyan }}>TASTYTRADE_USERNAME</span>=<span style={{ color: C.green }}>your_username</span></div>
            <div><span style={{ color: C.cyan }}>TASTYTRADE_PASSWORD</span>=<span style={{ color: C.green }}>your_password</span></div>
            <div><span style={{ color: C.cyan }}>ACCOUNT_NUMBER</span>=<span style={{ color: C.green }}>your_account_number</span></div>
            <div><span style={{ color: C.cyan }}>TRADING_MODE</span>=<span style={{ color: C.gold }}>paper</span><span style={{ color: C.dim }}>  # paper | live</span></div>
            <div style={{ marginTop: 8 }}><span style={{ color: C.dim }}># Optional — Telegram alerts</span></div>
            <div><span style={{ color: C.cyan }}>TELEGRAM_BOT_TOKEN</span>=<span style={{ color: C.muted }}>...</span></div>
            <div><span style={{ color: C.cyan }}>TELEGRAM_CHAT_ID</span>=<span style={{ color: C.muted }}>...</span></div>
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
            Your account number appears in the Tastytrade app under Account → Account Information.
            Paper trading accounts have a separate number from live accounts.
          </p>
        </Step>

        <Step n="3" title="Create Python virtual environment">
          <CodeBlock>{`./setup_venv.sh`}</CodeBlock>
        </Step>

        <Step n="4" title="Start the backend">
          <CodeBlock>{`./start.sh --dry-run     # safe — no orders placed
# or
./start.sh              # paper/live mode from .env`}</CodeBlock>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
            The Flask API starts on port 5050. Logs stream to logs/bot.log. Use ./status.sh to check.
          </p>
        </Step>

        <Step n="5" title="Start the dashboard (separate terminal)">
          <CodeBlock>{`cd dashboard
npm install        # first time only
npm run dev        # opens at http://localhost:5173`}</CodeBlock>
        </Step>
      </Section>

      {/* Trading modes */}
      <Section title="TRADING MODES" icon="🔄">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexDirection: isMobile ? 'column' : 'row' }}>
          <ModeChip
            label="DRY RUN"
            color={C.gold}
            description="Launched with --dry-run flag. Full scan and decision cycle runs but zero orders are sent. Trades logged as DRY_RUN in the database. Best for initial validation."
          />
          <ModeChip
            label="PAPER"
            color={C.green}
            description="TRADING_MODE=paper in .env. Real API calls go to Tastytrade's paper trading environment. Identical to live but with simulated capital. Recommended for 2–4 weeks before going live."
          />
          <ModeChip
            label="LIVE"
            color={C.red}
            description="TRADING_MODE=live in .env. Orders execute against your real account. Only switch here after paper trading confirms the strategy behaves as expected."
          />
        </div>
        <Card accent={C.gold}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.7 }}>
              Always start with <span style={{ color: C.gold, fontFamily: C.fontMono }}>--dry-run</span> for at least one full trading week to confirm the bot connects correctly and the strategy logic runs as expected. Then move to <span style={{ color: C.green, fontFamily: C.fontMono }}>paper</span> for several weeks before risking real capital.
            </p>
          </div>
        </Card>
      </Section>

      {/* Phone access */}
      <Section title="VIEWING ON YOUR PHONE" icon="📱">
        <Card accent={C.cyan}>
          <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.cyan, marginBottom: 12, fontWeight: 700 }}>SAME WI-FI NETWORK (Easiest)</div>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
            The dashboard server is already configured to expose on your local network. On your Mac, find your IP address:
          </p>
          <CodeBlock>{`# On your Mac:
ipconfig getifaddr en0    # Wi-Fi IP
# Example output: 192.168.1.42`}</CodeBlock>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 8 }}>
            Then open <strong style={{ color: C.gold, fontFamily: C.fontMono }}>http://192.168.1.42:5173</strong> in your phone's browser (same Wi-Fi required).
          </p>
        </Card>
        <Card accent={C.purple}>
          <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.purple, marginBottom: 12, fontWeight: 700 }}>REMOTE ACCESS (Any network)</div>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 10 }}>
            Install <strong style={{ color: C.text }}>Tailscale</strong> (free) on your Mac and phone for a private VPN tunnel — no port forwarding needed.
          </p>
          <CodeBlock>{`brew install tailscale
sudo tailscale up
# Then access via your Tailscale IP on your phone`}</CodeBlock>
          <p style={{ fontSize: 12, color: C.dim, margin: 0, lineHeight: 1.6 }}>
            Tailscale creates an encrypted peer-to-peer connection. Your dashboard is never exposed to the public internet.
          </p>
        </Card>
      </Section>

      {/* Tab guide */}
      <Section title="DASHBOARD TABS — WHAT EACH DOES" icon="🗂">
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS_INFO.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTabId(t.id)}
              style={{
                background: activeTabId === t.id ? t.color + '20' : 'transparent',
                border: `1px solid ${activeTabId === t.id ? t.color : C.border}`,
                color: activeTabId === t.id ? t.color : C.muted,
                borderRadius: 8, padding: '7px 14px',
                fontFamily: C.fontMono, fontSize: 11, fontWeight: activeTabId === t.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t.icon} {t.id}
            </button>
          ))}
        </div>

        {activeTab && (
          <div>
            <Card accent={activeTab.color}>
              <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.7 }}>{activeTab.desc}</p>
            </Card>
            {activeTab.tips.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' }}>Pro Tips</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeTab.tips.map((tip, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 12, padding: '10px 14px',
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                    }}>
                      <span style={{ color: C.accent, fontFamily: C.fontMono, fontSize: 13, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Scheduler */}
      <Section title="WHEN THE BOT IS ACTIVE" icon="🕐">
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 12 }}>
          <Card accent={C.green}>
            <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.green, marginBottom: 10, fontWeight: 700 }}>ACTIVE HOURS</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 13, color: C.text, lineHeight: 2 }}>
              <div>Monday – Friday</div>
              <div style={{ color: C.gold }}>09:35 – 15:55 ET</div>
              <div style={{ color: C.muted, fontSize: 11 }}>Scan interval: every 5 minutes</div>
              <div style={{ color: C.muted, fontSize: 11 }}>Position check: every 5 minutes</div>
            </div>
          </Card>
          <Card>
            <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.dim, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Scheduled Jobs</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 2, fontFamily: C.fontMono }}>
              <div><span style={{ color: C.gold }}>09:35</span> — Market open scan</div>
              <div><span style={{ color: C.gold }}>Every 5m</span> — Scanner + exit monitor</div>
              <div><span style={{ color: C.gold }}>Every 5m</span> — Account snapshot</div>
              <div><span style={{ color: C.gold }}>Mon 08:00</span> — Weekly loss reset check</div>
            </div>
          </Card>
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
          The bot must be running continuously during market hours for position monitoring to work. If you stop the backend
          while holding open positions, exits will not be triggered. Use a persistent server, VPS, or always-on machine for live trading.
        </p>
      </Section>

      {/* FAQ */}
      <Section title="FAQ" icon="❓">
        {FAQS.map(faq => (
          <Faq key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </Section>
    </div>
  )
}
