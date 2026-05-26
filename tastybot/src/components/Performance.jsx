import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useTheme } from '../ThemeContext.jsx'
import { useIsMobile } from '../useIsMobile.js'

const API = 'http://localhost:5050'

const EXIT_COLORS = {
  TARGET_HIT: '#10B981', TARGET_HIT_PARTIAL: '#34D399', TRAILING_STOP: '#06B6D4',
  STOP_LOSS: '#F43F5E', TIME_STOP: '#F97316', EMA_EXIT: '#A78BFA', ADX_EXIT: '#FB923C',
  MANUAL: '#94A3B8',
}

const fmt$ = v => v == null ? '—' : `$${v >= 0 ? '+' : ''}${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtPct = v => v == null ? '—' : `${(v * 100).toFixed(1)}%`

function KpiCard({ label, value, color, sub }) {
  const { theme: C } = useTheme()
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: '16px 20px', flex: 1, minWidth: 120,
    }}>
      <div style={{
        fontFamily: C.fontSans, fontSize: 10, color: C.muted,
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10,
      }}>{label}</div>
      <div style={{ fontFamily: C.fontMono, fontSize: 22, fontWeight: 700, color: color || C.text }}>{value}</div>
      {sub && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function EquityTooltip({ active, payload }) {
  const { theme: C } = useTheme()
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '10px 14px', fontFamily: C.fontMono, fontSize: 12,
    }}>
      <div style={{ color: C.muted, marginBottom: 4 }}>{d.date}</div>
      <div style={{ color: C.gold }}>Balance: ${Number(d.balance).toLocaleString()}</div>
      {d.pnl != null && <div style={{ color: d.pnl >= 0 ? C.green : C.red }}>Trade P&L: {fmt$(d.pnl)}</div>}
      {d.ticker && <div style={{ color: C.muted }}>Ticker: {d.ticker}</div>}
    </div>
  )
}

export default function Performance() {
  const { theme: C } = useTheme()
  const isMobile = useIsMobile()
  const [perf, setPerf] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)

  const TIER_COLORS = { T1: C.blue, T2: C.gold, T3: C.cyan }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/performance`).then(r => r.json()),
      fetch(`${API}/api/account/snapshots?days=30`).then(r => r.json()),
    ])
      .then(([p, s]) => { setPerf(p); setSnapshots(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ color: C.muted, fontFamily: C.fontMono, padding: 40, textAlign: 'center' }}>Loading performance data…</div>
  }
  if (!perf) {
    return <div style={{ color: C.muted, fontFamily: C.fontMono, padding: 40, textAlign: 'center' }}>No performance data available.</div>
  }

  const expectancy = perf.expectancy != null ? Number(perf.expectancy).toFixed(3) : '—'
  const startBalance = perf.equity_curve?.length ? perf.equity_curve[0].balance : 10000
  const byTierArr = Object.entries(perf.by_tier || {}).map(([tier, data]) => ({ tier, ...data }))
  const byExitArr = Object.entries(perf.by_exit_type || {}).map(([et, data]) => ({ exit_type: et, ...data }))

  const snapshotData = snapshots.map(s => ({
    date: (s.timestamp || '').slice(0, 10),
    value: s.net_liquidating_value,
  }))

  return (
    <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total P&L" value={fmt$(perf.total_pnl)} color={perf.total_pnl >= 0 ? C.green : C.red} />
        <KpiCard label="Win Rate" value={fmtPct(perf.win_rate)} color={C.cyan} />
        <KpiCard label="Closed Trades" value={perf.total_trades ?? 0} />
        <KpiCard label="Avg Win %" value={fmtPct(perf.avg_win_pct)} color={C.green} />
        <KpiCard label="Avg Loss %" value={fmtPct(perf.avg_loss_pct)} color={C.red} />
        <KpiCard label="Expectancy" value={expectancy} color={perf.expectancy > 0 ? C.green : C.red} />
      </div>

      {/* Equity Curve */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' }}>
        <div style={{
          fontFamily: C.fontMono, fontSize: 11, color: C.muted,
          textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
        }}>Equity Curve</div>
        {perf.equity_curve?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={perf.equity_curve} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.gold} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.gold} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fontFamily: C.fontMono, fontSize: 10, fill: C.dim }} />
              <YAxis tick={{ fontFamily: C.fontMono, fontSize: 10, fill: C.dim }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<EquityTooltip />} />
              <ReferenceLine y={startBalance} stroke={C.muted} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="balance" stroke={C.gold} strokeWidth={2} fill="url(#goldGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: C.dim, fontFamily: C.fontMono, fontSize: 12, textAlign: 'center', padding: 40 }}>No closed trades yet.</div>
        )}
      </div>

      {/* By Tier + By Exit */}
      <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Performance by Tier</div>
          {byTierArr.length === 0
            ? <div style={{ color: C.dim, fontFamily: C.fontMono, fontSize: 12 }}>No data.</div>
            : byTierArr.map(({ tier, count, pnl, win_rate }) => (
              <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
                <div style={{
                  background: `${TIER_COLORS[tier] || C.muted}22`, color: TIER_COLORS[tier] || C.muted,
                  border: `1px solid ${TIER_COLORS[tier] || C.muted}`, borderRadius: 4,
                  padding: '2px 8px', fontFamily: C.fontMono, fontSize: 11, fontWeight: 700,
                  minWidth: 30, textAlign: 'center',
                }}>{tier}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: C.fontMono, fontSize: 12, color: C.text }}>{count} trade{count !== 1 ? 's' : ''}</div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted }}>Win Rate: {fmtPct(win_rate)}</div>
                </div>
                <div style={{ fontFamily: C.fontMono, fontSize: 14, fontWeight: 700, color: pnl >= 0 ? C.green : C.red }}>{fmt$(pnl)}</div>
              </div>
            ))
          }
        </div>

        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Exit Type Breakdown</div>
          {byExitArr.length === 0
            ? <div style={{ color: C.dim, fontFamily: C.fontMono, fontSize: 12 }}>No data.</div>
            : byExitArr.map(({ exit_type, count, pnl }) => (
              <div key={exit_type} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: C.fontMono, fontSize: 12, color: EXIT_COLORS[exit_type] || C.muted, fontWeight: 600 }}>{exit_type}</div>
                  <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.dim }}>{count} trade{count !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontFamily: C.fontMono, fontSize: 14, fontWeight: 700, color: pnl >= 0 ? C.green : C.red }}>{fmt$(pnl)}</div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Account Value History */}
      {snapshotData.length > 1 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Account Value (30 days)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={snapshotData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fontFamily: C.fontMono, fontSize: 10, fill: C.dim }} />
              <YAxis tick={{ fontFamily: C.fontMono, fontSize: 10, fill: C.dim }} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, fontFamily: C.fontMono, fontSize: 12 }}
                formatter={v => [`$${Number(v).toLocaleString()}`, 'Net Liq']}
              />
              <Line type="monotone" dataKey="value" stroke={C.cyan} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
