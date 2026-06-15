import { useState } from 'react';
import Modal from './Modal';
import { getAppKey, setAppKey } from '../lib/api';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function AccessKeyModal({ onClose, onSaved }: Props) {
  const [key, setKey] = useState(getAppKey());

  function save() {
    setAppKey(key.trim());
    onSaved();
    onClose();
  }

  return (
    <Modal title="Access key" onClose={onClose}>
      <p className="text-xs text-muted mb-3">
        Production access is gated by a shared secret. Enter the key configured server-side
        (sent as the <code className="text-white">x-app-key</code> header). It’s stored only in
        this browser. Leave blank to clear.
      </p>
      <input
        className="field"
        type="password"
        autoFocus
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="shared secret"
      />
      <div className="flex gap-2 justify-end mt-3">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-accent" onClick={save}>
          Save key
        </button>
      </div>
    </Modal>
  );
}
