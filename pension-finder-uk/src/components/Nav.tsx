"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, PoundSterling } from "lucide-react";

const links = [
  { href: "/find", label: "Find Pensions" },
  { href: "/track", label: "My Pensions" },
  { href: "/project", label: "Projections" },
  { href: "/consolidate", label: "Consolidate" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-700">
          <PoundSterling className="w-6 h-6" />
          Pension Finder UK
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "text-indigo-700"
                  : "text-gray-600 hover:text-indigo-700"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/find"
            className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-800 transition-colors"
          >
            Start for free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`text-sm font-medium ${pathname === l.href ? "text-indigo-700" : "text-gray-700"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/find" onClick={() => setOpen(false)} className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center">
            Start for free
          </Link>
        </div>
      )}
    </nav>
  );
}
