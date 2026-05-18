import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/journey";

export function useJourneyProgress() {
  const [progress, setProgress] = useState(() => loadProgress());

  useEffect(() => {
    const handler = () => setProgress(loadProgress());
    window.addEventListener("journey:progress", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("journey:progress", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return progress;
}
