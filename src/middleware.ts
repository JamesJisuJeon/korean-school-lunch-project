import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isAuthRoute = nextUrl.pathname === "/login";
  const isPublicRoute =
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname === "/manifest.json" ||
    nextUrl.pathname === "/sw.js" ||
    nextUrl.pathname.startsWith("/uploads/") ||
    /\.(png|ico|svg|webp|jpg|jpeg)$/.test(nextUrl.pathname);

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && req.auth?.user.mustChangePassword && nextUrl.pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", nextUrl));
  }

  // 비밀번호 변경이 필요 없는 사용자가 비밀번호 변경 페이지에 있으면 대시보드로 보냄
  if (isLoggedIn && !req.auth?.user.mustChangePassword && nextUrl.pathname === "/change-password") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
