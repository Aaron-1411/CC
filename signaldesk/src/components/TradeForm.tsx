import { useState } from 'react';
import type { Direction, ParsedSignal, UserTrade } from '../types/contract';

interface Props {
  signal: ParsedSignal;
  existing?: UserTrade;
  onSave: (trade: UserTrade) => Promise<void> | void;
  onCancel: () => void;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function fromLocalInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function TradeForm({ signal, existing, onSave, onCancel }: Props) {
  const [direction, setDirection] = useState<Direction>(existing?.direction ?? signal.direction ?? 'long');
  const [entryPrice, setEntryPrice] = useState(existing ? String(existing.entryPrice) : '');
  const [entryTime, setEntryTime] = useState(toLocalInput(existing?.entryTime ?? new Date().toISOString()));
  const [exitPrice, setExitPrice] = useState(existing?.exitPrice != null ? String(existing.exitPrice) : '');
  const [exitTime, setExitTime] = useState(toLocalInput(existing?.exitTime ?? null));
  const [size, setSize] = useState(existing?.size != null ? String(existing.size) : '');
  const [status, setStatus] = useState<'open' | 'closed'>(existing?.status ?? 'open');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ep = Number(entryPrice);
    if (!Number.isFinite(ep) || ep <= 0) {
      setError('Enter a valid entry price.');
      return;
    }
    const et = fromLocalInput(entryTime);
    if (!et) {
      setError('Enter a valid entry time.');
      return;
    }
    const xp = exitPrice ? Number(exitPrice) : null;
    if (status === 'closed' && (xp == null || !Number.isFinite(xp))) {
      setError('A closed trade needs an exit price.');
      return;
    }

    const trade: UserTrade = {
      id: existing?.id ?? crypto.randomUUID(),
      signalId: signal.id,
      direction,
      entryPrice: ep,
      entryTime: et,
      exitPrice: status === 'closed' ? xp : xp,
      exitTime: status === 'closed' ? (fromLocalInput(exitTime) ?? new Date().toISOString()) : fromLocalInput(exitTime),
      size: size ? Number(size) : null,
      status,
      notes: notes.trim() || null,
    };

    setSaving(true);
    setError(null);
    try {
      await onSave(trade);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-4 space-y-3">
      <div className="text-sm font-semibold">{existing ? 'Edit trade' : 'Log your trade'}</div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Direction</label>
          <div className="flex gap-2">
            {(['long', 'short'] as Direction[]).map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDirection(d)}
                className={`btn flex-1 ${direction === d ? (d === 'long' ? 'btn-accent' : 'border-short bg-short text-white') : ''}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}>
            <option value="open">open</option>
            <option value="closed">closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Entry price</label>
          <input
            className="field"
            inputMode="decimal"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder={signal.entry != null ? String(signal.entry) : '0.00'}
          />
        </div>
        <div>
          <label className="label">Entry time</label>
          <input
            className="field"
            type="datetime-local"
            value={entryTime}
            onChange={(e) => setEntryTime(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Exit price {status === 'open' && <span className="text-muted">(optional)</span>}</label>
          <input
            className="field"
            inputMode="decimal"
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            placeholder="—"
          />
        </div>
        <div>
          <label className="label">Exit time</label>
          <input
            className="field"
            type="datetime-local"
            value={exitTime}
            onChange={(e) => setExitTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Size (optional)</label>
        <input
          className="field"
          inputMode="decimal"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="position size"
        />
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          className="field"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="how the execution went…"
        />
      </div>

      {error && <p className="text-short text-sm">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-accent" disabled={saving}>
          {saving ? 'Saving…' : 'Save trade'}
        </button>
      </div>
    </form>
  );
}
