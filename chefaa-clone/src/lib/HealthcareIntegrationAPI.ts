// Healthcare Integration API Client
import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hdcpruwkvarfbdtztzgq.supabase.co';

class HealthcareIntegrationAPI {
  private async callFunction(functionName: string, data: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Healthcare Integration API Error (${functionName}):`, error);
      throw error;
    }
  }

  // Enhanced EHR Integration
  async connectEHR(providerType: string, ehrData: any) {
    return this.callFunction('enhanced-ehr-integration', {
      action: 'connect_ehr',
      provider_type: providerType,
      data: ehrData,
    });
  }

  async disconnectEHR(connectionId: string) {
    return this.callFunction('enhanced-ehr-integration', {
      action: 'disconnect_ehr',
      data: { connection_id: connectionId },
    });
  }

  async syncEHRData(connectionId: string, resources: string[] = []) {
    return this.callFunction('enhanced-ehr-integration', {
      action: 'sync_ehr_data',
      data: { connection_id: connectionId, resources },
    });
  }

  async getEHRConnections() {
    return this.callFunction('enhanced-ehr-integration', {
      action: 'get_ehr_connections',
    });
  }

  async fetchFHIRResource(connectionId: string, resourceType: string, resourceId: string) {
    return this.callFunction('enhanced-ehr-integration', {
      action: 'fetch_fhir_resource',
      data: { connection_id: connectionId, resource_type: resourceType, resource_id: resourceId },
    });
  }

  async searchFHIRResources(connectionId: string, resourceType: string, searchParams: any = {}) {
    return this.callFunction('enhanced-ehr-integration', {
      action: 'search_fhir_resources',
      data: { connection_id: connectionId, resource_type: resourceType, search_params: searchParams },
    });
  }

  // Medical Device Connectivity
  async syncDeviceData(deviceData: any) {
    return this.callFunction('medical-device-connectivity', {
      action: 'sync_device_data',
      data: deviceData,
    });
  }

  async getDeviceReadings(deviceType: string, dateRange: any = {}) {
    return this.callFunction('medical-device-connectivity', {
      action: 'get_device_readings',
      data: { device_type: deviceType, date_range: dateRange },
    });
  }

  async analyzeTrends(deviceType: string, measurementType: string, days: number = 30) {
    return this.callFunction('medical-device-connectivity', {
      action: 'analyze_trends',
      data: { device_type: deviceType, measurement_type: measurementType, days },
    });
  }

  async getLatestReadings() {
    return this.callFunction('medical-device-connectivity', {
      action: 'get_latest_readings',
      data: {},
    });
  }

  async checkThresholds(readings: any[]) {
    return this.callFunction('medical-device-connectivity', {
      action: 'check_thresholds',
      data: { readings },
    });
  }

  // Real-time Monitoring
  async recordMonitoringData(monitoringData: any) {
    return this.callFunction('real-time-monitoring', {
      action: 'record_monitoring_data',
      data: monitoringData,
    });
  }

  async getMonitoringDashboard() {
    return this.callFunction('real-time-monitoring', {
      action: 'get_monitoring_dashboard',
      data: {},
    });
  }

  async getActiveAlerts(alertLevel: string = null) {
    return this.callFunction('real-time-monitoring', {
      action: 'get_active_alerts',
      data: { alert_level: alertLevel },
    });
  }

  async getMonitoringHistory(monitoringType: string, hours: number = 24) {
    return this.callFunction('real-time-monitoring', {
      action: 'get_monitoring_history',
      data: { monitoring_type: monitoringType, hours },
    });
  }

  async updateThresholds(thresholdData: any) {
    return this.callFunction('real-time-monitoring', {
      action: 'update_thresholds',
      data: thresholdData,
    });
  }

  // Telemedicine Integration
  async scheduleTelemedicineSession(sessionData: any) {
    return this.callFunction('telemedicine-integration', {
      action: 'schedule_session',
      data: sessionData,
    });
  }

  async startTelemedicineSession(sessionId: string) {
    return this.callFunction('telemedicine-integration', {
      action: 'start_session',
      data: { session_id: sessionId },
    });
  }

  async endTelemedicineSession(sessionId: string, sessionNotes: any = {}) {
    return this.callFunction('telemedicine-integration', {
      action: 'end_session',
      data: { session_id: sessionId, session_notes: sessionNotes },
    });
  }

  async getTelemedicineSessions(status: string = null) {
    return this.callFunction('telemedicine-integration', {
      action: 'get_sessions',
      data: { status },
    });
  }

  async issuePrescription(sessionId: string, medications: any[]) {
    return this.callFunction('telemedicine-integration', {
      action: 'issue_prescription',
      data: { session_id: sessionId, medications },
    });
  }

  // Laboratory Results Integration
  async syncLabResults(labProvider: string, results: any[]) {
    return this.callFunction('lab-results-integration', {
      action: 'sync_lab_results',
      data: { lab_provider: labProvider, results },
    });
  }

  async getLabResults(filters: any = {}) {
    return this.callFunction('lab-results-integration', {
      action: 'get_lab_results',
      data: filters,
    });
  }

  async getAbnormalLabResults() {
    return this.callFunction('lab-results-integration', {
      action: 'get_abnormal_results',
      data: {},
    });
  }

  async compareLabResults(testName: string, months: number = 12) {
    return this.callFunction('lab-results-integration', {
      action: 'compare_results',
      data: { test_name: testName, months },
    });
  }

  // IoT Device Connectivity
  async registerIoTDevice(deviceData: any) {
    return this.callFunction('iot-device-connectivity', {
      action: 'register_device',
      data: deviceData,
    });
  }

  async updateIoTDeviceStatus(deviceId: string, statusData: any) {
    return this.callFunction('iot-device-connectivity', {
      action: 'update_device_status',
      data: { device_id: deviceId, ...statusData },
    });
  }

  async syncIoTDeviceData(deviceId: string, syncData: any) {
    return this.callFunction('iot-device-connectivity', {
      action: 'sync_device_data',
      data: { device_id: deviceId, ...syncData },
    });
  }

  async getIoTDevices() {
    return this.callFunction('iot-device-connectivity', {
      action: 'get_devices',
      data: {},
    });
  }

  async getAdherenceReport(deviceId: string, days: number = 30) {
    return this.callFunction('iot-device-connectivity', {
      action: 'get_adherence_report',
      data: { device_id: deviceId, days },
    });
  }
}

export default new HealthcareIntegrationAPI();
