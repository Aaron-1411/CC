import React, { useState, useMemo } from 'react'
import { useTheme } from '../ThemeContext.jsx'

const SIGNAL_LABELS = ['EMA ALIGN', 'EMA SLOPE', 'ADX>25', 'RSI', 'MACD', 'VOL', 'IVR', 'CATALYST']
const SIGNAL_KEYS = ['sig_ema_align', 'sig_ema_slope', 'sig_adx', 'sig_rsi', 'sig_macd', 'sig_volume', 'sig_ivr', 'sig_catalyst']

const EXIT_COLORS_DARK = {
  TARGET_HIT_PARTIAL: '#10B981',
  TRAILING_STOP: '#F59E0B',
  STOP_LOSS: '#F43F5E',
  TIME_STOP: '#94A3B8',
  EMA_EXIT: '#3B82F6',
  ADX_EXIT: '#A78BFA',
  EOD_CLOSE: '#3D5278',
}

const FILTER_OPTIONS = [
  { label: 'ALL', filter: () => true },
  { label: 'T1', filter: t => t.tier === 'T1' },
  { label: 'T2', filter: t => t.tier === 'T2' },
  { label: 'T3', filter: t => t.tier === 'T3' },
  { label: 'OPEN', filter: t => t.status === 'OPEN' },
  { label: 'CLOSED', filter: t => t.status === 'CLOSED' },
  { label: 'TARGET_HIT', filter: t => t.exit_type === 'TARGET_HIT_PARTIAL' },
  { label: 'STOP_LOSS', filter: t => t.exit_type === 'STOP_LOSS' },
  { label: 'TIME_STOP', filter: t => t.exit_type === 'TIME_STOP' },
]

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function TierBadge({ tier }) {
  const { theme: C } = useTheme()
  const colors = { T1: C.blue, T2: C.gold, T3: C.cyan }
  const c = colors[tier] || C.muted
  return (
    <span style={{
      background: c + '22', border: `1px solid ${c}`, color: c,
      borderRadius: 4, padding: '1px 6px', fontSize: 11, fontFamily: C.fontMono, fontWeight: 600,
    }}>{tier}</span>
  )
}

function DirBadge({ direction }) {
  const { theme: C } = useTheme()
  const c = direction === 'BULL' ? C.green : direction === 'BEAR' ? C.red : C.muted
  return (
    <span style={{
      background: c + '22', border: `1px solid ${c}`, color: c,
      borderRadius: 4, padding: '1px 6px', fontSize: 11, fontFamily: C.fontMono, fontWeight: 600,
    }}>{direction === 'BULL' ? '▲ BULL' : direction === 'BEAR' ? '▼ BEAR' : direction}</span>
  )
}

function ExitBadge({ exitType }) {
  const { theme: C } = useTheme()
  if (!exitType) return null
  const c = EXIT_COLORS_DARK[exitType] || C.muted
  return (
    <span style={{
      background: c + '22', border: `1px solid ${c}`, color: c,
      borderRadius: 4, padding: '1px 6px', fontSize: 11, fontFamily: C.fontMono,
    }}>{exitType}</span>
  )
}

function StatusBadge({ status }) {
  const { theme: C } = useTheme()
  const c = status === 'OPEN' ? C.green : status === 'DRY_RUN' ? C.gold : C.dim
  return (
    <span style={{
      background: c + '22', border: `1px solid ${c}`, color: c,
      borderRadius: 4, padding: '1px 6px', fontSize: 11, fontFamily: C.fontMono,
    }}>{status}</span>
  )
}

function SignalBadges({ trade, small }) {
  const { theme: C } = useTheme()
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {SIGNAL_KEYS.map((key, i) => {
        const pass = !!trade[key]
        return (
          <span key={key} style={{
            background: pass ? C.green + '20' : C.red + '18',
            border: `1px solid ${pass ? C.green : C.red}`,
            color: pass ? C.green : C.red,
            borderRadius: 3, padding: '1px 4px', fontSize: small ? 9 : 10,
            fontFamily: C.fontMono, whiteSpace: 'nowrap',
          }}>
            {pass ? '✓' : '✗'} {SIGNAL_LABELS[i]}
          </span>
        )
      })}
    </div>
  )
}

function TradeCard({ trade }) {
  const { theme: C } = useTheme()
  const [expanded, setExpanded] = useState(false)

  const pnlPct = trade.pnl_pct != null
    ? trade.pnl_pct * 100
    : (trade.entry_price && trade.current_price
      ? ((trade.current_price - trade.entry_price) / trade.entry_price) * 100
      : null)
  const pnlDollars = trade.pnl_dollars != null ? trade.pnl_dollars
    : (trade.entry_price && trade.current_price && trade.contracts
      ? (trade.current_price - trade.entry_price) * trade.contracts * 100
      : null)
  const pnlColor = pnlPct == null ? C.muted : pnlPct >= 0 ? C.green : C.red

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      marginBottom: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.dim }}>#{trade.id}</span>
            <span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.dim }}>
              {(trade.timestamp_entry || '').slice(0, 10)}
            </span>
            <TierBadge tier={trade.tier} />
            <DirBadge direction={trade.direction} />
            <span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted }}>{trade.option_type}</span>
            <StatusBadge status={trade.status} />
            {trade.exit_type && <ExitBadge exitType={trade.exit_type} />}
            {trade.smc_sweep && <span style={{ fontSize: 10, color: C.cyan, fontFamily: C.fontMono }}>⚡ SWEEP</span>}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: C.fontMono, color: pnlColor }}>
                {pnlPct != null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%` : '—'}
              </div>
              {pnlDollars != null && (
                <div style={{ fontSize: 12, color: pnlColor, fontFamily: C.fontMono }}>
                  {pnlDollars >= 0 ? '+' : ''}${pnlDollars.toFixed(0)}
                </div>
              )}
            </div>
            <div style={{
              fontFamily: C.fontMono, fontSize: 13, fontWeight: 700, color: C.gold,
              background: C.gold + '14', border: `1px solid ${C.gold}`,
              borderRadius: 4, padding: '4px 8px',
            }}>{trade.signal_score || '?'}/8</div>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{trade.underlying}</span>
          <span style={{ fontFamily: C.fontMono, fontSize: 12, color: C.muted, marginLeft: 10 }}>
            @ ${fmt(trade.entry_price)} × {trade.contracts} | exp {trade.expiry}
          </span>
        </div>

        <SignalBadges trade={trade} small />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', background: C.panel, border: 'none',
          borderTop: `1px solid ${C.border}`, color: C.dim,
          fontFamily: C.fontMono, fontSize: 11, padding: '7px',
          cursor: 'pointer', textAlign: 'center', letterSpacing: 1,
        }}
      >
        {expanded ? '▲ HIDE DETAILS' : '▼ SHOW DETAILS'}
      </button>

      {expanded && (
        <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}`, background: C.panel }}>
          {trade.rationale && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, letterSpacing: 1, marginBottom: 6 }}>RATIONALE</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{trade.rationale}</div>
            </div>
          )}
          {trade.bot_notes && (
            <div>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, letterSpacing: 1, marginBottom: 4 }}>BOT NOTES</div>
              <div style={{
                fontFamily: C.fontMono, fontSize: 12, color: C.gold,
                background: C.surface, borderRadius: 6, padding: '8px 10px', whiteSpace: 'pre-wrap',
              }}>{trade.bot_notes}</div>
            </div>
          )}
          {(trade.smc_zone || trade.smc_sweep || trade.smc_equal_levels) && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, letterSpacing: 1, marginBottom: 6 }}>SMC</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: C.fontMono, fontSize: 11, color: trade.smc_sweep ? C.cyan : C.dim }}>
                  SWEEP: {trade.smc_sweep ? 'YES' : 'NO'}
                </span>
                <span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted }}>
                  ZONE: {trade.smc_zone || '—'}
                </span>
                <span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted }}>
                  EQ LEVELS: {trade.smc_equal_levels || 'NONE'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Journal({ trades }) {
  const { theme: C } = useTheme()
  const [activeFilter, setActiveFilter] = useState(0)

  const filtered = useMemo(() => {
    return trades.filter(FILTER_OPTIONS[activeFilter].filter)
  }, [trades, activeFilter])

  return (
    <div>
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap',
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: 8,
      }}>
        {FILTER_OPTIONS.map((opt, i) => (
          <button
            key={opt.label}
            onClick={() => setActiveFilter(i)}
            style={{
              background: activeFilter === i ? C.accent + '20' : 'transparent',
              border: `1px solid ${activeFilter === i ? C.accent : C.border}`,
              color: activeFilter === i ? C.accent : C.muted,
              borderRadius: 6, padding: '5px 12px',
              fontFamily: C.fontMono, fontSize: 11, fontWeight: activeFilter === i ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s', letterSpacing: 1,
            }}
          >
            {opt.label}
          </button>
        ))}
        <span style={{
          marginLeft: 'auto', fontFamily: C.fontMono, fontSize: 11, color: C.dim,
          alignSelf: 'center', paddingRight: 4,
        }}>
          {filtered.length} trades
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: 48, textAlign: 'center', color: C.dim, fontFamily: C.fontMono, fontSize: 14,
        }}>
          No trades match this filter
        </div>
      ) : (
        filtered.map((t, i) => <TradeCard key={t.id} trade={t} index={i} />)
      )}
    </div>
  )
}
