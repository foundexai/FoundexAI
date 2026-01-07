import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = [
    "/profile",
    "/startup-profile",
    "/dashboard",
    "/dashboard/tasks",
    "/dashboard/notes",
  ];

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for authentication token in cookies
    const token = request.cookies.get("token")?.value;

    if (!token) {
      // Redirect to login page with callbackUrl
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token exists, allow the request to continue
    // Note: Actual token verification happens in the page components
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/startup-profile/:path*", "/dashboard/:path*"],
};
