import { jwtService } from '../lib/jwt';
import { User } from '@supabase/supabase-js';

/**
 * Authenticated request context
 */
export interface AuthenticatedRequest {
  user: User;
  token: string;
  isValid: boolean;
  role: string | null;
}

/**
 * Validate current authentication state
 * @returns AuthenticatedRequest if valid, null otherwise
 */
export async function validateAuthentication(): Promise<AuthenticatedRequest | null> {
  try {
    const token = await jwtService.getAccessToken();
    const user = await jwtService.getUser();

    if (!token || !user) {
      return null;
    }

    // Check if token is valid (not expired)
    const isValid = await jwtService.isTokenValid();
    if (!isValid) {
      return null;
    }

    const role = await jwtService.getUserRole();

    return {
      user,
      token,
      isValid: true,
      role,
    };
  } catch (error) {
    console.error('Authentication validation error:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedRequest> {
  const auth = await validateAuthentication();
  
  if (!auth) {
    throw new Error('Authentication required');
  }

  return auth;
}

/**
 * Require specific role(s) middleware
 * @param allowedRoles - Array of roles that are allowed
 * @returns true if user has one of the allowed roles, false otherwise
 */
export async function requireRole(allowedRoles: string[]): Promise<boolean> {
  try {
    const auth = await validateAuthentication();
    
    if (!auth) {
      return false;
    }

    if (!auth.role) {
      return false;
    }

    return allowedRoles.includes(auth.role);
  } catch (error) {
    console.error('Role validation error:', error);
    return false;
  }
}

/**
 * Optional authentication middleware
 * Returns auth context if available, null if not authenticated
 */
export async function optionalAuth(): Promise<AuthenticatedRequest | null> {
  try {
    return await validateAuthentication();
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is authenticated (synchronous check)
 * Note: This checks session existence, not token validity
 */
export function isAuthenticated(): boolean {
  // This is a simplified sync check
  // For full validation, use validateAuthentication()
  try {
    const session = localStorage.getItem('supabase.auth.token');
    return !!session;
  } catch {
    return false;
  }
}

/**
 * Redirect to login if not authenticated
 */
export async function redirectIfNotAuthenticated(redirectTo: string = '/login'): Promise<void> {
  const auth = await validateAuthentication();
  
  if (!auth) {
    window.location.href = redirectTo;
  }
}

/**
 * Redirect if authenticated (useful for login/signup pages)
 */
export async function redirectIfAuthenticated(redirectTo: string = '/'): Promise<void> {
  const auth = await validateAuthentication();
  
  if (auth) {
    window.location.href = redirectTo;
  }
}

/**
 * Higher-order function for protecting routes
 */
export function withAuth<T extends (...args: any[]) => any>(
  handler: (auth: AuthenticatedRequest, ...args: Parameters<T>) => ReturnType<T>
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const auth = await requireAuth();
    return handler(auth, ...args);
  };
}

/**
 * Higher-order function for protecting routes with role check
 */
export function withRole<T extends (...args: any[]) => any>(
  allowedRoles: string[],
  handler: (auth: AuthenticatedRequest, ...args: Parameters<T>) => ReturnType<T>,
  onUnauthorized?: () => void
): (...args: Parameters<T>) => Promise<ReturnType<T> | void> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | void> => {
    const auth = await requireAuth();
    const hasRole = await requireRole(allowedRoles);
    
    if (!hasRole) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        throw new Error('Insufficient permissions');
      }
      return;
    }
    
    return handler(auth, ...args);
  };
}

/**
 * Token expiration warning
 * Returns time in milliseconds until token expiration
 */
export async function getTokenExpirationWarning(warningThresholdMinutes: number = 5): Promise<number | null> {
  const timeUntilExpiration = await jwtService.getTimeUntilExpiration();
  
  if (!timeUntilExpiration) {
    return null;
  }

  const warningThreshold = warningThresholdMinutes * 60 * 1000;
  
  if (timeUntilExpiration < warningThreshold) {
    return timeUntilExpiration;
  }

  return null;
}

/**
 * Auto-refresh token if expiring soon
 */
export async function autoRefreshToken(thresholdMinutes: number = 5): Promise<boolean> {
  const willExpireSoon = await jwtService.willExpireSoon(thresholdMinutes);
  
  if (willExpireSoon) {
    return await jwtService.refreshToken();
  }

  return true;
}
