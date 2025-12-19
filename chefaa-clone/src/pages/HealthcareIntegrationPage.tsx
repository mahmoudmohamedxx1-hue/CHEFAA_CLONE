import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import HealthcareIntegrationAPI from '../lib/HealthcareIntegrationAPI';

interface HealthcareIntegrationPageProps {
  language: 'en' | 'ar';
}

const HealthcareIntegrationPage: React.FC<HealthcareIntegrationPageProps> = ({ language }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [ehrConnections, setEhrConnections] = useState([]);
  const [devices, setDevices] = useState([]);
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [telemedicineSessions, setTelemedicineSessions] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [iotDevices, setIotDevices] = useState([]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadIntegrationData();
    }
  }, [user, activeTab]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUser(user);
  };

  const loadIntegrationData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'overview':
          await loadOverviewData();
          break;
        case 'ehr':
          await loadEHRData();
          break;
        case 'devices':
          await loadDeviceData();
          break;
        case 'monitoring':
          await loadMonitoringData();
          break;
        case 'telemedicine':
          await loadTelemedicineData();
          break;
        case 'labs':
          await loadLabData();
          break;
        case 'iot':
          await loadIoTData();
          break;
      }
    } catch (error: any) {
      console.error('Error loading integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async () => {
    const [ehrResp, devResp, iotResp] = await Promise.all([
      HealthcareIntegrationAPI.getEHRConnections(),
      HealthcareIntegrationAPI.getLatestReadings(),
      HealthcareIntegrationAPI.getIoTDevices(),
    ]);

    setEhrConnections(ehrResp.data?.connections || []);
    setDevices(devResp.data?.latest_readings || []);
    setIotDevices(iotResp.data?.devices || []);
  };

  const loadEHRData = async () => {
    const response = await HealthcareIntegrationAPI.getEHRConnections();
    setEhrConnections(response.data?.connections || []);
  };

  const loadDeviceData = async () => {
    const response = await HealthcareIntegrationAPI.getLatestReadings();
    setDevices(Object.values(response.data?.latest_readings || {}));
  };

  const loadMonitoringData = async () => {
    const response = await HealthcareIntegrationAPI.getMonitoringDashboard();
    setMonitoringData(response.data);
  };

  const loadTelemedicineData = async () => {
    const response = await HealthcareIntegrationAPI.getTelemedicineSessions();
    setTelemedicineSessions(response.data?.sessions || []);
  };

  const loadLabData = async () => {
    const response = await HealthcareIntegrationAPI.getLabResults();
    setLabResults(response.data?.lab_results || []);
  };

  const loadIoTData = async () => {
    const response = await HealthcareIntegrationAPI.getIoTDevices();
    setIotDevices(response.data?.devices || []);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'ehr', label: 'EHR Connections' },
    { id: 'devices', label: 'Medical Devices' },
    { id: 'monitoring', label: 'Real-time Monitoring' },
    { id: 'telemedicine', label: 'Telemedicine' },
    { id: 'labs', label: 'Lab Results' },
    { id: 'iot', label: 'IoT Devices' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab ehrConnections={ehrConnections} devices={devices} iotDevices={iotDevices} />;
      case 'ehr':
        return <EHRConnectionsTab connections={ehrConnections} onRefresh={loadEHRData} />;
      case 'devices':
        return <MedicalDevicesTab devices={devices} onRefresh={loadDeviceData} />;
      case 'monitoring':
        return <RealTimeMonitoringTab monitoringData={monitoringData} onRefresh={loadMonitoringData} />;
      case 'telemedicine':
        return <TelemedicineTab sessions={telemedicineSessions} onRefresh={loadTelemedicineData} />;
      case 'labs':
        return <LabResultsTab results={labResults} onRefresh={loadLabData} />;
      case 'iot':
        return <IoTDevicesTab devices={iotDevices} onRefresh={loadIoTData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Healthcare Integration Hub</h1>
          <p className="text-gray-600">
            Manage connections to EHRs, medical devices, labs, and telemedicine platforms
          </p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading integration data...</span>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<any> = ({ ehrConnections, devices, iotDevices }) => {
  const activeEHR = ehrConnections.filter((c: any) => c.status === 'active').length;
  const activeDevices = devices.length;
  const activeIoT = iotDevices.filter((d: any) => d.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">EHR Connections</h3>
          <p className="text-3xl font-bold text-blue-600">{activeEHR}</p>
          <p className="text-sm text-blue-700 mt-1">Active connections</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-900 mb-2">Medical Devices</h3>
          <p className="text-3xl font-bold text-green-600">{activeDevices}</p>
          <p className="text-sm text-green-700 mt-1">Synced devices</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-900 mb-2">IoT Devices</h3>
          <p className="text-3xl font-bold text-purple-600">{activeIoT}</p>
          <p className="text-sm text-purple-700 mt-1">Connected devices</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Integration dashboard provides real-time connectivity status for all your healthcare systems.
            Navigate to specific tabs to manage individual connections and view detailed data.
          </p>
        </div>
      </div>
    </div>
  );
};

// EHR Connections Tab
const EHRConnectionsTab: React.FC<any> = ({ connections, onRefresh }) => {
  const providerTypes = ['epic', 'cerner', 'allscripts', 'athenahealth', 'advancedmd', 'eclinicalworks'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">EHR System Connections</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providerTypes.map((provider) => {
          const connection = connections.find((c: any) => c.provider_type === provider);
          return (
            <div key={provider} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium capitalize">{provider.replace('_', ' ')}</h4>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    connection?.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {connection?.status || 'Not Connected'}
                </span>
              </div>
              {connection && (
                <div className="text-sm text-gray-600">
                  <p>Last sync: {new Date(connection.last_sync).toLocaleString()}</p>
                  <p className="mt-1">Resources: {connection.data_scope?.length || 0}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Medical Devices Tab
const MedicalDevicesTab: React.FC<any> = ({ devices, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Connected Medical Devices</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device: any, index: number) => (
          <div key={index} className="border rounded-lg p-4">
            <h4 className="font-medium capitalize mb-2">{device.device_type?.replace('_', ' ')}</h4>
            <div className="text-sm text-gray-600">
              <p>Latest: {device.value} {device.unit}</p>
              <p>Measured: {new Date(device.measured_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {devices.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No devices connected. Sync your medical devices to see real-time data.
          </div>
        )}
      </div>
    </div>
  );
};

// Real-time Monitoring Tab
const RealTimeMonitoringTab: React.FC<any> = ({ monitoringData, onRefresh }) => {
  const alertsSummary = monitoringData?.alerts_summary || { critical: 0, warning: 0, normal: 0 };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Real-time Health Monitoring</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="font-medium text-red-900">Critical Alerts</h4>
          <p className="text-2xl font-bold text-red-600 mt-2">{alertsSummary.critical}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-900">Warnings</h4>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{alertsSummary.warning}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900">Normal</h4>
          <p className="text-2xl font-bold text-green-600 mt-2">{alertsSummary.normal}</p>
        </div>
      </div>

      {!monitoringData && (
        <div className="text-center py-8 text-gray-500">
          No monitoring data available. Start recording health metrics to see real-time monitoring.
        </div>
      )}
    </div>
  );
};

// Telemedicine Tab
const TelemedicineTab: React.FC<any> = ({ sessions, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Telemedicine Sessions</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((session: any) => (
          <div key={session.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium capitalize">{session.session_type?.replace('_', ' ')}</h4>
                <p className="text-sm text-gray-600">Platform: {session.platform}</p>
                <p className="text-sm text-gray-600">
                  Scheduled: {new Date(session.scheduled_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  session.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : session.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {session.status}
              </span>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No telemedicine sessions found. Schedule a virtual consultation to get started.
          </div>
        )}
      </div>
    </div>
  );
};

// Lab Results Tab
const LabResultsTab: React.FC<any> = ({ results, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Laboratory Results</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {results.map((result: any) => (
          <div key={result.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{result.test_name}</h4>
                <p className="text-sm text-gray-600">
                  Result: {result.result_value} {result.result_unit}
                </p>
                <p className="text-sm text-gray-600">Lab: {result.performing_lab}</p>
                <p className="text-sm text-gray-600">
                  Date: {new Date(result.resulted_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  result.abnormal_flag === 'critical'
                    ? 'bg-red-100 text-red-800'
                    : result.abnormal_flag === 'high' || result.abnormal_flag === 'low'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {result.abnormal_flag || 'normal'}
              </span>
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No lab results found. Sync with your lab provider to import results.
          </div>
        )}
      </div>
    </div>
  );
};

// IoT Devices Tab
const IoTDevicesTab: React.FC<any> = ({ devices, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Connected IoT Devices</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device: any) => (
          <div key={device.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{device.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{device.category?.replace('_', ' ')}</p>
                <p className="text-sm text-gray-600">{device.brand} - {device.model}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  device.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {device.status}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Battery: {device.battery_level}%</span>
              <span>Last sync: {new Date(device.last_sync).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {devices.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No IoT devices registered. Register your smart health devices to enable tracking.
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthcareIntegrationPage;
