import { useState } from "react";
import type { SavedLocation } from "@/contract/types";

interface LocationInputProps {
  value?: SavedLocation;
  onSet: (loc: SavedLocation) => void;
}

// Phase 2: a plain, persisted text location + browser geolocation.
// Phase 3 swaps the text field for /api/geocode autocomplete (Photon/Nominatim,
// debounced ≥300ms, min 3 chars). The contract (SavedLocation) doesn't change.
export function LocationInput({ value, onSet }: LocationInputProps) {
  const [text, setText] = useState(value?.label ?? "");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function commit(label: string, center?: { lat: number; lng: number }) {
    const trimmed = label.trim();
    if (!trimmed) return;
    // Without geocoding we don't have coords yet; deep-links only need the label.
    onSet({ label: trimmed, center: center ?? value?.center ?? { lat: 0, lng: 0 } });
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setError("Geolocation isn't available on this device.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // Reverse-geocoding to a label is Phase 3; for now show coords.
        const label = `${center.lat.toFixed(3)}, ${center.lng.toFixed(3)}`;
        setText(label);
        onSet({ label, center });
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location — type it instead.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(text);
          }}
          inputMode="text"
          autoComplete="off"
          placeholder="Where are you? e.g. Shoreditch, London"
          className="min-h-[44px] w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-base text-slate-100 placeholder:text-slate-500 focus:border-amber-300/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:opacity-60"
          title="Use my location"
        >
          {locating ? "…" : "📍"}
        </button>
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
