/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export → deploys to Cloudflare Pages as plain static files
  // (no Worker, so no 3 MiB edge limit). The app is fully client-side.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
