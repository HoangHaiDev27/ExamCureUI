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
 *
 * Ngược lại, tài khoản admin mở bất kỳ trang nào ngoài /admin đều bị đưa về /admin.
 * Role so sánh không phân biệt hoa thường (NestJS trả "Admin", Supabase trả "admin").
 */
export function proxy(request: NextRequest) {
  const role = request.cookies.get("examcure_role")?.value?.toLowerCase();
  const { pathname } = request.nextUrl;
  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (role === "admin" && !inAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (inAdmin && role && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Mọi trang, trừ API, tài nguyên build và file tĩnh (.svg, .png, .ico…)
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
