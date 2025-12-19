// Advanced Security API Client for Frontend Integration

import { supabase } from '../lib/supabase';

const FUNCTIONS_URL = 'https://hdcpruwkvarfbdtztzgq.supabase.co/functions/v1';

// Get JWT token for authentication
async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

// Make authenticated API call to edge function
async function callFunction(functionName: string, action: string, data: any = {}) {
  const token = await getAuthToken();
  
  const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Advanced Security Controls API
export const SecurityControlsAPI = {
  async getSecurityHeaders() {
    return callFunction('advanced-security-controls', 'get_security_headers');
  },

  async getCSPPolicy() {
    return callFunction('advanced-security-controls', 'get_csp_policy');
  },

  async checkSSLConfig() {
    return callFunction('advanced-security-controls', 'check_ssl_config');
  },

  async scanVulnerabilities(target = 'application') {
    return callFunction('advanced-security-controls', 'scan_vulnerabilities', { target });
  },

  async getSecurityScore() {
    return callFunction('advanced-security-controls', 'get_security_score');
  },
};

// Enhanced Encryption API
export const EncryptionAPI = {
  async encryptField(field: string, value: string, classification = 'PHI') {
    return callFunction('enhanced-encryption', 'encrypt_field', { field, value, classification });
  },

  async decryptField(encryptedValue: string, keyId: string) {
    return callFunction('enhanced-encryption', 'decrypt_field', { encryptedValue, keyId });
  },

  async tokenizeData(value: string, type: string) {
    return callFunction('enhanced-encryption', 'tokenize_data', { value, type });
  },

  async detokenizeData(token: string) {
    return callFunction('enhanced-encryption', 'detokenize_data', { token });
  },

  async rotateKeys() {
    return callFunction('enhanced-encryption', 'rotate_keys');
  },

  async getEncryptionStatus() {
    return callFunction('enhanced-encryption', 'get_encryption_status');
  },
};

// Advanced Audit Logging API
export const AuditAPI = {
  async logAuditEvent(eventData: {
    eventType: string;
    resourceType?: string;
    resourceId?: string;
    action: string;
    outcome?: string;
    metadata?: any;
  }) {
    return callFunction('advanced-audit-logging', 'log_audit_event', eventData);
  },

  async getAuditLogs(filters: {
    startDate?: string;
    endDate?: string;
    eventType?: string;
    resourceType?: string;
    limit?: number;
  }) {
    return callFunction('advanced-audit-logging', 'get_audit_logs', filters);
  },

  async analyzeSecurityEvents(timeRange = '24h') {
    return callFunction('advanced-audit-logging', 'analyze_security_events', { timeRange });
  },

  async getComplianceReport(framework = 'HIPAA', startDate?: string, endDate?: string) {
    return callFunction('advanced-audit-logging', 'get_compliance_report', { framework, startDate, endDate });
  },

  async exportAuditTrail(startDate: string, endDate: string, format = 'json') {
    return callFunction('advanced-audit-logging', 'export_audit_trail', { startDate, endDate, format });
  },

  async getRealtimeAlerts() {
    return callFunction('advanced-audit-logging', 'get_realtime_alerts');
  },
};

// Combined Security Dashboard Data
export const SecurityDashboard = {
  async getDashboardData() {
    const [securityScore, encryptionStatus, alerts, securityEvents] = await Promise.all([
      SecurityControlsAPI.getSecurityScore(),
      EncryptionAPI.getEncryptionStatus(),
      AuditAPI.getRealtimeAlerts(),
      AuditAPI.analyzeSecurityEvents('24h'),
    ]);

    return {
      securityScore: securityScore.data,
      encryptionStatus: encryptionStatus.data,
      alerts: alerts.data,
      securityEvents: securityEvents.data,
    };
  },

  async getComplianceDashboard() {
    const [hipaaReport, vulnerabilityScan, sslConfig] = await Promise.all([
      AuditAPI.getComplianceReport('HIPAA'),
      SecurityControlsAPI.scanVulnerabilities(),
      SecurityControlsAPI.checkSSLConfig(),
    ]);

    return {
      hipaaReport: hipaaReport.data,
      vulnerabilityScan: vulnerabilityScan.data,
      sslConfig: sslConfig.data,
    };
  },
};
