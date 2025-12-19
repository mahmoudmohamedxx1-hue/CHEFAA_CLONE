import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Activity, TrendingUp, Users, DollarSign, Heart, AlertTriangle,
  Download, RefreshCw, Clock, Target, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { analyticsAPI } from '../api/analyticsAPI';
import { useToast } from '../hooks/use-toast';

// Define proper types for chart data
interface ChartDataPoint {
  timestamp?: string;
  time?: string;
  count?: number;
  requests?: number;
  action?: string;
  category?: string;
  month?: string;
  predicted_revenue?: number;
  confidence?: number;
  outcome_type?: string;
  improvement_rate?: number;
  [key: string]: any;
}

interface PieDataPoint {
  outcome_type: string;
  improvement_rate: number;
  [key: string]: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

type AnalyticsDashboardPageProps = {
  language?: 'ar' | 'en';
};

export default function AnalyticsDashboardPage({ language = 'en' }: AnalyticsDashboardPageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [platformMetrics, setPlatformMetrics] = useState<any>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [healthcareMetrics, setHealthcareMetrics] = useState<any>(null);
  const [financialMetrics, setFinancialMetrics] = useState<any>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<any>(null);
  const [predictiveData, setPredictiveData] = useState<ChartDataPoint[] | null>(null);

  const isRTL = language === 'ar';

  // Fetch data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboard, platform, users, healthcare, financial, realtime] = await Promise.all([
        analyticsAPI.getDashboardOverview(timeRange),
        analyticsAPI.getPlatformMetrics(timeRange),
        analyticsAPI.getUserAnalytics(timeRange === '24h' ? '7d' : '30d'),
        analyticsAPI.getHealthcareMetrics('30d'),
        analyticsAPI.getFinancialMetrics('30d'),
        analyticsAPI.monitorSystemPerformance(),
      ]);

      setDashboardData(dashboard);
      setPlatformMetrics(platform);
      setUserAnalytics(users);
      setHealthcareMetrics(healthcare);
      setFinancialMetrics(financial);
      setRealtimeMetrics(realtime);
    } catch (error: any) {
      toast.error(error.message || (isRTL ? 'فشل في تحميل بيانات التحليلات' : 'Failed to load analytics data'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictiveData = async () => {
    try {
      const revenue = await analyticsAPI.forecastRevenue(6);
      setPredictiveData(revenue);
    } catch (error: any) {
      console.error('Predictive analytics error:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchPredictiveData();
  }, [timeRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

  const handleExport = async (format: 'csv' | 'pdf' | 'excel' | 'json') => {
    try {
      const blob = await analyticsAPI.exportAnalyticsData(format, activeTab);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${activeTab}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(isRTL ? 'تم التصدير بنجاح - تم تنزيل الملف' : 'Export Successful - File downloaded successfully');
    } catch (error: any) {
      toast.error(isRTL ? `خطأ في التصدير: ${error.message}` : `Export Error: ${error.message}`);
    }
  };

  // Overview Tab Content
  const OverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* KPI Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isRTL ? 'إجمالي الأحداث' : 'Total Events'}
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData?.total_events || 0}</div>
          <p className="text-xs text-muted-foreground">
            {isRTL ? 'في الـ 24 ساعة الماضية' : 'Last 24 hours'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isRTL ? 'المستخدمون النشطون' : 'Active Users'}
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{realtimeMetrics?.current_active_users || 0}</div>
          <p className="text-xs text-muted-foreground">
            {isRTL ? 'الآن' : 'Currently online'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isRTL ? 'الإيرادات' : 'Revenue'}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${financialMetrics?.total_revenue || 0}</div>
          <p className="text-xs text-muted-foreground">
            +{financialMetrics?.revenue_growth || 0}% {isRTL ? 'من الشهر الماضي' : 'from last month'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {isRTL ? 'صحة النظام' : 'System Health'}
          </CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{realtimeMetrics?.system_health || 'healthy'}</div>
          <p className="text-xs text-muted-foreground">
            {platformMetrics?.avg_response_time || 0}ms {isRTL ? 'متوسط الاستجابة' : 'avg response'}
          </p>
        </CardContent>
      </Card>

      {/* Recent Events Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>{isRTL ? 'الأحداث الأخيرة' : 'Recent Events'}</CardTitle>
          <CardDescription>{isRTL ? 'الأحداث على مدار الوقت' : 'Events over time'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData?.recent_events || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* System Performance Chart */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>{isRTL ? 'أداء النظام' : 'System Performance'}</CardTitle>
          <CardDescription>{isRTL ? 'الطلبات في الدقيقة' : 'Requests per minute'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={platformMetrics?.performance_data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="requests" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  // User Behavior Tab
  const UserBehaviorTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'تحليل المستخدمين' : 'User Analytics'}</CardTitle>
          <CardDescription>{isRTL ? 'نظرة عامة على المستخدم' : 'User overview'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'إجمالي المستخدمين' : 'Total Users'}</span>
            <span className="text-2xl font-bold">{userAnalytics?.total_users || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'المستخدمون النشطون اليوم' : 'Active Users Today'}</span>
            <span className="text-2xl font-bold">{userAnalytics?.active_users_today || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'مستخدمون جدد هذا الأسبوع' : 'New Users This Week'}</span>
            <span className="text-2xl font-bold">{userAnalytics?.new_users_this_week || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'معدل الاحتفاظ' : 'Retention Rate'}</span>
            <span className="text-2xl font-bold">{userAnalytics?.user_retention_rate || 0}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'أهم إجراءات المستخدم' : 'Top User Actions'}</CardTitle>
          <CardDescription>{isRTL ? 'الإجراءات الأكثر شيوعًا' : 'Most common actions'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userAnalytics?.top_user_actions || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="action" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  // Healthcare Outcomes Tab
  const HealthcareTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'مقاييس الرعاية الصحية' : 'Healthcare Metrics'}</CardTitle>
          <CardDescription>{isRTL ? 'نظرة عامة على المرضى' : 'Patient overview'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'إجمالي المرضى' : 'Total Patients'}</span>
            <span className="text-2xl font-bold">{healthcareMetrics?.total_patients || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'الوصفات المحملة' : 'Prescriptions Uploaded'}</span>
            <span className="text-2xl font-bold">{healthcareMetrics?.prescriptions_uploaded || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'معدل الالتزام بالأدوية' : 'Medication Adherence'}</span>
            <span className="text-2xl font-bold">{healthcareMetrics?.medication_adherence_rate || 0}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'النتائج السريرية' : 'Clinical Outcomes'}</CardTitle>
          <CardDescription>{isRTL ? 'التحسن حسب النوع' : 'Improvement by type'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={healthcareMetrics?.clinical_outcomes || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: PieDataPoint) => `${entry.outcome_type}: ${entry.improvement_rate}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="improvement_rate"
              >
                {(healthcareMetrics?.clinical_outcomes || []).map((entry: PieDataPoint, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  // Financial Performance Tab
  const FinancialTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'الأداء المالي' : 'Financial Performance'}</CardTitle>
          <CardDescription>{isRTL ? 'نظرة عامة على الإيرادات' : 'Revenue overview'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</span>
            <span className="text-2xl font-bold">${financialMetrics?.total_revenue || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'نمو الإيرادات' : 'Revenue Growth'}</span>
            <span className="text-2xl font-bold text-green-600">+{financialMetrics?.revenue_growth || 0}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{isRTL ? 'متوسط قيمة الطلب' : 'Avg Order Value'}</span>
            <span className="text-2xl font-bold">${financialMetrics?.avg_order_value || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'أهم الفئات بالإيرادات' : 'Top Revenue Categories'}</CardTitle>
          <CardDescription>{isRTL ? 'الإيرادات حسب الفئة' : 'Revenue by category'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialMetrics?.top_revenue_categories || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  // Predictive Analytics Tab
  const PredictiveTab = () => (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'توقعات الإيرادات' : 'Revenue Forecast'}</CardTitle>
          <CardDescription>{isRTL ? 'التوقعات للأشهر الـ 6 القادمة' : 'Next 6 months projection'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={predictiveData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="predicted_revenue" stroke="#8884d8" strokeWidth={2} name={isRTL ? 'الإيرادات المتوقعة' : 'Predicted Revenue'} />
              <Line type="monotone" dataKey="confidence" stroke="#82ca9d" strokeWidth={2} name={isRTL ? 'الثقة' : 'Confidence'} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">{isRTL ? 'جاري تحميل التحليلات...' : 'Loading analytics...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {isRTL ? 'لوحة التحليلات' : 'Analytics Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? 'مراقبة وتحليل شامل للمنصة' : 'Comprehensive platform monitoring and analysis'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{isRTL ? '1 ساعة' : '1 Hour'}</SelectItem>
              <SelectItem value="24h">{isRTL ? '24 ساعة' : '24 Hours'}</SelectItem>
              <SelectItem value="7d">{isRTL ? '7 أيام' : '7 Days'}</SelectItem>
              <SelectItem value="30d">{isRTL ? '30 يوم' : '30 Days'}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {autoRefresh ? (isRTL ? 'إيقاف التحديث التلقائي' : 'Stop Auto-refresh') : (isRTL ? 'تفعيل التحديث التلقائي' : 'Start Auto-refresh')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
          >
            <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-8">
          <TabsTrigger value="overview">
            <Activity className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'نظرة عامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'المستخدمون' : 'Users'}
          </TabsTrigger>
          <TabsTrigger value="healthcare">
            <Heart className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'الرعاية الصحية' : 'Healthcare'}
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'المالية' : 'Financial'}
          </TabsTrigger>
          <TabsTrigger value="predictive">
            <TrendingUp className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'التنبؤات' : 'Predictive'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="users">
          <UserBehaviorTab />
        </TabsContent>

        <TabsContent value="healthcare">
          <HealthcareTab />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialTab />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}