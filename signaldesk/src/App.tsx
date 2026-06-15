import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JournalStats, SignalWithTrades, UserTrade } from './types/contract';
import { api, isDemoMode } from './lib/api';
import SignalCard from './components/SignalCard';
import SignalChart from './components/SignalChart';
import TradeForm from './components/TradeForm';
import TradeResult from './components/TradeResult';
import JournalDashboard from './components/JournalDashboard';
import PasteModal from './components/PasteModal';
import AccessKeyModal from './components/AccessKeyModal';
import Footer from './components/Footer';

export default function App() {
  const [signals, setSignals] = useState<SignalWithTrades[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const [showPaste, setShowPaste] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [formFor, setFormFor] = useState<{ signalId: string; trade?: UserTrade } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, journal] = await Promise.all([api.listSignals(), api.getJournal()]);
      setSignals(list);
      setStats(journal);
      setDemo(isDemoMode());
      setSelectedId((cur) => cur ?? list[0]?.signal.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selected = useMemo(
    () => signals.find((s) => s.signal.id === selectedId) ?? null,
    [signals, selectedId],
  );

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const r = await api.sync();
      setSyncMsg(
        r.source === 'discord'
          ? `Synced: ${r.added} new, ${r.skipped} known`
          : r.source === 'demo'
            ? 'Demo mode — nothing to sync'
            : r.error || 'Sync disabled (no Discord config)',
      );
      await refresh();
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  async function handleParse(content: string) {
    const item = await api.parsePasted(content);
    await refresh();
    setSelectedId(item.signal.id);
  }

  async function handleSaveTrade(trade: UserTrade) {
    await api.saveTrade(trade);
    setFormFor(null);
    await refresh();
  }

  async function handleDeleteTrade(trade: UserTrade) {
    await api.deleteTrade(trade.id, trade.signalId);
    await refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-edge bg-ink/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-semibold text-accent">SignalDesk</span>
            {demo && <span className="pill bg-flag/15 text-flag">demo data</span>}
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <button className="btn px-3 py-1.5 min-h-0 text-xs" onClick={() => setShowPaste(true)}>
              paste
            </button>
            <button
              className="btn btn-accent px-3 py-1.5 min-h-0 text-xs"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'syncing…' : 'sync'}
            </button>
            <button className="btn px-3 py-1.5 min-h-0 text-xs" onClick={() => setShowKey(true)}>
              key
            </button>
          </div>
        </div>
        {syncMsg && (
          <div className="max-w-6xl mx-auto px-4 pb-2 text-[11px] text-muted">{syncMsg}</div>
        )}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 space-y-4">
        <JournalDashboard stats={stats} loading={loading} />

        {error && <div className="panel p-3 text-short text-sm">{error}</div>}

        {!loading && signals.length === 0 && !error && (
          <div className="panel p-6 text-center text-muted text-sm">
            No signals yet. Hit <span className="text-white">sync</span> to pull from Discord, or{' '}
            <span className="text-white">paste</span> a message to log one manually.
          </div>
        )}

        <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-4 items-start">
          <div className="space-y-2 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1">
            {signals.map((item) => (
              <SignalCard
                key={item.signal.id}
                item={item}
                selected={item.signal.id === selectedId}
                onSelect={() => setSelectedId(item.signal.id)}
              />
            ))}
          </div>

          <div className="space-y-4">
            {selected ? (
              <>
                <SignalChart signal={selected.signal} />

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    Your trades
                    {selected.trades.length > 0 && (
                      <span className="text-muted font-normal"> · {selected.trades.length}</span>
                    )}
                  </span>
                  {!formFor && (
                    <button
                      className="btn btn-accent px-3 py-1.5 min-h-0 text-xs"
                      onClick={() => setFormFor({ signalId: selected.signal.id })}
                    >
                      log trade
                    </button>
                  )}
                </div>

                {formFor?.signalId === selected.signal.id && (
                  <TradeForm
                    signal={selected.signal}
                    existing={formFor.trade}
                    onSave={handleSaveTrade}
                    onCancel={() => setFormFor(null)}
                  />
                )}

                {selected.trades.length === 0 && !formFor && (
                  <div className="panel p-4 text-center text-muted text-sm">
                    No trades logged for this signal yet.
                  </div>
                )}

                {selected.trades.map((trade) => (
                  <TradeResult
                    key={trade.id}
                    signal={selected.signal}
                    trade={trade}
                    onEdit={() => setFormFor({ signalId: selected.signal.id, trade })}
                    onDelete={() => void handleDeleteTrade(trade)}
                  />
                ))}

                {selected.signal.notes && (
                  <div className="panel p-3 text-xs text-muted">
                    <span className="uppercase tracking-wide text-[10px]">Signal notes</span>
                    <p className="mt-1 text-white/80">{selected.signal.notes}</p>
                  </div>
                )}
              </>
            ) : (
              !loading && (
                <div className="panel p-6 text-center text-muted text-sm">
                  Select a signal to view its chart and log a trade.
                </div>
              )
            )}
          </div>
        </div>
      </main>

      <Footer />

      {showPaste && <PasteModal onClose={() => setShowPaste(false)} onParse={handleParse} />}
      {showKey && (
        <AccessKeyModal onClose={() => setShowKey(false)} onSaved={() => void refresh()} />
      )}
    </div>
  );
}
