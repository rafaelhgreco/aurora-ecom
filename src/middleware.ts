import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ACCESS_DENIED_REDIRECT,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  privateRoutes,
  publicRoutes,
} from "@/app/config/routes";
import { getUserRole, isValidToken } from "@/app/services/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token");
  const isAuthenticated = isValidToken(token);

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = getUserRole(token);

  if (!userRole) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  const sortedRoutes = Object.keys(privateRoutes).sort(
    (a, b) => b.length - a.length,
  );

  const matchedRoute = sortedRoutes.find((route) => pathname.startsWith(route));

  if (matchedRoute) {
    const config = privateRoutes[matchedRoute];

    if (!config.roles.includes(userRole)) {
      const redirectUrl = config.redirect || ACCESS_DENIED_REDIRECT;
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
