import { useState } from 'react';
import Modal from './Modal';

interface Props {
  onClose: () => void;
  onParse: (content: string) => Promise<void> | void;
}

export default function PasteModal({ onClose, onParse }: Props) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!content.trim()) {
      setError('Paste a signal message first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onParse(content.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Paste a signal" onClose={onClose}>
      <p className="text-xs text-muted mb-3">
        Copy a message from your signal source and paste it here. It’s parsed into a structured
        trade card the same way synced messages are.
      </p>
      <textarea
        className="field"
        rows={8}
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={'e.g. "LONG BTC entry 64800, stop 63200, targets 66k / 68k"'}
      />
      {error && <p className="text-short text-sm mt-2">{error}</p>}
      <div className="flex gap-2 justify-end mt-3">
        <button type="button" className="btn" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn-accent" onClick={submit} disabled={busy}>
          {busy ? 'Parsing…' : 'Parse signal'}
        </button>
      </div>
    </Modal>
  );
}
