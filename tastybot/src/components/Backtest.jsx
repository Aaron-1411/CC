import React, { useState } from 'react'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useTheme } from '../ThemeContext.jsx'
import { useIsMobile } from '../useIsMobile.js'

const API = 'http://localhost:5050'

const DEFAULTS = {
  startBalance: 10000, months: 12, winRate: 55, avgWinPct: 80,
  avgLossPct: 40, tradesPerMonth: 6, maxPositionPct: 25,
  tier1Split: 50, tier2Split: 35, tier3Split: 15,
}

const fmt$ = v => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtPct = v => `${Number(v).toFixed(1)}%`

function Slider({ label, id, min, max, step = 1, value, onChange, format }) {
  const { theme: C } = useTheme()
  const display = format ? format(value) : value
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label htmlFor={id} style={{ fontFamily: C.fontSans, fontSize: 12, color: C.muted }}>{label}</label>
        <span style={{ fontFamily: C.fontMono, fontSize: 12, color: C.gold, fontWeight: 700 }}>{display}</span>
      </div>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.accent, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim }}>{format ? format(min) : min}</span>
        <span style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim }}>{format ? format(max) : max}</span>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color, sub }) {
  const { theme: C } = useTheme()
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: '14px 16px', flex: 1, minWidth: 110,
    }}>
      <div style={{
        fontFamily: C.fontSans, fontSize: 10, color: C.muted,
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6,
      }}>{label}</div>
      <div style={{ fontFamily: C.fontMono, fontSize: 18, fontWeight: 700, color: color || C.text }}>{value}</div>
      {sub && <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

export default function Backtest() {
  const { theme: C } = useTheme()
  const isMobile = useIsMobile()
  const [params, setParams] = useState(DEFAULTS)
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const set = (key) => (val) => setParams(p => ({ ...p, [key]: val }))

  const runBacktest = async () => {
    setLoading(true)
    setError(null)
    try {
      const body = {
        startBalance: params.startBalance,
        months: params.months,
        winRate: params.winRate / 100,
        avgWinPct: params.avgWinPct,
        avgLossPct: params.avgLossPct,
        tradesPerMonth: params.tradesPerMonth,
        maxPositionPct: params.maxPositionPct / 100,
        tier1Split: params.tier1Split / 100,
        tier2Split: params.tier2Split / 100,
        tier3Split: params.tier3Split / 100,
      }
      const resp = await fetch(`${API}/api/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!resp.ok) throw new Error(await resp.text())
      const data = await resp.json()
      setResults(data)
      setHistory(h => [{ ...data, params: { ...params }, timestamp: new Date().toLocaleTimeString() }, ...h].slice(0, 5))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const tierSumOk = params.tier1Split + params.tier2Split + params.tier3Split === 100

  return (
    <div style={{ display: 'flex', gap: 24, padding: '24px 0', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Controls */}
      <div style={{
        width: isMobile ? '100%' : 300, flexShrink: 0,
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: '20px 24px',
      }}>
        <div style={{ fontFamily: C.fontMono, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 20, letterSpacing: 1 }}>
          MONTE CARLO PARAMETERS
        </div>

        <Slider label="Starting Balance" id="startBalance" min={1000} max={50000} step={1000}
          value={params.startBalance} onChange={set('startBalance')} format={v => `$${v.toLocaleString()}`} />
        <Slider label="Simulation Length (months)" id="months" min={1} max={36}
          value={params.months} onChange={set('months')} format={v => `${v}mo`} />
        <Slider label="Win Rate" id="winRate" min={30} max={80}
          value={params.winRate} onChange={set('winRate')} format={v => `${v}%`} />
        <Slider label="Avg Win Size" id="avgWinPct" min={30} max={200}
          value={params.avgWinPct} onChange={set('avgWinPct')} format={v => `${v}%`} />
        <Slider label="Avg Loss Size" id="avgLossPct" min={20} max={70}
          value={params.avgLossPct} onChange={set('avgLossPct')} format={v => `${v}%`} />
        <Slider label="Trades Per Month" id="tradesPerMonth" min={2} max={20}
          value={params.tradesPerMonth} onChange={set('tradesPerMonth')} />
        <Slider label="Max Position Size" id="maxPositionPct" min={10} max={50}
          value={params.maxPositionPct} onChange={set('maxPositionPct')} format={v => `${v}%`} />

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 4 }}>
          <div style={{ fontFamily: C.fontMono, fontSize: 10, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>Tier Allocation</div>
          <Slider label="T1 Conservative %" id="tier1Split" min={0} max={100}
            value={params.tier1Split} onChange={set('tier1Split')} format={v => `${v}%`} />
          <Slider label="T2 Momentum %" id="tier2Split" min={0} max={100}
            value={params.tier2Split} onChange={set('tier2Split')} format={v => `${v}%`} />
          <Slider label="T3 Catalyst %" id="tier3Split" min={0} max={100}
            value={params.tier3Split} onChange={set('tier3Split')} format={v => `${v}%`} />
          {!tierSumOk && (
            <div style={{ fontFamily: C.fontMono, fontSize: 11, color: '#F97316', marginBottom: 12 }}>
              ⚠ Tier splits sum to {params.tier1Split + params.tier2Split + params.tier3Split}% (should be 100%)
            </div>
          )}
        </div>

        <button
          onClick={runBacktest}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 0', marginTop: 8,
            background: loading ? C.dim : C.accent,
            color: '#fff',
            border: 'none', borderRadius: 8, fontFamily: C.fontMono, fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s',
            opacity: loading ? 0.6 : 1,
            letterSpacing: 1,
          }}
        >
          {loading ? '⏳ RUNNING…' : '▸ RUN BACKTEST'}
        </button>

        {error && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: C.red + '10', border: `1px solid ${C.red}`,
            borderRadius: 8, fontFamily: C.fontMono, fontSize: 11, color: C.red,
          }}>
            {error}
          </div>
        )}

        {history.length > 1 && (
          <button
            onClick={() => setShowHistory(h => !h)}
            style={{
              width: '100%', marginTop: 12, padding: '8px 0',
              background: 'transparent', color: C.muted,
              border: `1px solid ${C.border}`, borderRadius: 8,
              fontFamily: C.fontMono, fontSize: 11, cursor: 'pointer',
            }}
          >
            {showHistory ? '▴ Hide History' : `▾ History (${history.length})`}
          </button>
        )}

        {showHistory && (
          <div style={{ marginTop: 12 }}>
            {history.map((h, i) => (
              <div
                key={i}
                onClick={() => { setResults(h); setShowHistory(false) }}
                style={{
                  padding: '8px 12px', marginBottom: 6,
                  background: C.panel, border: `1px solid ${C.border}`,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.gold }}>{h.timestamp}</div>
                <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.text }}>
                  Return: {fmtPct(h.totalReturn || 0)} · WR: {fmtPct(h.winRate ? h.winRate * 100 : 0)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Results */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!results && !loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400,
            color: C.dim, fontFamily: C.fontMono, fontSize: 13, flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 36, opacity: 0.3 }}>⊡</div>
            <div>Configure parameters and click Run Backtest</div>
          </div>
        )}

        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400,
            color: C.accent, fontFamily: C.fontMono, fontSize: 14, gap: 12,
          }}>
            <div>Running Monte Carlo simulation…</div>
          </div>
        )}

        {results && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <KpiCard label="Final Balance" value={fmt$(results.finalBalance)} color={results.totalReturn >= 0 ? C.green : C.red} />
              <KpiCard label="Total Return" value={fmtPct(results.totalReturn)} color={results.totalReturn >= 0 ? C.green : C.red} />
              <KpiCard label="Win Rate" value={fmtPct(results.winRate * 100)} color={C.cyan} />
              <KpiCard label="Max Drawdown" value={fmtPct(results.maxDrawdown)} color={C.red} />
              <KpiCard label="Total Trades" value={results.totalTrades} />
              <KpiCard label="Winners" value={results.winners} color={C.green} />
              <KpiCard label="Losers" value={results.losers} color={C.red} />
              <KpiCard label="Sharpe Est." value={Number(results.sharpe).toFixed(2)} color={results.sharpe >= 1 ? C.green : results.sharpe >= 0 ? C.gold : C.red} />
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Monthly P&L</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={results.monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fontFamily: C.fontMono, fontSize: 10, fill: C.dim }} />
                  <YAxis tick={{ fontFamily: C.fontMono, fontSize: 10, fill: C.dim }} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip
                    contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, fontFamily: C.fontMono, fontSize: 12 }}
                    formatter={v => [fmt$(v), 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {(results.monthly || []).map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? C.green : C.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Simulated Equity Curve</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={results.equityCurve} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.cyan} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.cyan} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fontFamily: C.fontMono, fontSize: 10, fill: C.dim }} />
                  <YAxis tick={{ fontFamily: C.fontMono, fontSize: 10, fill: C.dim }} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip
                    contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, fontFamily: C.fontMono, fontSize: 12 }}
                    formatter={v => [fmt$(v), 'Balance']}
                  />
                  <Area type="monotone" dataKey="balance" stroke={C.cyan} strokeWidth={2} fill="url(#cyanGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontFamily: C.fontMono, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Monthly Breakdown</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.fontMono, fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['MONTH', 'START', 'END', 'P&L', 'RETURN %'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '8px 12px', color: C.dim,
                          fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(results.monthly || []).map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}33` }}>
                        <td style={{ padding: '9px 12px', color: C.text }}>{row.month}</td>
                        <td style={{ padding: '9px 12px', color: C.muted }}>{fmt$(row.startBalance)}</td>
                        <td style={{ padding: '9px 12px', color: C.muted }}>{fmt$(row.endBalance)}</td>
                        <td style={{ padding: '9px 12px', color: row.pnl >= 0 ? C.green : C.red, fontWeight: 700 }}>{fmt$(row.pnl)}</td>
                        <td style={{ padding: '9px 12px', color: row.pnlPct >= 0 ? C.green : C.red }}>{fmtPct(row.pnlPct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
