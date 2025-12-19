import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hdcpruwkvarfbdtztzgq.supabase.co';

/**
 * Security API Client for interacting with security edge functions
 */
export class SecurityAPI {
  /**
   * Get authentication token for API calls
   */
  private static async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Make authenticated request to edge function
   */
  private static async callFunction(
    functionName: string,
    data: any
  ): Promise<any> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // ==================== 2FA Management ====================

  /**
   * Setup TOTP (Time-based One-Time Password) for 2FA
   */
  static async setupTOTP(): Promise<{
    success: boolean;
    secret: string;
    qr_code_url: string;
    otpauth: string;
  }> {
    return this.callFunction('2fa-management', {
      action: 'setup_totp',
    });
  }

  /**
   * Verify TOTP code
   */
  static async verifyTOTP(code: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.callFunction('2fa-management', {
      action: 'verify_totp',
      code,
    });
  }

  /**
   * Generate backup codes for 2FA
   */
  static async generateBackupCodes(): Promise<{
    success: boolean;
    backup_codes: string[];
  }> {
    return this.callFunction('2fa-management', {
      action: 'generate_backup_codes',
    });
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(code: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.callFunction('2fa-management', {
      action: 'disable_2fa',
      code,
    });
  }

  /**
   * Get 2FA status
   */
  static async get2FAStatus(): Promise<{
    totp_enabled: boolean;
    sms_enabled: boolean;
    backup_codes_remaining: number;
  }> {
    return this.callFunction('2fa-management', {
      action: 'status',
    });
  }

  // ==================== Rate Limiting ====================

  /**
   * Check rate limit for endpoint
   */
  static async checkRateLimit(
    endpoint: string,
    identifier: string,
    type: 'user' | 'ip' = 'user'
  ): Promise<{
    allowed: boolean;
    remaining: number;
    reset_at: string;
  }> {
    return this.callFunction('rate-limiting', {
      action: 'check',
      endpoint,
      identifier,
      type,
    });
  }

  // ==================== Threat Detection ====================

  /**
   * Analyze user behavior for threats
   */
  static async analyzeThreat(
    eventType: string,
    ipAddress: string,
    location: string,
    userAgent: string
  ): Promise<{
    success: boolean;
    anomaly_score: number;
    risk_level: string;
    message: string;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return this.callFunction('threat-detection', {
      action: 'analyze',
      user_id: user.id,
      event_type: eventType,
      ip_address: ipAddress,
      location,
      user_agent: userAgent,
    });
  }

  /**
   * Get security events for user
   */
  static async getSecurityEvents(limit: number = 50): Promise<{
    success: boolean;
    events: Array<{
      event_type: string;
      risk_level: string;
      anomaly_score: number;
      created_at: string;
      details: any;
    }>;
  }> {
    return this.callFunction('threat-detection', {
      action: 'get_events',
      limit,
    });
  }

  // ==================== GDPR Compliance ====================

  /**
   * Request user data export (GDPR right to access)
   */
  static async requestDataExport(): Promise<{
    success: boolean;
    request_id: string;
    message: string;
  }> {
    return this.callFunction('gdpr-compliance', {
      action: 'request_data',
    });
  }

  /**
   * Request data erasure (GDPR right to be forgotten)
   */
  static async requestDataErasure(reason: string): Promise<{
    success: boolean;
    request_id: string;
    message: string;
  }> {
    return this.callFunction('gdpr-compliance', {
      action: 'erase_data',
      reason,
    });
  }

  /**
   * Get GDPR consent status
   */
  static async getConsentStatus(): Promise<{
    success: boolean;
    consents: Record<string, boolean>;
  }> {
    return this.callFunction('gdpr-compliance', {
      action: 'get_consents',
    });
  }

  /**
   * Update GDPR consent
   */
  static async updateConsent(
    consentType: string,
    granted: boolean
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.callFunction('gdpr-compliance', {
      action: 'update_consent',
      consent_type: consentType,
      granted,
    });
  }

  /**
   * Get data processing activities
   */
  static async getDataProcessingActivities(): Promise<{
    success: boolean;
    activities: Array<{
      activity_type: string;
      purpose: string;
      legal_basis: string;
      retention_period: string;
    }>;
  }> {
    return this.callFunction('gdpr-compliance', {
      action: 'get_processing_activities',
    });
  }

  // ==================== HIPAA Compliance ====================

  /**
   * Log PHI (Protected Health Information) access
   */
  static async logPHIAccess(
    patientId: string,
    phiType: string,
    accessType: string,
    reason: string
  ): Promise<{
    success: boolean;
    audit_id: string;
    message: string;
  }> {
    return this.callFunction('hipaa-compliance', {
      action: 'log_access',
      patient_id: patientId,
      phi_type: phiType,
      access_type: accessType,
      reason,
    });
  }

  /**
   * Get HIPAA audit trail
   */
  static async getAuditTrail(
    startDate?: string,
    endDate?: string
  ): Promise<{
    success: boolean;
    audit_logs: Array<{
      id: string;
      phi_type: string;
      access_type: string;
      reason: string;
      created_at: string;
    }>;
  }> {
    return this.callFunction('hipaa-compliance', {
      action: 'get_audit_trail',
      start_date: startDate,
      end_date: endDate,
    });
  }
}
