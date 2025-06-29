export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'verse_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'verse_refresh_token';
  private static readonly EXPIRES_AT_KEY = 'verse_expires_at';
  private static readonly USER_ID_KEY = 'verse_user_id';

  // Store tokens
  static storeTokens(tokenData: TokenData): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokenData.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refreshToken);
      localStorage.setItem(this.EXPIRES_AT_KEY, tokenData.expiresAt.toString());
      localStorage.setItem(this.USER_ID_KEY, tokenData.userId);
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  // Get stored tokens
  static getTokens(): TokenData | null {
    try {
      const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
      const userId = localStorage.getItem(this.USER_ID_KEY);

      if (!accessToken || !refreshToken || !expiresAt || !userId) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        expiresAt: parseInt(expiresAt),
        userId
      };
    } catch (error) {
      console.error('Failed to get tokens:', error);
      return null;
    }
  }

  // Clear all tokens
  static clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.EXPIRES_AT_KEY);
      localStorage.removeItem(this.USER_ID_KEY);
      // Don't clear all sessionStorage, just specific items if needed
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // Check if token is expired
  static isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt;
  }

  // Check if token needs refresh (within 5 minutes of expiry)
  static needsRefresh(expiresAt: number): boolean {
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return expiresAt <= fiveMinutesFromNow;
  }

  // Generate simple tokens with longer expiry
  static generateTokens(userId: string): TokenData {
    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      accessToken,
      refreshToken,
      expiresAt,
      userId
    };
  }

  private static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate token format
  static isValidTokenFormat(token: string): boolean {
    return typeof token === 'string' && token.length === 64 && /^[a-f0-9]+$/.test(token);
  }
}