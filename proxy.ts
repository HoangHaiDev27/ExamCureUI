import { NextResponse, type NextRequest } from "next/server";

/**
 * Điều hướng theo vai trò (Next 16: "proxy" là tên mới của middleware).
 *
 * Phiên đăng nhập nằm trong localStorage nên server chỉ thấy cookie `examcure_role`
 * do lib/auth.ts ghi khi login/logout. Đây là kiểm tra lạc quan để điều hướng:
 * cookie có thể bị sửa tay, nên quyền thật vẫn do BE kiểm (RolesGuard đọc role từ DB)
 * và AdminShell hỏi lại /auth/me.
 *
 * - Admin mở bất kỳ trang nào ngoài /admin  → về /admin
 * - Chưa đăng nhập mà vào /admin           → /dang-nhap
 * - Đã đăng nhập nhưng không phải Admin     → /
 */
const ROLE_COOKIE = "examcure_role"; // khớp ROLE_COOKIE trong lib/auth.ts

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (role === "Admin" && !inAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (role !== "Admin" && inAdmin) {
    return NextResponse.redirect(new URL(role ? "/" : "/dang-nhap", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Bỏ qua API, tài nguyên build và mọi file tĩnh (có đuôi .svg, .png, .ico…)
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
