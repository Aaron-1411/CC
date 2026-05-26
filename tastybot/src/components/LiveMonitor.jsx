import React, { useState } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { useIsMobile } from '../useIsMobile.js'

const SIGNAL_LABELS = ['EMA ALIGN', 'EMA SLOPE', 'ADX>25', 'RSI', 'MACD', 'VOL', 'IVR', 'CATALYST']
const SIGNAL_KEYS = ['sig_ema_align', 'sig_ema_slope', 'sig_adx', 'sig_rsi', 'sig_macd', 'sig_volume', 'sig_ivr', 'sig_catalyst']

function fmt(n, digits = 2) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function TierBadge({ tier }) {
  const { theme: C } = useTheme()
  const colors = { T1: C.blue, T2: C.gold, T3: C.cyan }
  const c = colors[tier] || C.muted
  return (
    <span style={{
      background: c + '22', border: `1px solid ${c}`, color: c,
      borderRadius: 4, padding: '2px 7px', fontSize: 11,
      fontFamily: C.fontMono, fontWeight: 600,
    }}>{tier}</span>
  )
}

function DirBadge({ direction }) {
  const { theme: C } = useTheme()
  const c = direction === 'BULL' ? C.green : direction === 'BEAR' ? C.red : C.muted
  return (
    <span style={{
      background: c + '22', border: `1px solid ${c}`, color: c,
      borderRadius: 4, padding: '2px 7px', fontSize: 11,
      fontFamily: C.fontMono, fontWeight: 600,
    }}>{direction === 'BULL' ? '▲ BULL' : direction === 'BEAR' ? '▼ BEAR' : direction}</span>
  )
}

function StatusBadge({ status }) {
  const { theme: C } = useTheme()
  const colors = { OPEN: C.green, CLOSED: C.muted, DRY_RUN: C.gold }
  const c = colors[status] || C.dim
  return (
    <span style={{
      background: c + '22', border: `1px solid ${c}`, color: c,
      borderRadius: 4, padding: '2px 7px', fontSize: 11, fontFamily: C.fontMono,
    }}>{status}</span>
  )
}

function SignalBadges({ trade }) {
  const { theme: C } = useTheme()
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {SIGNAL_KEYS.map((key, i) => {
        const pass = !!trade[key]
        return (
          <span key={key} style={{
            background: pass ? C.green + '20' : C.red + '18',
            border: `1px solid ${pass ? C.green : C.red}`,
            color: pass ? C.green : C.red,
            borderRadius: 3, padding: '2px 5px', fontSize: 10,
            fontFamily: C.fontMono, whiteSpace: 'nowrap',
          }}>
            {pass ? '✓' : '✗'} {SIGNAL_LABELS[i]}
          </span>
        )
      })}
    </div>
  )
}

function PnlBar({ entry, stop, current, target }) {
  const { theme: C } = useTheme()
  if (!entry || !stop || !target) return null
  const min = Math.min(stop, entry, current, target) * 0.98
  const max = Math.max(stop, entry, current, target) * 1.02
  const range = max - min
  if (range <= 0) return null
  const pct = v => ((v - min) / range) * 100

  const points = [
    { label: 'SL', value: stop, color: C.red },
    { label: 'ENTRY', value: entry, color: C.muted },
    { label: 'NOW', value: current, color: current >= entry ? C.green : C.red },
    { label: 'TGT', value: target, color: C.gold },
  ].sort((a, b) => a.value - b.value)

  return (
    <div style={{ margin: '10px 0', position: 'relative', height: 28 }}>
      <div style={{
        position: 'absolute', top: 12, left: 0, right: 0, height: 3,
        background: C.border, borderRadius: 2,
      }} />
      <div style={{
        position: 'absolute', top: 12, height: 3, borderRadius: 2,
        background: current >= entry ? C.green : C.red,
        left: `${Math.min(pct(entry), pct(current))}%`,
        width: `${Math.abs(pct(current) - pct(entry))}%`,
      }} />
      {points.map(pt => (
        <div key={pt.label} style={{
          position: 'absolute', left: `${pct(pt.value)}%`, top: 0,
          transform: 'translateX(-50%)', textAlign: 'center',
        }}>
          <div style={{ width: 2, height: 14, background: pt.color, margin: '8px auto 0' }} />
          <div style={{ fontSize: 9, color: pt.color, fontFamily: C.fontMono, whiteSpace: 'nowrap', marginTop: 1 }}>
            {pt.label}
          </div>
        </div>
      ))}
    </div>
  )
}

function PositionCard({ trade, selected, onClick }) {
  const { theme: C } = useTheme()
  const pnlPct = trade.entry_price && trade.current_price
    ? ((trade.current_price - trade.entry_price) / trade.entry_price) * 100
    : null
  const pnlDollars = trade.entry_price && trade.current_price && trade.contracts
    ? (trade.current_price - trade.entry_price) * trade.contracts * 100
    : null
  const pnlColor = pnlPct == null ? C.muted : pnlPct >= 0 ? C.green : C.red

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? C.panel : C.surface,
        border: `1px solid ${selected ? C.accent : C.border}`,
        borderRadius: 10, padding: 18, cursor: 'pointer',
        marginBottom: 12,
        boxShadow: selected && `0 0 0 1px ${C.accent}40`,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <TierBadge tier={trade.tier} />
          <DirBadge direction={trade.direction} />
          <span style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted }}>{trade.option_type}</span>
          {trade.smc_sweep && <span style={{ fontSize: 10, color: C.cyan, fontFamily: C.fontMono }}>⚡ SWEEP</span>}
        </div>
        <span style={{
          fontFamily: C.fontMono, fontSize: 13, fontWeight: 700,
          color: C.gold, background: C.gold + '14',
          border: `1px solid ${C.gold}`, borderRadius: 4, padding: '2px 8px',
        }}>{trade.signal_score || '?'}/8</span>
      </div>

      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{trade.underlying}</span>
        <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted, marginTop: 2 }}>{trade.symbol}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 24, fontWeight: 700, fontFamily: C.fontMono, color: pnlColor,
          textShadow: `0 0 16px ${pnlColor}55`,
        }}>
          {pnlPct != null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%` : '—'}
        </span>
        {pnlDollars != null && (
          <span style={{ fontSize: 14, color: pnlColor, fontFamily: C.fontMono }}>
            ({pnlDollars >= 0 ? '+' : ''}${pnlDollars.toFixed(0)})
          </span>
        )}
      </div>

      <PnlBar
        entry={trade.entry_price}
        stop={trade.stop_loss_price}
        current={trade.current_price || trade.entry_price}
        target={trade.target_exit_price}
      />
      <SignalBadges trade={trade} />
    </div>
  )
}

function TradeDetailPanel({ trade, onClose }) {
  const { theme: C } = useTheme()
  if (!trade) {
    return (
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        height: '100%', minHeight: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: C.dim }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>◉</div>
          <div style={{ fontFamily: C.fontMono, fontSize: 13 }}>Select a trade to view details</div>
        </div>
      </div>
    )
  }

  const pnlPct = trade.pnl_pct != null
    ? trade.pnl_pct
    : (trade.entry_price && trade.current_price
      ? (trade.current_price - trade.entry_price) / trade.entry_price
      : null)
  const pnlDollars = trade.pnl_dollars != null
    ? trade.pnl_dollars
    : (trade.entry_price && trade.current_price && trade.contracts
      ? (trade.current_price - trade.entry_price) * trade.contracts * 100
      : null)
  const pnlColor = pnlPct == null ? C.muted : (pnlPct * 100) >= 0 ? C.green : C.red

  const dataItems = [
    ['ENTRY', `$${fmt(trade.entry_price)}`],
    ['CONTRACTS', trade.contracts],
    ['COST', `$${fmt(trade.position_cost)}`],
    ['ACCT %', trade.account_pct != null ? `${(trade.account_pct * 100).toFixed(1)}%` : '—'],
    ['TARGET', `$${fmt(trade.target_exit_price)}`],
    ['STOP', `$${fmt(trade.stop_loss_price)}`],
    ['CURRENT', `$${fmt(trade.current_price)}`],
    ['P&L', pnlPct != null ? `${pnlPct >= 0 ? '+' : ''}${(pnlPct * 100).toFixed(1)}%` : '—'],
  ]

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: 20, position: 'sticky', top: 96,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.muted, marginBottom: 6 }}>{trade.symbol}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <TierBadge tier={trade.tier} />
            <DirBadge direction={trade.direction} />
            <StatusBadge status={trade.status} />
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: C.muted,
          cursor: 'pointer', fontSize: 20, padding: '0 4px', lineHeight: 1,
        }}>×</button>
      </div>

      {pnlPct != null && (
        <div style={{ marginBottom: 16, padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
          <div style={{
            fontSize: 30, fontWeight: 700, fontFamily: C.fontMono, color: pnlColor,
            textShadow: `0 0 20px ${pnlColor}55`,
          }}>
            {pnlPct >= 0 ? '+' : ''}{(pnlPct * 100).toFixed(2)}%
          </div>
          {pnlDollars != null && (
            <div style={{ color: pnlColor, fontFamily: C.fontMono, fontSize: 14, marginTop: 2 }}>
              {pnlDollars >= 0 ? '+' : ''}${pnlDollars.toFixed(2)}
            </div>
          )}
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px',
        marginBottom: 16, padding: '0 0 16px', borderBottom: `1px solid ${C.border}`,
      }}>
        {dataItems.map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 2, fontFamily: C.fontMono, letterSpacing: 1 }}>{label}</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 13, color: C.text, fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fontMono, letterSpacing: 1, marginBottom: 8 }}>
          ENTRY SIGNALS
        </div>
        <SignalBadges trade={trade} />
      </div>

      <div style={{ marginBottom: 14, padding: '12px', background: C.panel, borderRadius: 8 }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fontMono, letterSpacing: 1, marginBottom: 8 }}>SMC CONFLUENCE</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, color: C.dim, fontFamily: C.fontMono }}>SWEEP</div>
            <div style={{ color: trade.smc_sweep ? C.cyan : C.dim, fontFamily: C.fontMono, fontSize: 12 }}>
              {trade.smc_sweep ? '⚡ YES' : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.dim, fontFamily: C.fontMono }}>ZONE</div>
            <div style={{
              fontFamily: C.fontMono, fontSize: 12,
              color: trade.smc_zone === 'DISCOUNT' ? C.green : trade.smc_zone === 'PREMIUM' ? C.red : C.muted,
            }}>{trade.smc_zone || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.dim, fontFamily: C.fontMono }}>EQUAL LEVELS</div>
            <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.muted }}>{trade.smc_equal_levels || 'NONE'}</div>
          </div>
        </div>
      </div>

      {trade.rationale && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fontMono, letterSpacing: 1, marginBottom: 6 }}>RATIONALE</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{trade.rationale}</div>
        </div>
      )}

      {trade.bot_notes && (
        <div style={{ background: C.panel, borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fontMono, letterSpacing: 1, marginBottom: 4 }}>BOT NOTES</div>
          <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.gold }}>{trade.bot_notes}</div>
        </div>
      )}

      {trade.status === 'CLOSED' && (
        <div style={{ marginTop: 4, padding: '12px', background: C.panel, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fontMono, letterSpacing: 1, marginBottom: 8 }}>EXIT</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, color: C.dim, fontFamily: C.fontMono }}>TYPE</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.gold }}>{trade.exit_type}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.dim, fontFamily: C.fontMono }}>PRICE</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.text }}>${fmt(trade.exit_price)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.dim, fontFamily: C.fontMono }}>WHEN</div>
              <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.muted }}>
                {(trade.timestamp_exit || '').slice(0, 10)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScanFeed({ scans }) {
  const { theme: C } = useTheme()
  const isMobile = useIsMobile()
  const scoreColor = (score) => score >= 7 ? C.green : score >= 5 ? C.gold : C.red

  if (!scans || scans.length === 0) {
    return (
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: 24, textAlign: 'center', color: C.dim, fontFamily: C.fontMono, fontSize: 12,
      }}>
        No scan data yet — waiting for next cycle
      </div>
    )
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
            {['TICKER', 'SCORE', 'DIR'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1 }}>{h}</th>
            ))}
            <th className="tb-scan-col-ivr" style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1 }}>IVR</th>
            <th className="tb-scan-col-adx" style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1 }}>ADX</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1 }}>TIME</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s, i) => {
            const sc = scoreColor(s.signal_score || 0)
            return (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '7px 12px', fontFamily: C.fontMono, fontSize: 12, color: C.text, fontWeight: 600 }}>
                  {s.underlying || s.ticker || '—'}
                </td>
                <td style={{ padding: '7px 12px' }}>
                  <span style={{
                    fontFamily: C.fontMono, fontSize: 12, fontWeight: 700, color: sc,
                    background: sc + '20', border: `1px solid ${sc}`,
                    borderRadius: 4, padding: '1px 7px',
                  }}>{s.signal_score ?? '?'}/8</span>
                </td>
                <td style={{ padding: '7px 12px' }}>
                  {s.direction ? <DirBadge direction={s.direction} /> : <span style={{ color: C.dim, fontFamily: C.fontMono, fontSize: 11 }}>—</span>}
                </td>
                <td className="tb-scan-col-ivr" style={{ padding: '7px 12px', fontFamily: C.fontMono, fontSize: 12, color: C.muted }}>
                  {s.ivr != null ? s.ivr.toFixed(0) : '—'}
                </td>
                <td className="tb-scan-col-adx" style={{ padding: '7px 12px', fontFamily: C.fontMono, fontSize: 12, color: C.muted }}>
                  {s.adx != null ? s.adx.toFixed(1) : '—'}
                </td>
                <td style={{ padding: '7px 12px', fontFamily: C.fontMono, fontSize: 11, color: C.dim }}>
                  {s.timestamp ? s.timestamp.slice(11, 16) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KillSwitchBanner({ apiBase, onResolved }) {
  const { theme: C } = useTheme()
  const [resolving, setResolving] = useState(false)

  const handleResolve = async () => {
    setResolving(true)
    try {
      await fetch(`${apiBase}/api/kill-switch/resolve`, { method: 'POST' })
      onResolved()
    } catch {
    } finally {
      setResolving(false)
    }
  }

  return (
    <div style={{
      background: C.red + '10', border: `1px solid ${C.red}`,
      borderRadius: 10, padding: '14px 20px', marginBottom: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>🚨</span>
        <div>
          <div style={{ fontFamily: C.fontMono, fontSize: 13, color: C.red, fontWeight: 700, marginBottom: 3 }}>
            KILL SWITCH ACTIVE
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            Weekly loss limit breached — all new entries are blocked.
          </div>
        </div>
      </div>
      <button
        onClick={handleResolve}
        disabled={resolving}
        style={{
          background: resolving ? C.dim : C.red,
          border: 'none', borderRadius: 6,
          color: '#fff', fontFamily: C.fontMono, fontSize: 12, fontWeight: 600,
          padding: '8px 18px', cursor: resolving ? 'not-allowed' : 'pointer',
          flexShrink: 0, transition: 'background 0.15s',
        }}
      >
        {resolving ? 'Resolving…' : 'Resolve & Resume'}
      </button>
    </div>
  )
}

function SectionLabel({ children, count, countColor }) {
  const { theme: C } = useTheme()
  return (
    <div style={{
      fontFamily: C.fontMono, fontSize: 11, color: C.muted, letterSpacing: 2,
      marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {children}
      {count != null && (
        <span style={{
          background: (countColor || C.dim) + '22',
          border: `1px solid ${countColor || C.dim}`,
          color: countColor || C.dim,
          borderRadius: 10, padding: '1px 8px', fontSize: 11, fontFamily: C.fontMono,
        }}>{count}</span>
      )}
    </div>
  )
}

export default function LiveMonitor({ openTrades, closedTrades, scans, status, apiBase }) {
  const { theme: C } = useTheme()
  const isMobile = useIsMobile()
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [killSwitchDismissed, setKillSwitchDismissed] = useState(false)

  const recent10 = closedTrades.slice(0, 10)
  const showKillSwitch = status?.kill_switch && !killSwitchDismissed


  const mainContent = (
    <>
      {showKillSwitch && (
        <KillSwitchBanner apiBase={apiBase} onResolved={() => setKillSwitchDismissed(true)} />
      )}

      {/* Open positions */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel
          count={`${openTrades.length}/3 MAX`}
          countColor={openTrades.length > 0 ? C.green : undefined}
        >
          OPEN POSITIONS
        </SectionLabel>

        {openTrades.length === 0 ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: 36, textAlign: 'center', color: C.dim, fontFamily: C.fontMono, fontSize: 13,
          }}>
            No open positions
          </div>
        ) : (
          openTrades.map(t => (
            <React.Fragment key={t.id}>
              <PositionCard
                trade={t}
                selected={selectedTrade?.id === t.id}
                onClick={() => setSelectedTrade(selectedTrade?.id === t.id ? null : t)}
              />
              {/* Inline detail panel on mobile */}
              {isMobile && selectedTrade?.id === t.id && (
                <div style={{ marginBottom: 12 }}>
                  <TradeDetailPanel trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Recently closed */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel>RECENTLY CLOSED</SectionLabel>
        {recent10.length === 0 ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: 24, textAlign: 'center', color: C.dim, fontFamily: C.fontMono, fontSize: 13,
          }}>No closed trades yet</div>
        ) : (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ background: C.panel, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>SYMBOL</th>
                  <th className="tb-closed-col-tier" style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>TIER</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>DIR</th>
                  <th className="tb-closed-col-entry" style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>ENTRY</th>
                  <th className="tb-closed-col-exitprice" style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>EXIT $</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>P&L%</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>EXIT</th>
                  <th className="tb-closed-col-date" style={{ padding: '8px 12px', textAlign: 'left', fontFamily: C.fontMono, fontSize: 10, color: C.dim, fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>DATE</th>
                </tr>
              </thead>
              <tbody>
                {recent10.map(t => {
                  const pnl = t.pnl_pct != null ? t.pnl_pct * 100 : null
                  const pnlColor = pnl == null ? C.muted : pnl >= 0 ? C.green : C.red
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTrade(selectedTrade?.id === t.id ? null : t)}
                      style={{
                        borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
                        background: selectedTrade?.id === t.id ? C.panel : 'transparent',
                      }}
                    >
                      <td style={{ padding: '8px 12px', fontFamily: C.fontMono, fontSize: 12, color: C.text, fontWeight: 600 }}>{t.underlying}</td>
                      <td className="tb-closed-col-tier" style={{ padding: '8px 12px' }}><TierBadge tier={t.tier} /></td>
                      <td style={{ padding: '8px 12px' }}><DirBadge direction={t.direction} /></td>
                      <td className="tb-closed-col-entry" style={{ padding: '8px 12px', fontFamily: C.fontMono, fontSize: 12, color: C.muted }}>${fmt(t.entry_price)}</td>
                      <td className="tb-closed-col-exitprice" style={{ padding: '8px 12px', fontFamily: C.fontMono, fontSize: 12, color: C.muted }}>${fmt(t.exit_price)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: C.fontMono, fontSize: 12, color: pnlColor, fontWeight: 600 }}>
                        {pnl != null ? `${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: C.fontMono, fontSize: 11, color: C.gold }}>
                        {(t.exit_type || '—').replace('_', ' ')}
                      </td>
                      <td className="tb-closed-col-date" style={{ padding: '8px 12px', fontFamily: C.fontMono, fontSize: 11, color: C.dim }}>
                        {(t.timestamp_exit || '').slice(0, 10)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Inline detail for closed trades on mobile */}
        {isMobile && selectedTrade && selectedTrade.status === 'CLOSED' && (
          <div style={{ marginTop: 12 }}>
            <TradeDetailPanel trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
          </div>
        )}
      </div>

      {/* Scan Feed */}
      <div>
        <SectionLabel count="last 20" countColor={C.accent}>SCAN FEED</SectionLabel>
        <ScanFeed scans={scans} />
      </div>
    </>
  )

  if (isMobile) {
    return <div>{mainContent}</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' }}>
      <div>{mainContent}</div>
      <TradeDetailPanel trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
    </div>
  )
}
