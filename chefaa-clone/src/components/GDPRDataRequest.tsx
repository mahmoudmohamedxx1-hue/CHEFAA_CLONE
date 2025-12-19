import React, { useState, useEffect } from 'react';
import { SecurityAPI } from '../lib/securityAPI';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Alert } from './ui/alert';

export default function GDPRDataRequest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [processingActivities, setProcessingActivities] = useState<Array<{
    activity_type: string;
    purpose: string;
    legal_basis: string;
    retention_period: string;
  }>>([]);
  
  const [erasureReason, setErasureReason] = useState('');
  const [activeTab, setActiveTab] = useState<'access' | 'erasure' | 'consents' | 'processing'>('access');

  useEffect(() => {
    if (user) {
      loadGDPRData();
    }
  }, [user]);

  const loadGDPRData = async () => {
    try {
      setLoading(true);
      
      const [consentsData, activitiesData] = await Promise.all([
        SecurityAPI.getConsentStatus(),
        SecurityAPI.getDataProcessingActivities(),
      ]);
      
      setConsents(consentsData.consents || {});
      setProcessingActivities(activitiesData.activities || []);
    } catch (err: any) {
      console.error('Failed to load GDPR data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await SecurityAPI.requestDataExport();
      
      setSuccess(`Data export requested successfully. Request ID: ${result.request_id}. You will receive an email when your data is ready to download.`);
    } catch (err: any) {
      setError(err.message || 'Failed to request data export');
    } finally {
      setLoading(false);
    }
  };

  const handleDataErasure = async () => {
    if (!erasureReason.trim()) {
      setError('Please provide a reason for data erasure');
      return;
    }

    if (!window.confirm('Are you sure you want to request data erasure? This action cannot be undone and will permanently delete your account and data.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await SecurityAPI.requestDataErasure(erasureReason);
      
      setSuccess(`Data erasure requested successfully. Request ID: ${result.request_id}. Our team will review your request within 30 days.`);
      setErasureReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to request data erasure');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentUpdate = async (consentType: string, granted: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      await SecurityAPI.updateConsent(consentType, granted);
      
      setConsents(prev => ({ ...prev, [consentType]: granted }));
      setSuccess(`Consent updated successfully`);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update consent');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">Please log in to access GDPR data management</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">GDPR Data Management</h2>
      <p className="text-gray-600 mb-6">
        Exercise your rights under the General Data Protection Regulation (GDPR)
      </p>

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('access')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'access'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Data Access
        </button>
        <button
          onClick={() => setActiveTab('erasure')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'erasure'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Data Erasure
        </button>
        <button
          onClick={() => setActiveTab('consents')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'consents'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Consents
        </button>
        <button
          onClick={() => setActiveTab('processing')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'processing'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Processing Activities
        </button>
      </div>

      {/* Data Access Tab */}
      {activeTab === 'access' && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Right to Access</h3>
            <p className="text-sm text-blue-800">
              You have the right to obtain a copy of your personal data that we process. This includes:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
              <li>Personal information (name, email, phone)</li>
              <li>Order history and prescriptions</li>
              <li>Medical records and health data</li>
              <li>Communication preferences</li>
              <li>Account activity logs</li>
            </ul>
          </div>

          <Button
            onClick={handleDataExport}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Requesting...' : 'Request My Data Export'}
          </Button>

          <p className="text-xs text-gray-500">
            We will provide your data in a structured, commonly used, and machine-readable format (JSON) within 30 days.
          </p>
        </div>
      )}

      {/* Data Erasure Tab */}
      {activeTab === 'erasure' && (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-900 mb-2">Right to Erasure ("Right to be Forgotten")</h3>
            <p className="text-sm text-red-800">
              You have the right to request deletion of your personal data. Please note:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
              <li>This action will permanently delete your account and data</li>
              <li>Some data may be retained for legal compliance (e.g., tax records)</li>
              <li>Erasure requests are reviewed within 30 days</li>
              <li>You will lose access to all services immediately</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Reason for data erasure (required)
            </label>
            <Textarea
              value={erasureReason}
              onChange={(e) => setErasureReason(e.target.value)}
              placeholder="Please explain why you want to delete your data..."
              rows={4}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleDataErasure}
            disabled={loading || !erasureReason.trim()}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Requesting...' : 'Request Data Erasure'}
          </Button>
        </div>
      )}

      {/* Consents Tab */}
      {activeTab === 'consents' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Manage your consent preferences for data processing activities
          </p>

          <div className="space-y-3">
            {Object.entries(consents).map(([type, granted]) => (
              <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium capitalize">{type.replace(/_/g, ' ')}</h4>
                  <p className="text-sm text-gray-600">
                    {getConsentDescription(type)}
                  </p>
                </div>
                <button
                  onClick={() => handleConsentUpdate(type, !granted)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    granted
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {granted ? 'Granted' : 'Denied'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Activities Tab */}
      {activeTab === 'processing' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Here's how we process your data and the legal basis for each activity
          </p>

          <div className="space-y-3">
            {processingActivities.map((activity, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{activity.activity_type}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Purpose:</span>
                    <p className="text-gray-600">{activity.purpose}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Legal Basis:</span>
                    <p className="text-gray-600">{activity.legal_basis}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Retention Period:</span>
                    <p className="text-gray-600">{activity.retention_period}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function getConsentDescription(type: string): string {
  const descriptions: Record<string, string> = {
    marketing_emails: 'Receive promotional emails and special offers',
    analytics: 'Allow us to analyze your usage to improve our services',
    personalization: 'Enable personalized product recommendations',
    third_party_sharing: 'Share data with trusted partners for service delivery',
  };
  return descriptions[type] || 'Manage this consent preference';
}
