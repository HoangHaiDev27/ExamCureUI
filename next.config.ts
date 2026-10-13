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
  async redirects() {
    const to = (source: string, destination: string) => ({ source, destination, permanent: false });
    return [
      to("/admin/noi-dung-ai", "/admin"),
      to("/admin/bai-thi", "/admin/de-thi"),
      to("/admin/cau-hoi", "/admin/de-thi"),
      to("/admin/hoc-phan", "/admin/mon-hoc"),
      to("/admin/truong", "/admin/mon-hoc"),
      to("/xac-thuc-otp", "/"),
    ];
  },
  experimental: { proxyTimeout: 180000 },
};
export default nextConfig;
