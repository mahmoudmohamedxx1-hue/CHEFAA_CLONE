import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export class IntegrationsAPI {
  private static async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }

  // Integration Management
  static async listAvailableServices() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-management`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'list_available_services' }),
    });
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  }

  static async listUserConnections() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-management`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'list_user_connections' }),
    });
    if (!response.ok) throw new Error('Failed to fetch connections');
    return response.json();
  }

  static async connectService(serviceId: string, consentData: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-management`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'connect_service', serviceId, consentData }),
    });
    if (!response.ok) throw new Error('Failed to connect service');
    return response.json();
  }

  static async disconnectService(serviceId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-management`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'disconnect_service', serviceId }),
    });
    if (!response.ok) throw new Error('Failed to disconnect service');
    return response.json();
  }

  static async syncService(serviceId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-management`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'sync_service', serviceId }),
    });
    if (!response.ok) throw new Error('Failed to sync service');
    return response.json();
  }

  static async getIntegrationStatus() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-management`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'get_integration_status' }),
    });
    if (!response.ok) throw new Error('Failed to get integration status');
    return response.json();
  }

  // FHIR / EHR Integration
  static async syncPatientResource(resourceData: any, sourceSystem: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-fhir`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'sync_patient', resourceData, sourceSystem }),
    });
    if (!response.ok) throw new Error('Failed to sync patient resource');
    return response.json();
  }

  static async getFHIRResources(resourceType?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-fhir`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'get_resources', resourceType }),
    });
    if (!response.ok) throw new Error('Failed to get FHIR resources');
    return response.json();
  }

  static async getPatientSummary() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-fhir`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'get_patient_summary' }),
    });
    if (!response.ok) throw new Error('Failed to get patient summary');
    return response.json();
  }

  // Pharmacy Network Integration
  static async trackPrescription(prescriptionData: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'pharmacy',
        action: 'track_prescription',
        data: prescriptionData,
      }),
    });
    if (!response.ok) throw new Error('Failed to track prescription');
    return response.json();
  }

  static async findNearbyPharmacy(location: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'pharmacy',
        action: 'find_pharmacy',
        data: { location },
      }),
    });
    if (!response.ok) throw new Error('Failed to find pharmacies');
    return response.json();
  }

  static async getUserPrescriptions() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'pharmacy',
        action: 'get_prescriptions',
        data: {},
      }),
    });
    if (!response.ok) throw new Error('Failed to get prescriptions');
    return response.json();
  }

  // Insurance Verification
  static async verifyInsurance(insuranceData: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'insurance',
        action: 'verify_eligibility',
        data: insuranceData,
      }),
    });
    if (!response.ok) throw new Error('Failed to verify insurance');
    return response.json();
  }

  static async checkMedicationCoverage(medicationName: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'insurance',
        action: 'check_coverage',
        data: { medicationName },
      }),
    });
    if (!response.ok) throw new Error('Failed to check coverage');
    return response.json();
  }

  static async getInsuranceInfo() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'insurance',
        action: 'get_insurance_info',
        data: {},
      }),
    });
    if (!response.ok) throw new Error('Failed to get insurance info');
    return response.json();
  }

  // Health Device Integration
  static async syncHealthData(healthData: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'health_device',
        action: 'sync_health_data',
        data: healthData,
      }),
    });
    if (!response.ok) throw new Error('Failed to sync health data');
    return response.json();
  }

  static async getHealthData(filters: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'health_device',
        action: 'get_health_data',
        data: filters,
      }),
    });
    if (!response.ok) throw new Error('Failed to get health data');
    return response.json();
  }

  // Telemedicine Integration
  static async scheduleTelemedicineAppointment(appointmentData: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'telemedicine',
        action: 'schedule_appointment',
        data: appointmentData,
      }),
    });
    if (!response.ok) throw new Error('Failed to schedule appointment');
    return response.json();
  }

  static async getTelemedicineAppointments() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'telemedicine',
        action: 'get_appointments',
        data: {},
      }),
    });
    if (!response.ok) throw new Error('Failed to get appointments');
    return response.json();
  }

  // Laboratory Results Integration
  static async syncLabResults(labData: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'laboratory',
        action: 'sync_lab_results',
        data: labData,
      }),
    });
    if (!response.ok) throw new Error('Failed to sync lab results');
    return response.json();
  }

  static async getLabResults(filters: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-healthcare-hub`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        integrationType: 'laboratory',
        action: 'get_lab_results',
        data: filters,
      }),
    });
    if (!response.ok) throw new Error('Failed to get lab results');
    return response.json();
  }

  // Consent Management
  static async getConsentRecords() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-management`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'get_consent_records' }),
    });
    if (!response.ok) throw new Error('Failed to get consent records');
    return response.json();
  }

  // Audit Logs
  static async getAuditLogs(filters?: { status?: string; serviceId?: string; dateRange?: string }) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/integration-management`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'get_audit_logs', filters }),
    });
    if (!response.ok) throw new Error('Failed to get audit logs');
    return response.json();
  }
}
