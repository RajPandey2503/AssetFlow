import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/auth/constants";

const authRoutes = ["/login", "/signup", "/forgot-password"];
const protectedPrefixes = [
  "/dashboard",
  "/assets",
  "/departments",
  "/employees",
  "/categories",
  "/allocation",
  "/maintenance",
  "/bookings",
  "/reports",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value);
  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assets/:path*",
    "/departments/:path*",
    "/employees/:path*",
    "/categories/:path*",
    "/allocation/:path*",
    "/maintenance/:path*",
    "/bookings/:path*",
    "/reports/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
