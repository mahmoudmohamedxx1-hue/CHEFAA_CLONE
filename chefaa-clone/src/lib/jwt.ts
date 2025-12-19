import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

/**
 * Centralized JWT Service for managing authentication tokens
 * Implements singleton pattern for consistent token management
 */
export class JWTService {
  private static instance: JWTService;

  private constructor() {}

  static getInstance(): JWTService {
    if (!JWTService.instance) {
      JWTService.instance = new JWTService();
    }
    return JWTService.instance;
  }

  /**
   * Get current access token from Supabase session
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get current refresh token from Supabase session
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.refresh_token || null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get current user from Supabase session
   */
  async getUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Refresh the current session token
   * @returns true if refresh was successful, false otherwise
   */
  async refreshToken(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Token refresh error:', error);
        return false;
      }
      return !!data.session;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Check if current token is valid
   */
  async isTokenValid(): Promise<boolean> {
    const session = await this.getSession();
    if (!session || !session.access_token) {
      return false;
    }

    // Check if token is expired
    const expirationTime = this.getTokenExpirationTime(session);
    if (!expirationTime) {
      return false;
    }

    return Date.now() < expirationTime * 1000;
  }

  /**
   * Get token expiration time in seconds
   */
  getTokenExpirationTime(session?: Session | null): number | null {
    if (!session) {
      return null;
    }
    return session.expires_at || null;
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(role: string): Promise<boolean> {
    const user = await this.getUser();
    if (!user) {
      return false;
    }

    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    return userRole === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(roles: string[]): Promise<boolean> {
    const user = await this.getUser();
    if (!user) {
      return false;
    }

    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    return roles.includes(userRole);
  }

  /**
   * Get user's role
   */
  async getUserRole(): Promise<string | null> {
    const user = await this.getUser();
    if (!user) {
      return null;
    }

    return user.user_metadata?.role || user.app_metadata?.role || 'patient';
  }

  /**
   * Parse JWT token payload
   */
  parseToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  /**
   * Get token time until expiration in milliseconds
   */
  async getTimeUntilExpiration(): Promise<number | null> {
    const session = await this.getSession();
    if (!session) {
      return null;
    }

    const expirationTime = this.getTokenExpirationTime(session);
    if (!expirationTime) {
      return null;
    }

    return (expirationTime * 1000) - Date.now();
  }

  /**
   * Check if token will expire soon (within specified minutes)
   */
  async willExpireSoon(withinMinutes: number = 5): Promise<boolean> {
    const timeUntilExpiration = await this.getTimeUntilExpiration();
    if (!timeUntilExpiration) {
      return true;
    }

    return timeUntilExpiration < (withinMinutes * 60 * 1000);
  }
}

// Export singleton instance
export const jwtService = JWTService.getInstance();
