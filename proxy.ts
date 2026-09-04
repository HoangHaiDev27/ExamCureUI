import { NextResponse, type NextRequest } from "next/server";

/**
 * Chặn /admin ở edge cho user đã đăng nhập nhưng không phải role admin.
 * (Next.js 16 đổi tên "middleware" thành "proxy" — xem
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md)
 *
 * Proxy chỉ đọc được cookie của request, không đọc được localStorage — nơi
 * lib/auth.ts lưu phiên đăng nhập thật. `examcure_role` là cookie "gương" do
 * login()/logout() ghi song song, nên không phải ranh giới bảo mật (JS phía
 * client vẫn có thể tự sửa cookie này). Ranh giới bảo mật thật là backend
 * (requireSupabaseAdmin + RLS Postgres) — proxy này chỉ tránh việc gửi khung
 * giao diện admin cho tài khoản đã biết chắc không phải admin.
 *
 * Cố tình KHÔNG chặn khi không có cookie (chưa đăng nhập): AdminConsole còn
 * hỗ trợ luồng bootstrap-token cấp quyền admin lần đầu, vốn hoạt động ngay cả
 * khi chưa đăng nhập — xem components/admin/AdminGuard.tsx.
 */
export function proxy(request: NextRequest) {
  const role = request.cookies.get("examcure_role")?.value;
  if (role && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
