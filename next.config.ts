import type { NextConfig } from "next";
const backend = (
  process.env.EXAMCURE_API_URL || "http://localhost:5010"
).replace(/\/$/, "");
const target = new URL(backend);
if (
  !["http:", "https:"].includes(target.protocol) ||
  target.pathname !== "/" ||
  target.username ||
  target.password
)
  throw new Error("EXAMCURE_API_URL must be the backend origin");
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*` },
    ];
  },
  experimental: { proxyTimeout: 180000 },
};
export default nextConfig;
