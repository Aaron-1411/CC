import type { Metadata, Viewport } from "next";
import "./globals.css";
import { body, display, serif } from "./fonts";
import { BoxProvider } from "@/components/providers/BoxProvider";
import { AgeGateProvider } from "@/components/providers/AgeGateProvider";

export const metadata: Metadata = {
  title: "DOSE — Kick the sugar, keep the sweet.",
  description:
    "Low-sugar sweets that taste like the real thing, sold honestly. Build your box of EVERYDAY treats and FUEL energy gummies.",
  keywords: [
    "low sugar sweets",
    "healthy gummies",
    "less sugar candy",
    "DOSE",
    "functional sweets",
  ],
  openGraph: {
    title: "DOSE — Kick the sugar, keep the sweet.",
    description:
      "Low-sugar sweets that taste like the real thing, sold honestly.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B3A2F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${serif.variable} ${body.variable}`}
    >
      <body>
        <AgeGateProvider>
          <BoxProvider>{children}</BoxProvider>
        </AgeGateProvider>
      </body>
    </html>
  );
}
