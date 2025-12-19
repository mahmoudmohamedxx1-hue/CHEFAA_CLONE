import React from 'react';
import { Activity, CheckCircle, XCircle, Settings, RefreshCw } from 'lucide-react';

export interface Integration {
  id: string;
  service_name: string;
  category: string;
  description: string;
  api_endpoint?: string;
  auth_type: string;
  compliance_requirements: string[];
  data_types_supported: string[];
  isConnected?: boolean;
  lastSync?: string;
  status?: 'active' | 'inactive' | 'error';
}

interface IntegrationCardProps {
  integration: Integration;
  language: 'en' | 'ar';
  onConnect: (integration: Integration) => void;
  onDisconnect: (integration: Integration) => void;
  onConfigure: (integration: Integration) => void;
  onSync: (integration: Integration) => void;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'EHR/FHIR': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Pharmacy Network': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Insurance Verification': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Health Devices': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Telemedicine': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Laboratory Results': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  language,
  onConnect,
  onDisconnect,
  onConfigure,
  onSync,
}) => {
  const categoryStyle = categoryColors[integration.category] || { 
    bg: 'bg-gray-50', 
    text: 'text-gray-700', 
    border: 'border-gray-200' 
  };

  const isRTL = language === 'ar';

  const translations = {
    en: {
      connect: 'Connect',
      disconnect: 'Disconnect',
      configure: 'Configure',
      sync: 'Sync Now',
      connected: 'Connected',
      disconnected: 'Disconnected',
      error: 'Error',
      lastSync: 'Last sync:',
      authType: 'Auth:',
      compliance: 'Compliance:',
      dataTypes: 'Data Types:',
      never: 'Never',
    },
    ar: {
      connect: 'اتصال',
      disconnect: 'قطع الاتصال',
      configure: 'تكوين',
      sync: 'مزامنة الآن',
      connected: 'متصل',
      disconnected: 'غير متصل',
      error: 'خطأ',
      lastSync: 'آخر مزامنة:',
      authType: 'المصادقة:',
      compliance: 'الامتثال:',
      dataTypes: 'أنواع البيانات:',
      never: 'أبداً',
    },
  };

  const t = translations[language];

  const getStatusBadge = () => {
    if (!integration.isConnected) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          {t.disconnected}
        </span>
      );
    }

    if (integration.status === 'error') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          {t.error}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        {t.connected}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{integration.service_name}</h3>
              {getStatusBadge()}
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
              {integration.category}
            </span>
          </div>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {integration.description}
        </p>

        {/* Metadata */}
        <div className="space-y-2 mb-4 text-xs text-gray-500">
          {integration.lastSync && (
            <div className="flex items-center gap-2">
              <span className="font-medium">{t.lastSync}</span>
              <span>{new Date(integration.lastSync).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium">{t.authType}</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded">{integration.auth_type}</span>
          </div>
        </div>

        {/* Compliance Tags */}
        {integration.compliance_requirements && integration.compliance_requirements.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {integration.compliance_requirements.map((req, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {!integration.isConnected ? (
            <button
              onClick={() => onConnect(integration)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {t.connect}
            </button>
          ) : (
            <>
              <button
                onClick={() => onSync(integration)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-md hover:bg-green-100 transition-colors border border-green-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t.sync}
              </button>
              <button
                onClick={() => onConfigure(integration)}
                className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDisconnect(integration)}
                className="inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-md hover:bg-red-100 transition-colors border border-red-200"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationCard;
