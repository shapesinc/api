import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware function runs before any route is processed
export function middleware(request: NextRequest) {
  // Check if the current request is to the mix-elements API
  if (request.nextUrl.pathname.startsWith("/api/mix-elements")) {
    // Get the Authorization header
    const authHeader = request.headers.get("Authorization");

    // If no Authorization header or it doesn't start with 'Bearer ', redirect to the auth page
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // For API routes, return a 401 Unauthorized response
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      );
    }

    // Continue with the request (token verification will happen in the route handler)
  }

  // For all other routes, proceed normally
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: ["/api/mix-elements/:path*"],
};
