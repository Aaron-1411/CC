import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function SlidePanel({ open, onClose, title, children }: SlidePanelProps) {
  // Trap focus / close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-navy-900/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          {/* Panel */}
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal
            aria-label={title}
          >
            <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
              <h2 className="font-semibold text-navy-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-navy-500 hover:bg-navy-100"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
