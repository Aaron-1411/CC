import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { PublicUser } from "@/contract/types";
import { searchUsers } from "@/data/social";
import { Avatar } from "./Avatar";

export function PeopleSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicUser[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (term.length < 2) {
        setResults([]);
        return;
      }
      try {
        setResults(await searchUsers(term));
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Find people by name or @handle"
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-300/40 focus:outline-none"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#11161f] shadow-xl">
          {results.map((u) => (
            <li key={u.id}>
              <Link
                to={`/u/${u.handle}`}
                onClick={() => {
                  setOpen(false);
                  setQ("");
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-white/5"
              >
                <Avatar user={u} size={28} />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-100">{u.displayName}</span>
                  <span className="block truncate text-xs text-slate-500">@{u.handle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
