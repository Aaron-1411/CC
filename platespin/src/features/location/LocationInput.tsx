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
// Collapse duplicate / near-identical results the geocoder sometimes returns
// (e.g. "Shoreditch, London" twice) so the dropdown never looks broken.
function dedupe(results: GeoSuggestion[]): GeoSuggestion[] {
  const seen = new Set<string>();
  const out: GeoSuggestion[] = [];
  for (const r of results) {
    const key = r.label.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export function LocationInput({ value, onSet }: LocationInputProps) {
  const [text, setText] = useState(value?.label ?? "");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // -1 = nothing highlighted; arrow keys move through the list.
  const [activeIndex, setActiveIndex] = useState(-1);

  // Suppress the next fetch when text changed because the user *picked* a result
  // (or we set coords) rather than typed — avoids a pointless round-trip + reopen.
  // Initialised true when we mount with a saved location so the dropdown doesn't
  // auto-open over the wheel on page load (the field is already satisfied).
  const skipNextFetch = useRef((value?.label ?? "").trim().length >= MIN_CHARS);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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
          const deduped = dedupe(results);
          setSuggestions(deduped);
          setActiveIndex(-1);
          setOpen(deduped.length > 0);
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

  // Close the dropdown when tapping/clicking anywhere outside the field. Without
  // this it floats open over the wheel after you tap away — the main "messed up"
  // feeling on mobile.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted row scrolled into view as arrow keys move it.
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const row = listRef.current.children[activeIndex] as HTMLElement | undefined;
    row?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function pick(s: GeoSuggestion) {
    skipNextFetch.current = true;
    setText(s.label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    setError(null);
    onSet({ label: s.label, center: s.center });
  }

  function clear() {
    skipNextFetch.current = true;
    setText("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    setError(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter" && suggestions[0]) pick(suggestions[0]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(suggestions[activeIndex >= 0 ? activeIndex : 0]);
    }
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
        // Friendly label instead of raw "51.602, -0.123" — the coords still
        // drive availability; this is just what the user reads.
        const label = "My location";
        skipNextFetch.current = true;
        setText(label);
        setOpen(false);
        setActiveIndex(-1);
        onSet({ label, center });
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location — type it instead.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }

  const showClear = text.length > 0 && !locating;

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={onKeyDown}
            inputMode="text"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="location-suggestions"
            aria-activedescendant={activeIndex >= 0 ? `location-option-${activeIndex}` : undefined}
            placeholder="Where are you? e.g. Shoreditch, London"
            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-white/5 pl-3.5 pr-9 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:border-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300/40"
          />
          {loading ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              …
            </span>
          ) : (
            showClear && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear location"
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-slate-200"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M6 6l8 8M14 6l-8 8" />
                </svg>
              </button>
            )
          )}
          {open && suggestions.length > 0 && (
            <ul
              ref={listRef}
              id="location-suggestions"
              role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-slate-900/95 py-1 shadow-xl backdrop-blur"
            >
              {suggestions.map((s, i) => (
                <li key={`${s.center.lat},${s.center.lng},${i}`}>
                  <button
                    type="button"
                    id={`location-option-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    // onMouseDown (not onClick) so it fires before the input blurs.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(s);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex min-h-[44px] w-full items-center px-3.5 text-left text-sm text-slate-200 ${
                      i === activeIndex ? "bg-white/10" : "hover:bg-white/10"
                    }`}
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
