import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  // Allow cross-origin requests from Yahoo Finance
  async headers() {
    return [
      {
        source: "/api/stream/:path*",
        headers: [
          { key: "X-Accel-Buffering", value: "no" },
          { key: "Cache-Control", value: "no-cache, no-transform" },
          { key: "Content-Type", value: "text/event-stream" },
        ],
      },
    ];
  },
};

export default nextConfig;
