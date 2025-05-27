import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken"; // Remove 'verify' import since it's not used

// Secret key for signing JWT tokens
const JWT_SECRET =
  process.env.JWT_SECRET || "elemental-emoji-creator-secret-key";

// Token expiration time (15 minutes)
const TOKEN_EXPIRY = "15m";

export async function POST() {
  // Remove 'request' parameter since it's not used
  try {
    // Create token payload with expiration
    const payload = {
      access: "elemental-emoji-creator",
    };

    // Generate the JWT token
    const token = sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Return the token
    return NextResponse.json({
      success: true,
      accessToken: token,
      expiresIn: 15 * 60, // 15 minutes in seconds
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate access token" },
      { status: 500 }
    );
  }
}
