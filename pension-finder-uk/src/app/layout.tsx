import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Pension Finder UK — Find, Track & Grow Your Lost Pensions",
  description: "Locate lost workplace pensions, track all your pots in one place, and get plain-English projections for your retirement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
            <p className="mb-1">Pension Finder UK is a guidance tool, not regulated financial advice.</p>
            <p>© 2026 Pension Finder UK · <a href="https://www.gov.uk/find-pension-contact-details" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">Official Gov Pension Tracing Service ↗</a></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
