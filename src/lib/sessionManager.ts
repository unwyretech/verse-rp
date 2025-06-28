import { supabase } from './supabase';

export interface SessionData {
  sessionToken: string;
  refreshToken: string;
  expiresAt: Date;
  userId: string;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'verse_session';
  private static readonly REFRESH_KEY = 'verse_refresh';
  private static readonly EXPIRES_KEY = 'verse_expires';
  private static readonly USER_ID_KEY = 'verse_user_id';

  // Store session data
  static storeSession(sessionData: SessionData): void {
    try {
      localStorage.setItem(this.SESSION_KEY, sessionData.sessionToken);
      localStorage.setItem(this.REFRESH_KEY, sessionData.refreshToken);
      localStorage.setItem(this.EXPIRES_KEY, sessionData.expiresAt.toISOString());
      localStorage.setItem(this.USER_ID_KEY, sessionData.userId);
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  // Get stored session data
  static getStoredSession(): SessionData | null {
    try {
      const sessionToken = localStorage.getItem(this.SESSION_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_KEY);
      const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
      const userId = localStorage.getItem(this.USER_ID_KEY);

      if (!sessionToken || !refreshToken || !expiresAt || !userId) {
        return null;
      }

      return {
        sessionToken,
        refreshToken,
        expiresAt: new Date(expiresAt),
        userId
      };
    } catch (error) {
      console.error('Failed to get stored session:', error);
      return null;
    }
  }

  // Clear stored session data
  static clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
      localStorage.removeItem(this.EXPIRES_KEY);
      localStorage.removeItem(this.USER_ID_KEY);
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  // Check if session is expired
  static isSessionExpired(expiresAt: Date): boolean {
    return new Date() >= expiresAt;
  }

  // Check if session needs refresh (within 5 minutes of expiry)
  static needsRefresh(expiresAt: Date): boolean {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiresAt <= fiveMinutesFromNow;
  }

  // Generate session tokens
  static generateTokens(): { sessionToken: string; refreshToken: string } {
    const sessionToken = this.generateSecureToken();
    const refreshToken = this.generateSecureToken();
    return { sessionToken, refreshToken };
  }

  private static generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Create session in database
  static async createSession(
    userId: string,
    sessionToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<boolean> {
    try {
      const userAgent = navigator.userAgent;
      const ipAddress = await this.getClientIP();

      const { error } = await supabase.rpc('create_user_session', {
        p_user_id: userId,
        p_session_token: sessionToken,
        p_refresh_token: refreshToken,
        p_expires_at: expiresAt.toISOString(),
        p_user_agent: userAgent,
        p_ip_address: ipAddress
      });

      if (error) {
        console.error('Failed to create session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating session:', error);
      return false;
    }
  }

  // Validate session token
  static async validateSession(sessionToken: string): Promise<{
    isValid: boolean;
    userId?: string;
    expiresAt?: Date;
  }> {
    try {
      const { data, error } = await supabase.rpc('validate_session_token', {
        token: sessionToken
      });

      if (error || !data || data.length === 0) {
        return { isValid: false };
      }

      const session = data[0];
      return {
        isValid: session.is_valid,
        userId: session.user_id,
        expiresAt: new Date(session.expires_at)
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return { isValid: false };
    }
  }

  // Refresh session
  static async refreshSession(refreshToken: string): Promise<SessionData | null> {
    try {
      const { sessionToken: newSessionToken, refreshToken: newRefreshToken } = this.generateTokens();
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { data, error } = await supabase.rpc('refresh_user_session', {
        p_refresh_token: refreshToken,
        p_new_session_token: newSessionToken,
        p_new_refresh_token: newRefreshToken,
        p_new_expires_at: newExpiresAt.toISOString()
      });

      if (error || !data) {
        console.error('Failed to refresh session:', error);
        return null;
      }

      // Get user ID from the old session
      const storedSession = this.getStoredSession();
      if (!storedSession) {
        return null;
      }

      const newSessionData: SessionData = {
        sessionToken: newSessionToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        userId: storedSession.userId
      };

      this.storeSession(newSessionData);
      return newSessionData;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  }

  // Invalidate session
  static async invalidateSession(sessionToken: string): Promise<void> {
    try {
      await supabase.rpc('invalidate_session', {
        p_session_token: sessionToken
      });
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  // Invalidate all user sessions
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      await supabase.rpc('invalidate_all_user_sessions', {
        p_user_id: userId
      });
    } catch (error) {
      console.error('Error invalidating all user sessions:', error);
    }
  }

  // Get client IP address (best effort)
  private static async getClientIP(): Promise<string | null> {
    try {
      // This is a simple approach - in production you might want to use a more reliable service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not get client IP:', error);
      return null;
    }
  }

  // Clean up expired sessions (can be called periodically)
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_sessions');
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}