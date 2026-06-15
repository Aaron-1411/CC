import { useEffect } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="panel w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-edge sticky top-0 bg-panel">
          <span className="text-sm font-semibold">{title}</span>
          <button className="btn px-2 py-1 min-h-0 text-xs" onClick={onClose}>
            close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
