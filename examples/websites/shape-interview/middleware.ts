import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const shapesApiKey = process.env.SHAPES_API_KEY
  const vercelBlobKey = process.env.BLOB_READ_WRITE_TOKEN

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

export const config = {
  matcher: "/api/:path*",
}
