"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, PoundSterling } from "lucide-react";

const links = [
  { href: "/find", label: "Find Lost Pensions" },
  { href: "/track", label: "My Pensions" },
  { href: "/project", label: "Projection Calculator" },
  { href: "/tax-relief", label: "Tax Relief" },
  { href: "/consolidate", label: "Consolidate" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-700 shrink-0">
          <PoundSterling className="w-6 h-6" />
          Pension Finder UK
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-5">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${pathname === l.href ? "text-indigo-700" : "text-gray-600 hover:text-indigo-700"}`}>
              {l.label}
            </Link>
          ))}
          <Link href="/find" className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-800 transition-colors whitespace-nowrap">
            Start free →
          </Link>
        </div>

        <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium ${pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}>
              {l.label}
            </Link>
          ))}
          <Link href="/find" onClick={() => setOpen(false)}
            className="mt-2 bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-indigo-800">
            Start for free →
          </Link>
        </div>
      )}
    </nav>
  );
}
