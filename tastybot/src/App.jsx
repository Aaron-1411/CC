import React, { useState, useEffect, useCallback } from 'react'
import { ThemeProvider, useTheme } from './ThemeContext.jsx'
import { useIsMobile } from './useIsMobile.js'
import LiveMonitor from './components/LiveMonitor.jsx'
import Journal from './components/Journal.jsx'
import Performance from './components/Performance.jsx'
import Backtest from './components/Backtest.jsx'
import Strategy from './components/Strategy.jsx'
import Guide from './components/Guide.jsx'

const API_BASE = 'http://localhost:5050'

const TABS = [
  { id: 'monitor', label: '◉ LIVE MONITOR' },
  { id: 'journal', label: '≡ JOURNAL' },
  { id: 'performance', label: '↗ PERFORMANCE' },
  { id: 'backtest', label: '⊡ BACKTEST' },
  { id: 'strategy', label: '⊞ STRATEGY' },
  { id: 'guide', label: '? GUIDE' },
]

function AppInner() {
  const { theme: C, dark, toggle } = useTheme()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('monitor')
  const [status, setStatus] = useState(null)
  const [trades, setTrades] = useState([])
  const [performance, setPerformance] = useState(null)
  const [scans, setScans] = useState([])
  const [offline, setOffline] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setStatus(data)
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }, [])

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/trades?limit=100`)
      if (!res.ok) throw new Error()
      setTrades(await res.json())
    } catch {}
  }, [])

  const fetchPerformance = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/performance`)
      if (!res.ok) throw new Error()
      setPerformance(await res.json())
    } catch {}
  }, [])

  const fetchScans = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scans?limit=20`)
      if (!res.ok) throw new Error()
      setScans(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchTrades()
    fetchPerformance()
    fetchScans()
    const si = setInterval(fetchStatus, 10000)
    const ti = setInterval(fetchTrades, 30000)
    const pi = setInterval(fetchPerformance, 60000)
    const sci = setInterval(fetchScans, 30000)
    return () => { clearInterval(si); clearInterval(ti); clearInterval(pi); clearInterval(sci) }
  }, [fetchStatus, fetchTrades, fetchPerformance, fetchScans])

  const openTrades = trades.filter(t => t.status === 'OPEN')
  const closedTrades = trades.filter(t => t.status === 'CLOSED')

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      fontFamily: C.fontSans,
      transition: 'background 0.25s ease, color 0.25s ease',
      color: C.text,
    }}>
      {/* Global responsive styles */}
      <style>{`
        * { box-sizing: border-box; }
        .tastybot-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .tastybot-tabs::-webkit-scrollbar { display: none; }
        .tastybot-tabs button { flex-shrink: 0; white-space: nowrap; }
        @media (max-width: 639px) {
          .tb-subtitle { display: none !important; }
          .tb-netliq { display: none !important; }
          .tb-toggle-label { display: none !important; }
          .tb-scan-col-ivr, .tb-scan-col-adx { display: none !important; }
          .tb-closed-col-tier, .tb-closed-col-entry,
          .tb-closed-col-exitprice, .tb-closed-col-date { display: none !important; }
          .tb-grid-2col { grid-template-columns: 1fr !important; }
          .tb-flex-row { flex-direction: column !important; }
          .tb-main-pad { padding: 16px !important; }
          .tb-header-h { height: 52px !important; }
          .tb-logo { font-size: 16px !important; letter-spacing: 2px !important; }
          .tb-header-pad { padding: 0 16px !important; }
          .tb-tab-btn { padding: 10px 14px !important; font-size: 10px !important; }
          .tb-sensitivity-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .tb-pnl-large { font-size: 20px !important; }
          .tb-card-pad { padding: 14px !important; }
        }
      `}</style>

      {/* Offline banner */}
      {offline && (
        <div style={{
          background: C.red, color: '#fff', textAlign: 'center',
          padding: '8px', fontSize: '13px', fontFamily: C.fontMono,
        }}>
          ⚠ API OFFLINE — port 5050 unreachable
        </div>
      )}

      {/* Header */}
      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? '0 16px' : '0 24px',
        boxShadow: dark ? '0 1px 24px rgba(59,130,246,0.07)' : '0 1px 12px rgba(0,0,0,0.06)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="tb-header-h" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          maxWidth: 1400, margin: '0 auto', height: 68,
          gap: 12,
        }}>
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              fontFamily: C.fontMono, fontWeight: 700, fontSize: isMobile ? 16 : 20,
              color: C.accent, letterSpacing: isMobile ? 2 : 4,
              textShadow: dark ? `0 0 20px ${C.accent}55` : 'none',
              whiteSpace: 'nowrap',
            }}>
              TASTYBOT
            </div>
            <div className="tb-subtitle" style={{ fontSize: 10, color: C.dim, letterSpacing: 3, marginTop: 2, textTransform: 'uppercase' }}>
              Strategy Command Centre
            </div>
          </div>

          {/* Right side: status + toggle */}
          <div style={{ display: 'flex', gap: isMobile ? 10 : 20, alignItems: 'center', minWidth: 0 }}>
            {status && (
              <>
                {/* Mode badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: status.trading_mode === 'live' ? C.red : C.green,
                    boxShadow: `0 0 8px ${status.trading_mode === 'live' ? C.red : C.green}`,
                  }} />
                  <span style={{
                    fontFamily: C.fontMono, fontSize: isMobile ? 10 : 11,
                    color: status.trading_mode === 'live' ? C.red : C.green,
                    fontWeight: 700, letterSpacing: 1,
                  }}>
                    {(status.trading_mode || 'paper').toUpperCase()}
                  </span>
                </div>

                {/* Kill switch — icon only on mobile */}
                {status.kill_switch && (
                  <div style={{
                    background: C.red + '18', border: `1px solid ${C.red}`,
                    borderRadius: 4, padding: isMobile ? '3px 6px' : '3px 8px',
                    fontFamily: C.fontMono, fontSize: isMobile ? 10 : 11, color: C.red, fontWeight: 700,
                  }}>
                    {isMobile ? '🚨' : '🚨 KILL SWITCH'}
                  </div>
                )}

                {/* Daily P&L — always visible */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: C.fontMono, fontSize: isMobile ? 13 : 14, fontWeight: 700,
                    color: (status.daily_pnl || 0) >= 0 ? C.green : C.red,
                  }}>
                    {(status.daily_pnl || 0) >= 0 ? '+' : ''}${(status.daily_pnl || 0).toFixed(2)}
                  </div>
                  {!isMobile && <div style={{ fontSize: 10, color: C.dim, letterSpacing: 1 }}>DAILY P&L</div>}
                </div>

                {/* Account value — hidden on mobile via CSS */}
                {status.account_value != null && (
                  <div className="tb-netliq" style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: C.fontMono, fontSize: 14, color: C.text, fontWeight: 700 }}>
                      ${(status.account_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 10, color: C.dim, letterSpacing: 1 }}>NET LIQ</div>
                  </div>
                )}
              </>
            )}
            {!status && !offline && (
              <div style={{ color: C.dim, fontFamily: C.fontMono, fontSize: 11 }}>…</div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: dark ? C.panel : C.accent + '15',
                border: `1px solid ${C.border}`,
                borderRadius: 20, padding: isMobile ? '6px 10px' : '7px 14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: C.fontMono, fontSize: 11, color: C.muted,
                letterSpacing: 1, transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 13 }}>{dark ? '☀' : '◑'}</span>
              <span className="tb-toggle-label">{dark ? 'LIGHT' : 'DARK'}</span>
            </button>
          </div>
        </div>

        {/* Tab bar — horizontally scrollable on mobile */}
        <div
          className="tastybot-tabs"
          style={{
            display: 'flex', gap: 0,
            maxWidth: 1400, margin: '0 auto',
            borderTop: `1px solid ${C.border}`,
          }}
        >
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="tb-tab-btn"
                style={{
                  background: 'none', border: 'none',
                  borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent',
                  color: active ? C.accent : C.muted,
                  fontFamily: C.fontMono, fontSize: 11, fontWeight: active ? 600 : 400,
                  letterSpacing: 1, padding: '11px 20px',
                  cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
                  whiteSpace: 'nowrap',
                  textShadow: active && dark ? `0 0 12px ${C.accent}88` : 'none',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* Content */}
      <main className="tb-main-pad" style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>
        {activeTab === 'monitor' && (
          <LiveMonitor openTrades={openTrades} closedTrades={closedTrades} scans={scans} status={status} apiBase={API_BASE} />
        )}
        {activeTab === 'journal' && <Journal trades={trades} />}
        {activeTab === 'performance' && <Performance performance={performance} apiBase={API_BASE} />}
        {activeTab === 'backtest' && <Backtest apiBase={API_BASE} />}
        {activeTab === 'strategy' && <Strategy />}
        {activeTab === 'guide' && <Guide />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
