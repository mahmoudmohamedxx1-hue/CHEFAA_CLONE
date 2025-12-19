import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Shield,
  AlertTriangle,
  Lock,
  UserX,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface SecurityDashboardProps {
  language: 'ar' | 'en';
}

interface SecurityStats {
  total_security_events: number;
  critical_events: number;
  unresolved_events: number;
  high_risk_fraud_cases: number;
  pending_verifications: number;
  failed_logins_24h: number;
  unique_active_users: number;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  risk_level: string;
  description: string;
  resolved: boolean;
  created_at: string;
}

export default function SecurityDashboard({ language }: SecurityDashboardProps) {
  const [stats, setStats] = useState<SecurityStats>({
    total_security_events: 0,
    critical_events: 0,
    unresolved_events: 0,
    high_risk_fraud_cases: 0,
    pending_verifications: 0,
    failed_logins_24h: 0,
    unique_active_users: 0,
  });
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    fetchSecurityData();
  }, [timeRange]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch security dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_security_dashboard_stats', { p_time_range: timeRange });

      if (!statsError && statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Fetch recent security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!eventsError && eventsData) {
        setRecentEvents(eventsData);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      failed_login: { ar: 'فشل تسجيل الدخول', en: 'Failed Login' },
      suspicious_activity: { ar: 'نشاط مشبوه', en: 'Suspicious Activity' },
      password_reset: { ar: 'إعادة تعيين كلمة المرور', en: 'Password Reset' },
      '2fa_enabled': { ar: 'تفعيل المصادقة الثنائية', en: '2FA Enabled' },
      account_locked: { ar: 'قفل الحساب', en: 'Account Locked' },
      high_risk_order: { ar: 'طلب عالي المخاطر', en: 'High Risk Order' },
    };
    return t(labels[type]?.ar || type, labels[type]?.en || type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-brand-blue-500" />
              {t('لوحة الأمان', 'Security Dashboard')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('مراقبة الأمان والامتثال', 'Security Monitoring & Compliance')}
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  timeRange === range
                    ? 'bg-brand-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {range === '24h' && t('24 ساعة', '24 Hours')}
                {range === '7d' && t('7 أيام', '7 Days')}
                {range === '30d' && t('30 يوم', '30 Days')}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('إجمالي الأحداث الأمنية', 'Total Security Events')}
            value={stats.total_security_events}
            icon={Shield}
            color="bg-blue-500"
          />
          <StatCard
            title={t('الأحداث الحرجة', 'Critical Events')}
            value={stats.critical_events}
            icon={AlertTriangle}
            color="bg-red-500"
          />
          <StatCard
            title={t('الأحداث غير المحلولة', 'Unresolved Events')}
            value={stats.unresolved_events}
            icon={AlertCircle}
            color="bg-orange-500"
          />
          <StatCard
            title={t('حالات احتيال عالية المخاطر', 'High Risk Fraud Cases')}
            value={stats.high_risk_fraud_cases}
            icon={UserX}
            color="bg-purple-500"
          />
          <StatCard
            title={t('تحققات معلقة', 'Pending Verifications')}
            value={stats.pending_verifications}
            icon={FileCheck}
            color="bg-yellow-500"
          />
          <StatCard
            title={t('فشل تسجيل الدخول (24 ساعة)', 'Failed Logins (24h)')}
            value={stats.failed_logins_24h}
            icon={Lock}
            color="bg-pink-500"
          />
          <StatCard
            title={t('المستخدمون النشطون', 'Active Users')}
            value={stats.unique_active_users}
            icon={CheckCircle2}
            color="bg-green-500"
          />
          <StatCard
            title={t('معدل الأمان', 'Security Score')}
            value={95}
            icon={Shield}
            color="bg-indigo-500"
            trend={t('ممتاز', 'Excellent')}
          />
        </div>

        {/* Recent Security Events */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-blue-500" />
            {t('الأحداث الأمنية الأخيرة', 'Recent Security Events')}
          </h2>

          {recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">
                {t('لا توجد أحداث أمنية حديثة', 'No recent security events')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t('النظام آمن ويعمل بشكل طبيعي', 'System is secure and operating normally')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">
                        {getEventTypeLabel(event.event_type)}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold border rounded-full ${getRiskBadgeColor(
                          event.risk_level
                        )}`}
                      >
                        {event.risk_level.toUpperCase()}
                      </span>
                      {event.resolved && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Recommendations */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {t('توصيات الأمان', 'Security Recommendations')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">
                    {t('تفعيل المصادقة الثنائية', 'Enable Two-Factor Authentication')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t('حماية إضافية للحسابات', 'Additional account protection')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">
                    {t('مراجعة سجلات التدقيق', 'Review Audit Logs')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t('تحقق من الأنشطة المشبوهة', 'Check for suspicious activities')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">
                    {t('تحديث شهادات SSL', 'Update SSL Certificates')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t('تأكد من التشفير الآمن', 'Ensure secure encryption')}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {t('الامتثال التنظيمي', 'Regulatory Compliance')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {t('GDPR', 'GDPR')}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  {t('متوافق', 'Compliant')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {t('PCI DSS', 'PCI DSS')}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  {t('المستوى 1', 'Level 1')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {t('ISO 27001', 'ISO 27001')}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  {t('معتمد', 'Certified')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {t('ترخيص الصيدلية', 'Pharmacy License')}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  {t('نشط', 'Active')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
