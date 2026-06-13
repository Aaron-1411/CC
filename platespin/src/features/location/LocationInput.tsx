import { useEffect, useRef, useState } from "react";
import type { SavedLocation } from "@/contract/types";
import { fetchGeocode, type GeoSuggestion } from "@/data/api";

interface LocationInputProps {
  value?: SavedLocation;
  onSet: (loc: SavedLocation) => void;
}

const DEBOUNCE_MS = 350;
const MIN_CHARS = 3;

// Geocode autocomplete backed by /api/geocode (Photon → Nominatim). Debounced,
// min 3 chars, aborts in-flight requests. Picking a suggestion sets REAL coords
// (which the honest-wheel pre-flight needs); the browser-geolocation button is a
// shortcut to the same SavedLocation shape.
export function LocationInput({ value, onSet }: LocationInputProps) {
  const [text, setText] = useState(value?.label ?? "");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Suppress the next fetch when text changed because the user *picked* a result
  // (or we set coords) rather than typed — avoids a pointless round-trip + reopen.
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const q = text.trim();
    if (q.length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      fetchGeocode(q, controller.signal)
        .then((results) => {
          setSuggestions(results);
          setOpen(results.length > 0);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setSuggestions([]);
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [text]);

  function pick(s: GeoSuggestion) {
    skipNextFetch.current = true;
    setText(s.label);
    setSuggestions([]);
    setOpen(false);
    setError(null);
    onSet({ label: s.label, center: s.center });
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
        const label = `${center.lat.toFixed(3)}, ${center.lng.toFixed(3)}`;
        skipNextFetch.current = true;
        setText(label);
        setOpen(false);
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
    <div className="relative space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions[0]) pick(suggestions[0]);
              if (e.key === "Escape") setOpen(false);
            }}
            inputMode="text"
            autoComplete="off"
            placeholder="Where are you? e.g. Shoreditch, London"
            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:border-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300/40"
          />
          {loading && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              …
            </span>
          )}
          {open && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-slate-900/95 py-1 shadow-xl backdrop-blur">
              {suggestions.map((s, i) => (
                <li key={`${s.center.lat},${s.center.lng},${i}`}>
                  <button
                    type="button"
                    // onMouseDown (not onClick) so it fires before the input blurs.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(s);
                    }}
                    className="flex min-h-[44px] w-full items-center px-3.5 text-left text-sm text-slate-200 hover:bg-white/10"
                  >
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
