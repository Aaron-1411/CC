// Debounced autosave indicator — show "Saved ✓" inline whenever a value
// settles. Returns "saving" while waiting, "saved" briefly after, then "idle".
import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved";

export function useAutosave<T>(value: T, save: (v: T) => Promise<void> | void, delayMs = 700) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setStatus("saving");
    const t = setTimeout(async () => {
      try {
        await save(value);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      } catch {
        setStatus("idle");
      }
    }, delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return status;
}
