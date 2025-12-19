import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { IntegrationsAPI } from '../api/IntegrationsAPI';
import IntegrationCard, { Integration } from '../components/integrations/IntegrationCard';
import IntegrationModal from '../components/integrations/IntegrationModal';
import ConsentManager from '../components/integrations/ConsentManager';
import IntegrationAuditLog from '../components/integrations/IntegrationAuditLog';
import { Link2, Shield, FileText, Grid, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface IntegrationsPageProps {
  language: 'en' | 'ar';
}

const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ language }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'integrations' | 'consent' | 'audit'>('integrations');
  const [availableServices, setAvailableServices] = useState<Integration[]>([]);
  const [userConnections, setUserConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [integrationStatus, setIntegrationStatus] = useState<any>({ total: 0, connected: 0, errors: 0 });

  const translations = {
    en: {
      title: 'Healthcare Integration & API Ecosystem',
      description: 'Connect and manage integrations with healthcare systems, pharmacies, insurance providers, and health devices.',
      tabIntegrations: 'Integrations',
      tabConsent: 'Consent Management',
      tabAudit: 'Audit Log',
      categories: 'Categories',
      allCategories: 'All Categories',
      ehrFhir: 'EHR/FHIR',
      pharmacyNetwork: 'Pharmacy Network',
      insuranceVerification: 'Insurance Verification',
      healthDevices: 'Health Devices',
      telemedicine: 'Telemedicine',
      laboratoryResults: 'Laboratory Results',
      statusOverview: 'Status Overview',
      totalIntegrations: 'Total Integrations',
      connectedServices: 'Connected Services',
      erroredConnections: 'Errors',
      noIntegrations: 'No integrations available',
      loading: 'Loading integrations...',
      errorLoading: 'Failed to load integrations',
      connectSuccess: 'Integration connected successfully',
      disconnectSuccess: 'Integration disconnected successfully',
      syncSuccess: 'Data synchronized successfully',
      confirmDisconnect: 'Are you sure you want to disconnect this integration? You can reconnect it later.',
      hipaaCompliant: 'HIPAA Compliant',
      oauth2: 'OAuth 2.0 Secured',
    },
    ar: {
      title: 'نظام التكامل الصحي وواجهات برمجة التطبيقات',
      description: 'الاتصال وإدارة التكاملات مع الأنظمة الصحية والصيدليات ومقدمي التأمين والأجهزة الصحية.',
      tabIntegrations: 'التكاملات',
      tabConsent: 'إدارة الموافقة',
      tabAudit: 'سجل التدقيق',
      categories: 'الفئات',
      allCategories: 'جميع الفئات',
      ehrFhir: 'السجلات الصحية الإلكترونية/FHIR',
      pharmacyNetwork: 'شبكة الصيدليات',
      insuranceVerification: 'التحقق من التأمين',
      healthDevices: 'الأجهزة الصحية',
      telemedicine: 'الطب عن بعد',
      laboratoryResults: 'نتائج المختبرات',
      statusOverview: 'نظرة عامة على الحالة',
      totalIntegrations: 'إجمالي التكاملات',
      connectedServices: 'الخدمات المتصلة',
      erroredConnections: 'الأخطاء',
      noIntegrations: 'لا توجد تكاملات متاحة',
      loading: 'تحميل التكاملات...',
      errorLoading: 'فشل تحميل التكاملات',
      connectSuccess: 'تم توصيل التكامل بنجاح',
      disconnectSuccess: 'تم فصل التكامل بنجاح',
      syncSuccess: 'تمت مزامنة البيانات بنجاح',
      confirmDisconnect: 'هل أنت متأكد أنك تريد فصل هذا التكامل؟ يمكنك إعادة توصيله لاحقًا.',
      hipaaCompliant: 'متوافق مع HIPAA',
      oauth2: 'محمي بـ OAuth 2.0',
    },
  };

  const t = translations[language];

  const categoryOptions = [
    { value: 'all', label: t.allCategories },
    { value: 'EHR/FHIR', label: t.ehrFhir },
    { value: 'Pharmacy Network', label: t.pharmacyNetwork },
    { value: 'Insurance Verification', label: t.insuranceVerification },
    { value: 'Health Devices', label: t.healthDevices },
    { value: 'Telemedicine', label: t.telemedicine },
    { value: 'Laboratory Results', label: t.laboratoryResults },
  ];

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadIntegrations();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUser(user);
  };

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available services and user connections in parallel
      const [servicesResponse, connectionsResponse, statusResponse] = await Promise.all([
        IntegrationsAPI.listAvailableServices(),
        IntegrationsAPI.listUserConnections(),
        IntegrationsAPI.getIntegrationStatus(),
      ]);

      // Process services data
      const services = servicesResponse.services || [];
      const connections = connectionsResponse.connections || [];

      // Merge services with connection status
      const mergedIntegrations = services.map((service: any) => {
        const connection = connections.find((c: any) => c.service_id === service.id);
        return {
          ...service,
          isConnected: !!connection,
          lastSync: connection?.last_sync_at,
          status: connection?.status || 'inactive',
        };
      });

      setAvailableServices(mergedIntegrations);
      setUserConnections(connections);
      setIntegrationStatus({
        total: services.length,
        connected: connections.filter((c: any) => c.status === 'active').length,
        errors: connections.filter((c: any) => c.status === 'error').length,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(t.confirmDisconnect)) return;

    try {
      await IntegrationsAPI.disconnectService(integration.id);
      await loadIntegrations();
      toast.success(t.disconnectSuccess);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  const handleSync = async (integration: Integration) => {
    try {
      await IntegrationsAPI.syncService(integration.id);
      await loadIntegrations();
      toast.success(t.syncSuccess);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleSaveConfig = async (config: any) => {
    if (!selectedIntegration) return;

    try {
      await IntegrationsAPI.connectService(selectedIntegration.id, config);
      setIsModalOpen(false);
      setSelectedIntegration(null);
      await loadIntegrations();
      toast.success(t.connectSuccess);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const filteredIntegrations = categoryFilter === 'all' 
    ? availableServices 
    : availableServices.filter(s => s.category === categoryFilter);

  const renderContent = () => {
    switch (activeTab) {
      case 'integrations':
        return (
          <>
            {/* Status Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t.totalIntegrations}</p>
                    <p className="text-3xl font-bold text-gray-900">{integrationStatus.total}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Grid className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t.connectedServices}</p>
                    <p className="text-3xl font-bold text-green-600">{integrationStatus.connected}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t.erroredConnections}</p>
                    <p className="text-3xl font-bold text-red-600">{integrationStatus.errors}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-700">{t.categories}:</span>
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCategoryFilter(option.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      categoryFilter === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Integrations Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">{t.loading}</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
                {t.errorLoading}: {error}
              </div>
            ) : filteredIntegrations.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center text-gray-600">
                {t.noIntegrations}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    language={language}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onConfigure={handleConfigure}
                    onSync={handleSync}
                  />
                ))}
              </div>
            )}
          </>
        );

      case 'consent':
        return <ConsentManager language={language} userId={user?.id || ''} />;

      case 'audit':
        return <IntegrationAuditLog language={language} userId={user?.id || ''} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.description}</p>

          {/* Compliance Badges */}
          <div className="flex gap-3 mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              <Shield className="w-3 h-3 mr-1" />
              {t.hipaaCompliant}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <Link2 className="w-3 h-3 mr-1" />
              {t.oauth2}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('integrations')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'integrations'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                {t.tabIntegrations}
              </button>
              <button
                onClick={() => setActiveTab('consent')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'consent'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                {t.tabConsent}
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'audit'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                {t.tabAudit}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <IntegrationModal
        integration={selectedIntegration}
        isOpen={isModalOpen}
        language={language}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIntegration(null);
        }}
        onSave={handleSaveConfig}
      />
    </div>
  );
};

export default IntegrationsPage;
