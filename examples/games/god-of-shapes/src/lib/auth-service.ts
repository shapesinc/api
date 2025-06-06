"use client";


interface TokenResponse {
  success: boolean;
  accessToken: string;
  expiresIn: number;
}


class AuthService {
  private readonly TOKEN_KEY = "auth_token";
  private readonly EXPIRY_KEY = "token_expiry";

  /**
   * Check if user has a valid token
   * @returns boolean indicating if token exists and is valid
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;

    const token = sessionStorage.getItem(this.TOKEN_KEY);
    const expiry = sessionStorage.getItem(this.EXPIRY_KEY);

    if (!token || !expiry) return false;

    
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() > expiryTime) {
      
      this.clearToken();
      return false;
    }

    return true;
  }

  /**
   * Get the current access token
   * @returns The access token or null if no valid token exists
   */
  getToken(): string | null {
    if (!this.isAuthenticated()) return null;
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Request a new access token from the API
   * @returns Promise resolving to the token
   */
  async requestNewToken(): Promise<string> {
    try {
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to obtain access token");
      }

      const data: TokenResponse = await response.json();

      if (!data.success || !data.accessToken) {
        throw new Error("Invalid token response");
      }

      
      const expiryTime = Date.now() + data.expiresIn * 1000;
      sessionStorage.setItem(this.TOKEN_KEY, data.accessToken);
      sessionStorage.setItem(this.EXPIRY_KEY, expiryTime.toString());

      return data.accessToken;
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }

  /**
   * Get a valid token, requesting a new one if necessary
   * @returns Promise resolving to a valid token
   */
  async ensureToken(): Promise<string> {
    if (this.isAuthenticated()) {
      return this.getToken()!;
    }

    return this.requestNewToken();
  }


  clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.EXPIRY_KEY);
  }
}


export const authService = new AuthService();
