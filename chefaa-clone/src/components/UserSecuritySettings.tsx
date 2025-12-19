import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorSetup from './TwoFactorSetup';
import SecurityEventsDisplay from './SecurityEventsDisplay';
import GDPRDataRequest from './GDPRDataRequest';

type UserSecuritySettingsProps = {
  language?: 'ar' | 'en';
};

export default function UserSecuritySettings({ language = 'en' }: UserSecuritySettingsProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | '2fa' | 'events' | 'gdpr'>('overview');

  const isRTL = language === 'ar';

  const t = {
    en: {
      title: 'Security & Privacy',
      subtitle: 'Manage your security settings and privacy preferences',
      overview: 'Overview',
      twoFactor: 'Two-Factor Auth',
      securityEvents: 'Security Events',
      gdprData: 'Data & Privacy',
      accountSecurity: 'Account Security',
      accountSecurityDesc: 'Protect your account with additional security measures',
      enable2FA: 'Enable 2FA for enhanced security',
      threatMonitoring: 'Threat Monitoring',
      threatMonitoringDesc: 'AI-powered detection of suspicious activities',
      dataPrivacy: 'Data Privacy & GDPR',
      dataPrivacyDesc: 'Exercise your rights under data protection regulations',
      notLoggedIn: 'Please log in to access security settings',
    },
    ar: {
      title: 'الأمان والخصوصية',
      subtitle: 'إدارة إعدادات الأمان وتفضيلات الخصوصية',
      overview: 'نظرة عامة',
      twoFactor: 'المصادقة الثنائية',
      securityEvents: 'أحداث الأمان',
      gdprData: 'البيانات والخصوصية',
      accountSecurity: 'أمان الحساب',
      accountSecurityDesc: 'حماية حسابك بإجراءات أمان إضافية',
      enable2FA: 'تفعيل المصادقة الثنائية لمزيد من الأمان',
      threatMonitoring: 'مراقبة التهديدات',
      threatMonitoringDesc: 'كشف الأنشطة المشبوهة بواسطة الذكاء الاصطناعي',
      dataPrivacy: 'خصوصية البيانات و GDPR',
      dataPrivacyDesc: 'ممارسة حقوقك بموجب لوائح حماية البيانات',
      notLoggedIn: 'يرجى تسجيل الدخول للوصول إلى إعدادات الأمان',
    },
  };

  const text = t[language];

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{text.notLoggedIn}</h2>
      </div>
    );
  }

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{text.title}</h1>
        <p className="text-gray-600">{text.subtitle}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveSection('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {text.overview}
            </button>
            <button
              onClick={() => setActiveSection('2fa')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === '2fa'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {text.twoFactor}
            </button>
            <button
              onClick={() => setActiveSection('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'events'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {text.securityEvents}
            </button>
            <button
              onClick={() => setActiveSection('gdpr')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'gdpr'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {text.gdprData}
            </button>
          </nav>
        </div>
      </div>

      {/* Content Sections */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Security Card */}
          <div
            onClick={() => setActiveSection('2fa')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{text.accountSecurity}</h3>
            <p className="text-gray-600 mb-4">{text.accountSecurityDesc}</p>
            <div className="flex items-center text-sm text-blue-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {text.enable2FA}
            </div>
          </div>

          {/* Threat Monitoring Card */}
          <div
            onClick={() => setActiveSection('events')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{text.threatMonitoring}</h3>
            <p className="text-gray-600 mb-4">{text.threatMonitoringDesc}</p>
            <div className="flex items-center text-sm text-orange-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              View security events
            </div>
          </div>

          {/* Data Privacy Card */}
          <div
            onClick={() => setActiveSection('gdpr')}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{text.dataPrivacy}</h3>
            <p className="text-gray-600 mb-4">{text.dataPrivacyDesc}</p>
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Manage your data
            </div>
          </div>

          {/* Account Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Account Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Created:</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === '2fa' && <TwoFactorSetup />}
      {activeSection === 'events' && <SecurityEventsDisplay />}
      {activeSection === 'gdpr' && <GDPRDataRequest />}
    </div>
  );
}
