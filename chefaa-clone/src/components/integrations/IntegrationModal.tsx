import React, { useState } from 'react';
import { X, Save, Key, Globe, Shield, Database } from 'lucide-react';
import { Integration } from './IntegrationCard';

interface IntegrationModalProps {
  integration: Integration | null;
  isOpen: boolean;
  language: 'en' | 'ar';
  onClose: () => void;
  onSave: (config: any) => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({
  integration,
  isOpen,
  language,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState({
    apiKey: '',
    apiSecret: '',
    endpoint: integration?.api_endpoint || '',
    refreshToken: '',
    clientId: '',
    clientSecret: '',
    consentTypes: [] as string[],
  });

  const [consentOptions] = useState([
    { id: 'read_basic', label: 'Read Basic Information' },
    { id: 'read_health', label: 'Read Health Data' },
    { id: 'read_medications', label: 'Read Medications' },
    { id: 'write_prescriptions', label: 'Write Prescriptions' },
    { id: 'read_lab_results', label: 'Read Lab Results' },
    { id: 'read_insurance', label: 'Read Insurance Information' },
  ]);

  if (!isOpen || !integration) return null;

  const translations = {
    en: {
      title: 'Configure Integration',
      apiCredentials: 'API Credentials',
      apiKey: 'API Key',
      apiSecret: 'API Secret',
      clientId: 'Client ID',
      clientSecret: 'Client Secret',
      endpoint: 'API Endpoint',
      refreshToken: 'Refresh Token',
      consentPermissions: 'Consent Permissions',
      consentDescription: 'Select the data types this integration can access:',
      save: 'Save Configuration',
      cancel: 'Cancel',
      required: 'Required for OAuth 2.0',
      optional: 'Optional',
    },
    ar: {
      title: 'تكوين التكامل',
      apiCredentials: 'بيانات اعتماد API',
      apiKey: 'مفتاح API',
      apiSecret: 'سر API',
      clientId: 'معرف العميل',
      clientSecret: 'سر العميل',
      endpoint: 'نقطة نهاية API',
      refreshToken: 'رمز التحديث',
      consentPermissions: 'أذونات الموافقة',
      consentDescription: 'حدد أنواع البيانات التي يمكن لهذا التكامل الوصول إليها:',
      save: 'حفظ التكوين',
      cancel: 'إلغاء',
      required: 'مطلوب لـ OAuth 2.0',
      optional: 'اختياري',
    },
  };

  const t = translations[language];

  const handleConsentToggle = (consentId: string) => {
    setConfig(prev => ({
      ...prev,
      consentTypes: prev.consentTypes.includes(consentId)
        ? prev.consentTypes.filter(id => id !== consentId)
        : [...prev.consentTypes, consentId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{integration.service_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* API Credentials Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">{t.apiCredentials}</h3>
            </div>

            <div className="space-y-4">
              {/* API Endpoint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  {t.endpoint}
                </label>
                <input
                  type="text"
                  value={config.endpoint}
                  onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.example.com/v1"
                />
              </div>

              {/* Conditional fields based on auth type */}
              {integration.auth_type === 'API Key' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.apiKey}
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk_live_..."
                    required
                  />
                </div>
              )}

              {integration.auth_type === 'OAuth 2.0' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.clientId} <span className="text-xs text-gray-500">({t.required})</span>
                    </label>
                    <input
                      type="text"
                      value={config.clientId}
                      onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.clientSecret} <span className="text-xs text-gray-500">({t.required})</span>
                    </label>
                    <input
                      type="password"
                      value={config.clientSecret}
                      onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.refreshToken} <span className="text-xs text-gray-500">({t.optional})</span>
                    </label>
                    <input
                      type="password"
                      value={config.refreshToken}
                      onChange={(e) => setConfig({ ...config, refreshToken: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Consent Permissions Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">{t.consentPermissions}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t.consentDescription}</p>

            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {consentOptions.map((option) => (
                <label key={option.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.consentTypes.includes(option.id)}
                    onChange={() => handleConsentToggle(option.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Compliance Requirements */}
          {integration.compliance_requirements.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start gap-2">
                <Database className="w-5 h-5 text-blue-700 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Compliance Requirements</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    {integration.compliance_requirements.map((req, idx) => (
                      <li key={idx}>• {req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationModal;
