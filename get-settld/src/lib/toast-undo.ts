// Wrapper around sonner that always offers an Undo within a 5s window.
// Use for destructive-but-reversible actions (delete shortlist item etc).
import { toast } from "sonner";

export function toastWithUndo({
  message,
  description,
  onUndo,
  durationMs = 5000,
}: {
  message: string;
  description?: string;
  onUndo: () => void;
  durationMs?: number;
}) {
  toast(message, {
    description,
    duration: durationMs,
    action: { label: "Undo", onClick: () => onUndo() },
  });
}
