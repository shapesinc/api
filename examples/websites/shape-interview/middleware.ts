import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the required environment variables are set
  const shapesApiKey = process.env.SHAPES_API_KEY
  const vercelBlobKey = process.env.BLOB_READ_WRITE_TOKEN

  // If accessing API routes and environment variables are missing, return an error
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!shapesApiKey || !vercelBlobKey) {
      return NextResponse.json(
        {
          error: "Server configuration error. Please set up the required environment variables.",
          missingVars: {
            SHAPES_API_KEY: !shapesApiKey,
            BLOB_READ_WRITE_TOKEN: !vercelBlobKey,
          },
        },
        { status: 500 },
      )
    }
  }

  return NextResponse.next()
}

// Only run middleware on API routes
export const config = {
  matcher: "/api/:path*",
}
