import React, { useState, useEffect } from 'react';
import { FileText, Filter, Download, Search, AlertCircle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { IntegrationsAPI } from '../../api/IntegrationsAPI';
import { useToast } from '../../hooks/use-toast';

interface AuditLog {
  id: string;
  user_id: string;
  service_id: string;
  service_name?: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure' | 'warning';
  metadata?: any;
  created_at: string;
}

interface IntegrationAuditLogProps {
  language: 'en' | 'ar';
  userId: string;
}

const IntegrationAuditLog: React.FC<IntegrationAuditLogProps> = ({ language, userId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure' | 'warning'>('all');
  const [dateRange, setDateRange] = useState<'all' | '24h' | '7d' | '30d'>('7d');
  const { toast } = useToast();

  const translations = {
    en: {
      title: 'Integration Audit Log',
      description: 'Complete audit trail of all healthcare integration activities and data access.',
      action: 'Action',
      service: 'Service',
      status: 'Status',
      timestamp: 'Timestamp',
      ipAddress: 'IP Address',
      details: 'Details',
      search: 'Search logs...',
      filterByStatus: 'Filter by Status',
      dateRange: 'Date Range',
      all: 'All',
      success: 'Success',
      failure: 'Failure',
      warning: 'Warning',
      last24h: 'Last 24 Hours',
      last7d: 'Last 7 Days',
      last30d: 'Last 30 Days',
      exportLogs: 'Export Logs',
      noLogs: 'No audit logs found',
      loading: 'Loading audit logs...',
      errorLoading: 'Failed to load audit logs',
      showing: 'Showing',
      of: 'of',
      logs: 'logs',
    },
    ar: {
      title: 'سجل التدقيق للتكامل',
      description: 'مسار تدقيق كامل لجميع أنشطة التكامل الصحي والوصول إلى البيانات.',
      action: 'الإجراء',
      service: 'الخدمة',
      status: 'الحالة',
      timestamp: 'الوقت',
      ipAddress: 'عنوان IP',
      details: 'التفاصيل',
      search: 'بحث في السجلات...',
      filterByStatus: 'تصفية حسب الحالة',
      dateRange: 'نطاق التاريخ',
      all: 'الكل',
      success: 'نجاح',
      failure: 'فشل',
      warning: 'تحذير',
      last24h: 'آخر 24 ساعة',
      last7d: 'آخر 7 أيام',
      last30d: 'آخر 30 يومًا',
      exportLogs: 'تصدير السجلات',
      noLogs: 'لم يتم العثور على سجلات تدقيق',
      loading: 'تحميل سجلات التدقيق...',
      errorLoading: 'فشل تحميل سجلات التدقيق',
      showing: 'عرض',
      of: 'من',
      logs: 'سجلات',
    },
  };

  const t = translations[language];

  const actionLabels: Record<string, { en: string; ar: string }> = {
    connect: { en: 'Service Connected', ar: 'تم توصيل الخدمة' },
    disconnect: { en: 'Service Disconnected', ar: 'تم فصل الخدمة' },
    sync: { en: 'Data Synchronized', ar: 'تمت مزامنة البيانات' },
    read: { en: 'Data Read', ar: 'قراءة البيانات' },
    write: { en: 'Data Written', ar: 'كتابة البيانات' },
    update: { en: 'Configuration Updated', ar: 'تم تحديث التكوين' },
    consent_granted: { en: 'Consent Granted', ar: 'تم منح الموافقة' },
    consent_revoked: { en: 'Consent Revoked', ar: 'تم إلغاء الموافقة' },
    auth_success: { en: 'Authentication Success', ar: 'نجح المصادقة' },
    auth_failure: { en: 'Authentication Failed', ar: 'فشلت المصادقة' },
  };

  useEffect(() => {
    loadAuditLogs();
  }, [userId, statusFilter, dateRange]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await IntegrationsAPI.getAuditLogs({
        status: statusFilter,
        dateRange: dateRange,
      });

      setLogs(response.logs || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error loading audit logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by search term (status and date range already filtered by API)
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.includes(searchTerm)
      );
    }

    setFilteredLogs(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-100 text-green-800',
      failure: 'bg-red-100 text-red-800',
      warning: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {t[status as keyof typeof t] || status}
      </span>
    );
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Service', 'Action', 'Status', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.service_name,
        log.action,
        log.status,
        log.ip_address || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integration-audit-log-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          {t.errorLoading}: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
            </div>
            <p className="text-sm text-gray-600">{t.description}</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t.exportLogs}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.search}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.all}</option>
              <option value="success">{t.success}</option>
              <option value="failure">{t.failure}</option>
              <option value="warning">{t.warning}</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.all}</option>
              <option value="24h">{t.last24h}</option>
              <option value="7d">{t.last7d}</option>
              <option value="30d">{t.last30d}</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          {t.showing} {filteredLogs.length} {t.of} {logs.length} {t.logs}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.status}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.service}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.action}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.timestamp}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.ipAddress}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.details}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {t.noLogs}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.service_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {actionLabels[log.action]?.[language] || log.action}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {log.ip_address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.metadata ? (
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        title={JSON.stringify(log.metadata)}
                      >
                        View
                      </button>
                    ) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IntegrationAuditLog;
