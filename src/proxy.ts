import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/transactions", "/budgets", "/savings", "/settings"];

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isLoggedIn = Boolean(request.auth);

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/transactions/:path*", "/budgets/:path*", "/savings/:path*", "/settings/:path*", "/login", "/register"],
};
