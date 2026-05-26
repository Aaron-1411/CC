import React, { useState } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { useIsMobile } from '../useIsMobile.js'

function Section({ title, icon, children }) {
  const { theme: C } = useTheme()
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
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

function Label({ children, color }) {
  const { theme: C } = useTheme()
  return (
    <span style={{
      background: (color || C.muted) + '22',
      border: `1px solid ${color || C.muted}`,
      color: color || C.muted,
      borderRadius: 4, padding: '2px 8px',
      fontSize: 11, fontFamily: C.fontMono, fontWeight: 600,
    }}>{children}</span>
  )
}

function Row({ label, value, valueColor }) {
  const { theme: C } = useTheme()
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '7px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontFamily: C.fontMono, fontSize: 12, color: C.dim }}>{label}</span>
      <span style={{ fontFamily: C.fontMono, fontSize: 13, color: valueColor || C.text, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

function SignalRow({ label, description, bullRule, bearRule }) {
  const { theme: C } = useTheme()
  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          background: C.green + '20', border: `1px solid ${C.green}`,
          color: C.green, borderRadius: 3, padding: '1px 6px',
          fontSize: 10, fontFamily: C.fontMono, fontWeight: 700,
        }}>✓</span>
        <span style={{ fontFamily: C.fontMono, fontSize: 13, color: C.text, fontWeight: 600 }}>{label}</span>
      </div>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 6px 24px', lineHeight: 1.5 }}>{description}</p>
      {(bullRule || bearRule) && (
        <div style={{ margin: '6px 0 0 24px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {bullRule && (
            <span style={{ fontSize: 12, color: C.green, fontFamily: C.fontMono, background: C.green + '10', padding: '2px 8px', borderRadius: 3 }}>
              ▲ BULL: {bullRule}
            </span>
          )}
          {bearRule && (
            <span style={{ fontSize: 12, color: C.red, fontFamily: C.fontMono, background: C.red + '10', padding: '2px 8px', borderRadius: 3 }}>
              ▼ BEAR: {bearRule}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function Strategy() {
  const { theme: C } = useTheme()
  const isMobile = useIsMobile()
  const [activeTier, setActiveTier] = useState('T1')
  const col2 = isMobile ? '1fr' : '1fr 1fr'

  const TIERS = [
    {
      id: 'T1', color: C.blue, label: 'Conservative',
      tickers: ['SPY', 'QQQ'],
      type: 'Directional (Call or Put)',
      delta: '0.40 – 0.55 (near-the-money)',
      expiry: '14 – 42 days to expiration',
      target: '+60% on option premium',
      stop: '-30% on option premium',
      rationale: 'Index ETFs have lower volatility and tighter spreads. Closer-to-money options capture directional moves without excessive time decay risk.',
    },
    {
      id: 'T2', color: C.gold, label: 'Momentum',
      tickers: ['NVDA', 'META', 'TSLA', 'AAPL', 'MSFT', 'AMZN'],
      type: 'Directional (Call or Put)',
      delta: '0.25 – 0.40 (out-of-the-money)',
      expiry: '14 – 42 days to expiration',
      target: '+100% on option premium',
      stop: '-50% on option premium',
      rationale: 'High-beta mega-caps make large percentage moves. Lower-delta options cost less and amplify returns when the move happens.',
    },
    {
      id: 'T3', color: C.cyan, label: 'Catalyst / Earnings',
      tickers: ['Any T2 ticker with earnings ≤ 7 days away'],
      type: 'ATM Straddle (long Call + long Put)',
      delta: '~0.50 each leg',
      expiry: 'Nearest expiry after earnings date',
      target: '+150% on combined premium',
      stop: '-70% on combined premium',
      rationale: 'When earnings are imminent, direction is unpredictable but a large move is likely. A straddle profits from volatility in either direction.',
    },
  ]

  const SIGNALS = [
    {
      label: 'EMA ALIGNMENT',
      description: 'Price must be positioned on the correct side of both moving averages, confirming the trend direction.',
      bullRule: 'Price > EMA21 AND Price > EMA50',
      bearRule: 'Price < EMA21 AND Price < EMA50',
    },
    {
      label: 'EMA SLOPE',
      description: 'The 21-day EMA must be actively trending (not flat), confirming momentum exists rather than choppy consolidation.',
      bullRule: 'EMA21 rising over last 3 days',
      bearRule: 'EMA21 falling over last 3 days',
    },
    {
      label: 'ADX > 25',
      description: 'Average Directional Index measures trend strength. Below 25 = choppy range, above 25 = genuine directional trend. Required for both bull and bear.',
      bullRule: 'ADX > 25',
      bearRule: 'ADX > 25',
    },
    {
      label: 'RSI MOMENTUM',
      description: 'RSI is used for momentum confirmation, not overbought/oversold. We want RSI in the "power zone" — mid-range and moving in the right direction.',
      bullRule: 'RSI between 50–68, rising',
      bearRule: 'RSI between 32–50, falling',
    },
    {
      label: 'MACD CROSS',
      description: 'MACD line crossing above/below its signal line confirms short-term momentum shifting in the trade direction.',
      bullRule: 'MACD line > Signal line',
      bearRule: 'MACD line < Signal line',
    },
    {
      label: 'VOLUME SURGE',
      description: 'Elevated volume confirms institutional participation behind the move. Low-volume breakouts often fail.',
      bullRule: 'Volume > 1.5× 20-day average',
      bearRule: 'Volume > 1.5× 20-day average',
    },
    {
      label: 'IVR < 50',
      description: 'Implied Volatility Rank below 50 means options are relatively cheap versus their own history. Buying options when IV is low improves the risk/reward.',
      bullRule: 'IVR < 50',
      bearRule: 'IVR < 50',
    },
    {
      label: 'CATALYST',
      description: 'Earnings within 7 days acts as a catalyst signal. When present on T2 tickers it upgrades the trade to a T3 straddle instead of a directional option.',
      bullRule: 'Earnings within 7 days (→ T3)',
      bearRule: 'Earnings within 7 days (→ T3)',
    },
  ]

  const EXITS = [
    { icon: '🎯', label: 'TARGET HIT (partial exit)', color: C.green,
      description: 'When the option reaches the tier target, the bot closes 50% of contracts and moves the stop to breakeven on the remaining 50%. This locks in profit while letting winners run.' },
    { icon: '🔻', label: 'STOP LOSS', color: C.red,
      description: 'Hard stop set at entry. T1: -30%, T2: -50%, T3: -70%. After partial exit, the stop is raised to breakeven, then a trailing stop tracks the peak (close all if 12% drop from peak).' },
    { icon: '⏱', label: 'TIME STOP', color: C.gold,
      description: 'Options lose value through theta decay. Positions held 7 trading days without a significant move are closed regardless of P&L to avoid grinding decay.' },
    { icon: '📉', label: 'EMA REVERSAL', color: C.cyan,
      description: 'If the 21 EMA crosses against the trade direction, the underlying trend has likely reversed. Position is closed immediately.' },
    { icon: '📊', label: 'ADX COLLAPSE', color: C.purple,
      description: 'ADX dropping below 20 signals the trend has weakened into a range. Directional options lose their edge — position is closed.' },
  ]

  const SMC_ITEMS = [
    { label: 'LIQUIDITY SWEEP', icon: '⚡', color: C.cyan,
      description: 'Price briefly breaks a prior swing high or low (taking out stop orders), then quickly reverses back inside the range. This signals institutional accumulation/distribution — a strong short-term reversal cue. Trades with a sweep confirmation get priority.' },
    { label: 'PRICE ZONE', icon: '📍', color: C.gold,
      description: 'Based on the weekly candle range, price is classified as in a DISCOUNT zone (lower half — bullish value area), PREMIUM zone (upper half — bearish value area), or NEUTRAL (mid-range). Alignment between direction and zone improves edge.' },
    { label: 'EQUAL LEVELS', icon: '⟺', color: C.muted,
      description: 'Repeated highs or lows within 0.1% tolerance signal a liquidity pool — large resting orders at that level. These act as magnets for price, providing additional confluence for entries and targets.' },
  ]

  const tier = TIERS.find(t => t.id === activeTier)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Intro */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.muted, letterSpacing: 3, marginBottom: 8, textTransform: 'uppercase' }}>
          Strategy Reference
        </div>
        <h1 style={{ fontFamily: C.fontMono, fontSize: 22, color: C.accent, margin: '0 0 12px', fontWeight: 700, letterSpacing: 2 }}>
          TastyBot Signal &amp; Execution Rules
        </h1>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          TastyBot is a momentum-based options trading system. It scans a fixed universe of equities every 5 minutes during
          market hours, applies an 8-signal scoring filter, and enters directional options or straddles only when all signals
          align. Positions are managed automatically with hard stops, partial take-profits, and trend-invalidation exits.
        </p>
      </div>

      {/* Universe & Tiers */}
      <Section title="UNIVERSE &amp; TIERS" icon="🗂">
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          The bot trades three tiers with different risk profiles. Tier is determined at scan time based on the ticker and whether
          an earnings catalyst is present. All 8 signals must pass before entry — the tier then controls delta, expiry, targets, and stops.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {TIERS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTier(t.id)}
              style={{
                background: activeTier === t.id ? t.color + '20' : 'transparent',
                border: `1px solid ${activeTier === t.id ? t.color : C.border}`,
                color: activeTier === t.id ? t.color : C.muted,
                borderRadius: 8, padding: '8px 20px',
                fontFamily: C.fontMono, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t.id} — {t.label}
            </button>
          ))}
        </div>

        <Card accent={tier.color}>
          <div style={{ marginBottom: 12 }}>
            <Label color={tier.color}>{tier.id}</Label>
            <span style={{ fontFamily: C.fontMono, fontSize: 14, color: tier.color, marginLeft: 10, fontWeight: 600 }}>
              {tier.label}
            </span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: C.dim, fontFamily: C.fontMono, marginBottom: 4, letterSpacing: 1 }}>TICKERS</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tier.tickers.map(tk => (
                <span key={tk} style={{
                  background: C.panel, border: `1px solid ${C.border}`,
                  color: C.text, borderRadius: 4, padding: '3px 10px',
                  fontFamily: C.fontMono, fontSize: 12, fontWeight: 600,
                }}>{tk}</span>
              ))}
            </div>
          </div>

          <Row label="OPTION TYPE" value={tier.type} />
          <Row label="DELTA TARGET" value={tier.delta} />
          <Row label="EXPIRY WINDOW" value={tier.expiry} />
          <Row label="PROFIT TARGET" value={tier.target} valueColor={C.green} />
          <Row label="STOP LOSS" value={tier.stop} valueColor={C.red} />

          <div style={{ marginTop: 14, padding: '10px 14px', background: C.panel, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: C.dim, fontFamily: C.fontMono, marginBottom: 4, letterSpacing: 1 }}>RATIONALE</div>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>{tier.rationale}</p>
          </div>
        </Card>
      </Section>

      {/* 8-Signal System */}
      <Section title="THE 8-SIGNAL ENTRY FILTER" icon="⚙">
        <Card accent={C.gold}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{
              fontFamily: C.fontMono, fontSize: 32, fontWeight: 700, color: C.gold,
              background: C.gold + '10', border: `1px solid ${C.gold}`,
              borderRadius: 8, padding: '4px 16px',
            }}>8/8</div>
            <div>
              <div style={{ color: C.text, fontFamily: C.fontMono, fontSize: 14, fontWeight: 600 }}>
                All 8 signals must pass — no exceptions
              </div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                A score of 7/8 is not enough. This strict filter keeps the win rate high by only entering
                trades where every confirmation agrees.
              </div>
            </div>
          </div>
        </Card>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 20px' }}>
          {SIGNALS.map((sig, i) => (
            <div key={sig.label}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '4px 0' }}>
                <div style={{
                  fontFamily: C.fontMono, fontSize: 12, color: C.dim, minWidth: 24,
                  paddingTop: 16, textAlign: 'right',
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <SignalRow {...sig} />
                </div>
              </div>
              {i < SIGNALS.length - 1 && <div style={{ borderTop: `1px solid ${C.border}` }} />}
            </div>
          ))}
        </div>
      </Section>

      {/* Position Sizing */}
      <Section title="POSITION SIZING &amp; RISK LIMITS" icon="⚖">
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 16, marginBottom: 16 }}>
          <Card accent={C.blue}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginBottom: 8, letterSpacing: 1 }}>SIZING FORMULA</div>
            <div style={{
              fontFamily: C.fontMono, fontSize: 13, color: C.gold,
              background: C.panel, borderRadius: 8, padding: '10px 14px', marginBottom: 8,
            }}>
              contracts = (account × 15%) ÷ (option_price × 100)
            </div>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>
              Each position is sized to risk a maximum of 15% of account equity (half-Kelly optimal). Contracts are rounded down. Overridable via MAX_POSITION_PCT in .env.
            </p>
          </Card>

          <Card accent={C.red}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginBottom: 10, letterSpacing: 1 }}>HARD LIMITS</div>
            <Row label="MAX POSITION SIZE" value="15% of account" />
            <Row label="MAX OPEN POSITIONS" value="3 simultaneous" />
            <Row label="MAX PORTFOLIO HEAT" value="45% total premium" />
            <Row label="DAILY LOSS LIMIT" value="10% of account" valueColor={C.red} />
            <Row label="WEEKLY LOSS LIMIT" value="20% of account" valueColor={C.red} />
          </Card>
        </div>

        <Card accent={C.red}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <div>
              <div style={{ fontFamily: C.fontMono, fontSize: 13, color: C.red, fontWeight: 600, marginBottom: 6 }}>KILL SWITCH</div>
              <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                If the weekly loss limit is breached, the kill switch automatically activates. All new entries are blocked until the
                switch is manually resolved via the Live Monitor tab. It resets automatically on Monday morning if losses have recovered
                below the threshold.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* R:R & Expectancy */}
      <Section title="RISK:REWARD &amp; EXPECTANCY" icon="📐">
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
          R:R alone doesn't tell you whether a strategy is profitable — you also need win rate. The key metric is
          <strong style={{ color: C.gold }}> expectancy</strong>: the average dollar outcome per dollar risked per trade.
          Any positive expectancy strategy is profitable at scale. Target expectancy &gt; $0.20 per $1 risked.
        </p>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'auto', marginBottom: 20 }}>
          <div style={{ background: C.panel, padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.gold, letterSpacing: 2 }}>R:R BY TIER — EXACT MATH</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.fontMono }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['TIER', 'PROFIT TARGET', 'STOP LOSS', 'R:R RATIO', 'BREAKEVEN WIN RATE', 'EXPECTANCY @ 55% WIN'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', fontSize: 10, color: C.dim, fontWeight: 600, textAlign: 'left', letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { tier: 'T1', color: C.blue, target: '+60%', stop: '-30%', rr: '2.0 : 1', be: '33.3%', exp: '+$0.21' },
                { tier: 'T2', color: C.gold, target: '+100%', stop: '-50%', rr: '2.0 : 1', be: '33.3%', exp: '+$0.27' },
                { tier: 'T3', color: C.cyan, target: '+150%', stop: '-70%', rr: '2.14 : 1', be: '31.8%', exp: '+$0.34' },
              ].map(row => (
                <tr key={row.tier} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: row.color + '22', border: `1px solid ${row.color}`, color: row.color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      {row.tier}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: C.green, fontSize: 13 }}>{row.target}</td>
                  <td style={{ padding: '10px 14px', color: C.red, fontSize: 13 }}>{row.stop}</td>
                  <td style={{ padding: '10px 14px', color: C.gold, fontSize: 14, fontWeight: 700 }}>{row.rr}</td>
                  <td style={{ padding: '10px 14px', color: C.muted, fontSize: 13 }}>{row.be}</td>
                  <td style={{ padding: '10px 14px', color: C.green, fontSize: 13, fontWeight: 600 }}>{row.exp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 16, marginBottom: 20 }}>
          <Card accent={C.gold}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginBottom: 10, letterSpacing: 1 }}>EXPECTANCY FORMULA</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.gold, background: C.panel, borderRadius: 8, padding: '12px 14px', lineHeight: 2, marginBottom: 10 }}>
              E = (W × avg_win) − (L × avg_loss)<br />
              <span style={{ color: C.muted, fontSize: 11 }}>W = win rate, L = 1 − W</span>
            </div>
            <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
              <div style={{ color: C.text, marginBottom: 4 }}>T2 example @ 55% win rate:</div>
              <div>E = (0.55 × 1.00) − (0.45 × 0.50)</div>
              <div>E = <span style={{ color: C.green, fontWeight: 700 }}>+$0.325 per $1 risked</span></div>
            </div>
          </Card>

          <Card accent={C.blue}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginBottom: 10, letterSpacing: 1 }}>PARTIAL EXIT IMPACT ON EV</div>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, margin: '0 0 10px' }}>
              The partial-exit mechanic creates three outcome scenarios rather than two:
            </p>
            <div style={{ fontFamily: C.fontMono, fontSize: 12, lineHeight: 2 }}>
              <div><span style={{ color: C.red }}>Full loss:</span> <span style={{ color: C.muted }}>−30% (stop hit before target)</span></div>
              <div><span style={{ color: C.gold }}>Partial win:</span> <span style={{ color: C.muted }}>+30% net (50% at target, 50% at BE)</span></div>
              <div><span style={{ color: C.green }}>Full run:</span> <span style={{ color: C.muted }}>+60%+ (trailing stop allows more)</span></div>
            </div>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: '10px 0 0' }}>
              This compresses the loss distribution and extends the win tail — improving the Sharpe ratio beyond what raw R:R implies.
            </p>
          </Card>
        </div>

        <Card accent={C.cyan}>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginBottom: 12, letterSpacing: 1 }}>WIN RATE SENSITIVITY — T2 TIER ($10,000 ACCOUNT, 10 TRADES/MONTH)</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8 }}>
            {[
              { wr: '35%', monthly: '-$108', color: C.red, note: 'Below minimum' },
              { wr: '40%', monthly: '-$30', color: C.red, note: 'Marginal' },
              { wr: '45%', monthly: '+$48', color: C.gold, note: 'Breakeven zone' },
              { wr: '55%', monthly: '+$203', color: C.green, note: 'Target range' },
              { wr: '65%', monthly: '+$358', color: C.green, note: 'Outperformance' },
            ].map(row => (
              <div key={row.wr} style={{ background: C.panel, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: C.fontMono, fontSize: 18, fontWeight: 700, color: row.color }}>{row.wr}</div>
                <div style={{ fontFamily: C.fontMono, fontSize: 13, color: row.color, marginTop: 4 }}>{row.monthly}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{row.note}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.dim, margin: '12px 0 0' }}>
            * Assumes avg win +100%, avg loss −50%, 15% position size, $1,500 deployed per trade.
          </p>
        </Card>
      </Section>

      {/* Kelly Criterion */}
      <Section title="POSITION SIZING — KELLY CRITERION" icon="⚖">
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
          The Kelly Criterion is the mathematically optimal bet size to maximise long-run compounded growth. TastyBot uses
          <strong style={{ color: C.gold }}> half-Kelly</strong> — a well-established safety adjustment that halves volatility
          while capturing ~75% of the growth rate. Position size is then further capped by the hard max to protect against ruin.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 16, marginBottom: 20 }}>
          <Card accent={C.gold}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginBottom: 10, letterSpacing: 1 }}>KELLY FORMULA</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 13, color: C.gold, background: C.panel, borderRadius: 8, padding: '12px 14px', lineHeight: 2.2, marginBottom: 10 }}>
              f* = (W × b − L) / b<br />
              <span style={{ color: C.muted, fontSize: 11 }}>b = avg_win / avg_loss</span><br />
              <span style={{ color: C.muted, fontSize: 11 }}>half-Kelly = f* / 2</span>
            </div>
            <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
              <div style={{ color: C.text, marginBottom: 4 }}>T2 @ 55% win, 100% win / 50% loss:</div>
              <div>b = 100% / 50% = <span style={{ color: C.gold }}>2.0</span></div>
              <div>f* = (0.55×2 − 0.45) / 2 = <span style={{ color: C.gold }}>32.5%</span></div>
              <div>half-Kelly = <span style={{ color: C.green, fontWeight: 700 }}>16.25%</span> → capped at <span style={{ color: C.green, fontWeight: 700 }}>15%</span></div>
            </div>
          </Card>

          <Card accent={C.blue}>
            <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginBottom: 10, letterSpacing: 1 }}>WHY NOT FULL KELLY?</div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: '0 0 12px' }}>
              Full Kelly maximises long-run growth but produces extreme drawdowns — sometimes 50–70% of equity — that are psychologically impossible to hold through. Half-Kelly cuts that in half.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'FULL KELLY', value: '32.5%', color: C.red, sub: 'Max drawdown ~50%' },
                { label: 'HALF-KELLY', value: '16.25%', color: C.gold, sub: 'Max drawdown ~25%' },
                { label: 'TASTYBOT CAP', value: '15%', color: C.green, sub: 'Hard safety cap' },
              ].map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <div style={{ width: 1, background: C.border }} />}
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: C.fontMono, fontSize: 16, color: item.color, fontWeight: 700 }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>{item.sub}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </Card>
        </div>

        <Card accent={C.purple}>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.purple, marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>PORTFOLIO HEAT LIMIT</div>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0 }}>
            Beyond per-trade sizing, the bot tracks <strong style={{ color: C.purple }}>total premium at risk</strong> across all open positions.
            If combined option cost exceeds <strong style={{ color: C.gold }}>45% of account</strong> (3 × 15%), no new entries are allowed
            even if other checks pass. This prevents simultaneous theta decay from three positions compounding into a catastrophic
            drawdown when the market moves sideways.
          </p>
        </Card>
      </Section>

      {/* Regime Filters */}
      <Section title="MARKET REGIME FILTERS" icon="🌡">
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Even perfect signals fail in the wrong market environment. Two regime filters gate every scan cycle — if either trips, the
          bot stands down entirely for that cycle rather than entering trades with degraded edge.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 16 }}>
          <Card accent={C.blue}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>📊</span>
              <div>
                <div style={{ fontFamily: C.fontMono, fontSize: 13, color: C.blue, fontWeight: 600, marginBottom: 8 }}>VIX REGIME GATE</div>
                <div style={{ fontFamily: C.fontMono, fontSize: 12, lineHeight: 2, marginBottom: 10 }}>
                  <div><span style={{ color: C.red }}>VIX &lt; 13:</span> <span style={{ color: C.muted }}>Complacency — moves too small, options don't pay</span></div>
                  <div><span style={{ color: C.green }}>VIX 13–40:</span> <span style={{ color: C.muted }}>Tradeable regime — bot is active</span></div>
                  <div><span style={{ color: C.red }}>VIX &gt; 40:</span> <span style={{ color: C.muted }}>Panic — signals break down, premiums insane</span></div>
                </div>
                <p style={{ fontSize: 12, color: C.dim, margin: 0, lineHeight: 1.6 }}>
                  Historical edge on this strategy concentrates in the 15–30 VIX band. Tails on both ends destroy returns.
                </p>
              </div>
            </div>
          </Card>

          <Card accent={C.cyan}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>📉</span>
              <div>
                <div style={{ fontFamily: C.fontMono, fontSize: 13, color: C.cyan, fontWeight: 600, marginBottom: 8 }}>IV / REALISED VOL RATIO</div>
                <div style={{ fontFamily: C.fontMono, fontSize: 12, lineHeight: 2, marginBottom: 10 }}>
                  <div><span style={{ color: C.green }}>IV / HV20 ≤ 1.30:</span> <span style={{ color: C.muted }}>Options fairly or cheaply priced → enter</span></div>
                  <div><span style={{ color: C.red }}>IV / HV20 &gt; 1.30:</span> <span style={{ color: C.muted }}>Overpaying for premium → skip ticker</span></div>
                </div>
                <p style={{ fontSize: 12, color: C.dim, margin: 0, lineHeight: 1.6 }}>
                  IVR &lt; 50 is necessary but not sufficient. This filter catches cases where IV is
                  low historically but still expensive vs actual recent volatility.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* SMC */}
      <Section title="SMC CONFLUENCE (Smart Money Concepts)" icon="💡">
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          SMC concepts are applied as supplementary confluence — they don't replace the 8-signal filter but add context that can
          strengthen trade conviction. Trades showing a liquidity sweep are given priority when multiple signals compete.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SMC_ITEMS.map(item => (
            <Card key={item.label} accent={item.color}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 13, color: item.color, fontWeight: 600, marginBottom: 6 }}>
                    {item.label}
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Exit Rules */}
      <Section title="EXIT RULES" icon="🚪">
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Exits are monitored every 5 minutes during market hours. Multiple exit conditions run in priority order — the first
          condition met triggers the exit. The partial-exit mechanic lets winning trades compound while locking in initial gains.
        </p>

        <Card accent={C.green}>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginBottom: 8, letterSpacing: 1 }}>PARTIAL EXIT MECHANIC (when target hit)</div>
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', marginBottom: 12 }}>
            {[
              { step: '1', label: 'Target hit', desc: 'Option reaches tier profit target', color: C.green },
              { step: '2', label: 'Close 50%', desc: 'Half of contracts sold at market', color: C.gold },
              { step: '3', label: 'Stop → BE', desc: 'Remaining stop moved to breakeven', color: C.cyan },
              { step: '4', label: 'Trail 12%', desc: 'Trailing stop 12% below peak', color: C.blue },
            ].map((s, i) => (
              <div key={s.step} style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
                <div style={{
                  flex: 1, background: s.color + '10', border: `1px solid ${s.color + '40'}`,
                  borderRadius: i === 0 ? '8px 0 0 8px' : i === 3 ? '0 8px 8px 0' : 0,
                  padding: '10px 12px', textAlign: 'center',
                  borderLeft: i === 0 ? undefined : 'none',
                }}>
                  <div style={{ fontFamily: C.fontMono, fontSize: 18, color: s.color, fontWeight: 700 }}>{s.step}</div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 11, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {EXITS.map(exit => (
            <div key={exit.label} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${exit.color}`,
              borderRadius: 10, padding: '14px 18px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{exit.icon}</span>
              <div>
                <div style={{ fontFamily: C.fontMono, fontSize: 13, color: exit.color, fontWeight: 600, marginBottom: 4 }}>
                  {exit.label}
                </div>
                <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>{exit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Quick Reference */}
      <Section title="QUICK REFERENCE CARD" icon="📋">
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          overflow: 'hidden', fontFamily: C.fontMono, fontSize: 12,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.panel }}>
                {['', 'T1 – Conservative', 'T2 – Momentum', 'T3 – Catalyst'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: i === 0 ? 'left' : 'center',
                    color: i === 1 ? C.blue : i === 2 ? C.gold : i === 3 ? C.cyan : C.muted,
                    fontSize: 11, fontWeight: 700, letterSpacing: 1,
                    borderBottom: `1px solid ${C.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Tickers', 'SPY, QQQ', 'NVDA META TSLA AAPL MSFT AMZN', 'T2 + earnings ≤7d'],
                ['Option type', 'Call / Put', 'Call / Put', 'ATM Straddle'],
                ['Delta', '0.40 – 0.55', '0.25 – 0.40', '~0.50 each leg'],
                ['DTE', '14 – 42 days', '14 – 42 days', 'Near earnings'],
                ['Profit target', '+60%', '+100%', '+150%'],
                ['Stop loss', '-30%', '-50%', '-70%'],
                ['Signals required', '8 / 8', '8 / 8', '8 / 8'],
              ].map(([label, ...vals]) => (
                <tr key={label} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '9px 16px', color: C.dim }}>{label}</td>
                  {vals.map((v, i) => (
                    <td key={i} style={{ padding: '9px 16px', color: C.text, textAlign: 'center' }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
