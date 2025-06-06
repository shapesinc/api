import { verify } from "jsonwebtoken";


const JWT_SECRET =
  process.env.JWT_SECRET || "elemental-emoji-creator-secret-key";

/**
 * Verifies a JWT token
 * @param token The JWT token to verify
 * @returns The decoded token payload if valid, null otherwise
 */
export function verifyToken(token: string) {
  try {
    
    const decoded = verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    
    console.error("Token verification failed:", error);
    return null;
  }
}
