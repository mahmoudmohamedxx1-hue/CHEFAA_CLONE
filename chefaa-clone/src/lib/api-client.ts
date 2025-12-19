import { jwtService } from './jwt';
import { supabase } from './supabase';

/**
 * API Client with automatic JWT token handling
 * Provides centralized API request management with automatic token refresh
 */
export class APIClient {
  private baseURL: string;
  private maxRetries: number = 2;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Make HTTP request with automatic JWT token injection
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<Response> {
    // Get current access token
    const token = await jwtService.getAccessToken();

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Check if token will expire soon and refresh if needed
    const willExpireSoon = await jwtService.willExpireSoon(5);
    if (willExpireSoon) {
      await jwtService.refreshToken();
      const newToken = await jwtService.getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401 && retryCount < this.maxRetries) {
        const refreshed = await jwtService.refreshToken();
        
        if (refreshed) {
          // Retry request with new token
          return this.makeRequest(endpoint, options, retryCount + 1);
        } else {
          // Token refresh failed, user needs to re-authenticate
          await supabase.auth.signOut();
          throw new Error('Authentication required. Please log in again.');
        }
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to perform this action.');
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      ...options,
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`GET request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`POST request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`PUT request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`PATCH request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.makeRequest(endpoint, {
      ...options,
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`DELETE request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Call Supabase Edge Function with automatic JWT handling
   */
  async callEdgeFunction<T = any>(
    functionName: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const token = await jwtService.getAccessToken();
    
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token || ''}`,
      ...(options?.headers as Record<string, string> || {}),
    };
    
    const { data: result, error } = await supabase.functions.invoke(functionName, {
      body: data,
      headers,
    });

    if (error) {
      throw new Error(`Edge function ${functionName} failed: ${error.message}`);
    }

    return result as T;
  }

  /**
   * Upload file with automatic JWT handling
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: {
      cacheControl?: string;
      contentType?: string;
      upsert?: boolean;
    }
  ): Promise<{ path: string; url: string }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrl,
    };
  }

  /**
   * Download file with automatic JWT handling
   */
  async downloadFile(bucket: string, path: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new Error(`File download failed: ${error.message}`);
    }

    return data;
  }
}

// Export default API client instance
export const apiClient = new APIClient();

// Export Supabase-specific API client
export const supabaseAPI = new APIClient();
