import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  // Static export for Cloudflare Pages — API routes are local-only
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
