import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Bell, TrendingUp, TrendingDown, Award, AlertTriangle, Smartphone, Watch, Pill, Calendar, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface IoTAdherenceMonitorProps {
  language: 'ar' | 'en';
}

interface IoTDevice {
  id: string;
  device_name: string;
  device_type: string;
  device_id: string;
  is_active: boolean;
  last_connected_at: string;
  battery_level: number;
  created_at: string;
}

interface AdherenceData {
  id: string;
  device_id: string;
  medication_name: string;
  scheduled_time: string;
  actual_time?: string;
  taken: boolean;
  missed: boolean;
  recorded_at: string;
}

interface AdherencePattern {
  medication: string;
  adherence_rate: number;
  streak_days: number;
  total_doses: number;
  missed_doses: number;
  average_delay_minutes: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface Intervention {
  id: string;
  intervention_type: string;
  severity: string;
  message: string;
  recommended_action: string;
  created_at: string;
  acknowledged: boolean;
}

const IoTAdherenceMonitor: React.FC<IoTAdherenceMonitorProps> = ({ language }) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [adherenceData, setAdherenceData] = useState<AdherenceData[]>([]);
  const [patterns, setPatterns] = useState<AdherencePattern[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('7');

  const isRTL = language === 'ar';

  const texts = {
    title: {
      ar: 'مراقبة الالتزام الدوائي الذكية',
      en: 'IoT Medication Adherence Monitor'
    },
    subtitle: {
      ar: 'مراقبة ذكية لتناول الأدوية باستخدام أجهزة إنترنت الأشياء',
      en: 'Smart medication adherence monitoring with IoT devices'
    },
    myDevices: {
      ar: 'أجهزتي المتصلة',
      en: 'My Connected Devices'
    },
    adherenceStats: {
      ar: 'إحصائيات الالتزام',
      en: 'Adherence Statistics'
    },
    recentActivity: {
      ar: 'النشاط الأخير',
      en: 'Recent Activity'
    },
    interventions: {
      ar: 'التدخلات الموصى بها',
      en: 'Recommended Interventions'
    },
    addDevice: {
      ar: 'إضافة جهاز جديد',
      en: 'Add New Device'
    },
    deviceStatus: {
      ar: 'حالة الجهاز',
      en: 'Device Status'
    },
    online: {
      ar: 'متصل',
      en: 'Online'
    },
    offline: {
      ar: 'غير متصل',
      en: 'Offline'
    },
    battery: {
      ar: 'البطارية',
      en: 'Battery'
    },
    lastConnected: {
      ar: 'آخر اتصال',
      en: 'Last Connected'
    },
    adherenceRate: {
      ar: 'معدل الالتزام',
      en: 'Adherence Rate'
    },
    streak: {
      ar: 'سلسلة الأيام',
      en: 'Streak'
    },
    days: {
      ar: 'يوم',
      en: 'days'
    },
    totalDoses: {
      ar: 'إجمالي الجرعات',
      en: 'Total Doses'
    },
    missedDoses: {
      ar: 'الجرعات الفائتة',
      en: 'Missed Doses'
    },
    avgDelay: {
      ar: 'متوسط التأخير',
      en: 'Avg Delay'
    },
    minutes: {
      ar: 'دقيقة',
      en: 'minutes'
    },
    trend: {
      ar: 'الاتجاه',
      en: 'Trend'
    },
    improving: {
      ar: 'تحسن',
      en: 'Improving'
    },
    stable: {
      ar: 'مستقر',
      en: 'Stable'
    },
    declining: {
      ar: 'تراجع',
      en: 'Declining'
    },
    taken: {
      ar: 'تم التناول',
      en: 'Taken'
    },
    missed: {
      ar: 'فائت',
      en: 'Missed'
    },
    scheduled: {
      ar: 'مجدول',
      en: 'Scheduled'
    },
    notifyCaregiver: {
      ar: 'إخطار مقدم الرعاية',
      en: 'Notify Caregiver'
    },
    acknowledge: {
      ar: 'تم الاطلاع',
      en: 'Acknowledge'
    },
    period: {
      '7': { ar: '7 أيام', en: '7 days' },
      '30': { ar: '30 يوم', en: '30 days' },
      '90': { ar: '90 يوم', en: '90 days' }
    },
    severity: {
      low: { ar: 'منخفض', en: 'Low' },
      medium: { ar: 'متوسط', en: 'Medium' },
      high: { ar: 'عالي', en: 'High' },
      critical: { ar: 'حرج', en: 'Critical' }
    },
    noDevices: {
      ar: 'لا توجد أجهزة متصلة',
      en: 'No devices connected'
    },
    noData: {
      ar: 'لا توجد بيانات متاحة',
      en: 'No data available'
    },
    loading: {
      ar: 'جارٍ التحميل...',
      en: 'Loading...'
    }
  };

  useEffect(() => {
    if (user) {
      loadDevices();
      loadAdherenceData();
      loadInterventions();
    }
  }, [user, selectedPeriod]);

  const loadDevices = async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('iot_devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDevices(data || []);
    } catch (err: any) {
      console.error('Error loading devices:', err);
    }
  };

  const loadAdherenceData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      const { data, error: fetchError } = await supabase
        .from('adherence_data')
        .select('*')
        .gte('recorded_at', daysAgo.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setAdherenceData(data || []);

      // Analyze patterns (simulated for now)
      analyzePatterns(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInterventions = async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('interventions')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;
      setInterventions(data || []);
    } catch (err: any) {
      console.error('Error loading interventions:', err);
    }
  };

  const analyzePatterns = (data: AdherenceData[]) => {
    // Group by medication
    const medicationGroups = data.reduce((acc, record) => {
      if (!acc[record.medication_name]) {
        acc[record.medication_name] = [];
      }
      acc[record.medication_name].push(record);
      return acc;
    }, {} as Record<string, AdherenceData[]>);

    // Calculate patterns for each medication
    const analyzedPatterns = Object.entries(medicationGroups).map(([medication, records]) => {
      const total = records.length;
      const taken = records.filter(r => r.taken).length;
      const missed = records.filter(r => r.missed).length;
      const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

      // Calculate streak (consecutive days taken)
      let streak = 0;
      for (let i = 0; i < records.length; i++) {
        if (records[i].taken) streak++;
        else break;
      }

      // Calculate average delay
      const delays = records
        .filter(r => r.taken && r.actual_time && r.scheduled_time)
        .map(r => {
          const scheduled = new Date(r.scheduled_time);
          const actual = new Date(r.actual_time!);
          return (actual.getTime() - scheduled.getTime()) / (1000 * 60);
        });
      const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;

      // Determine trend (simplified)
      const recentRate = total >= 7 ? (records.slice(0, 7).filter(r => r.taken).length / 7) * 100 : adherenceRate;
      const trend: 'improving' | 'stable' | 'declining' =
        recentRate > adherenceRate + 5 ? 'improving' :
        recentRate < adherenceRate - 5 ? 'declining' : 'stable';

      return {
        medication,
        adherence_rate: adherenceRate,
        streak_days: streak,
        total_doses: total,
        missed_doses: missed,
        average_delay_minutes: avgDelay,
        trend
      };
    });

    setPatterns(analyzedPatterns);
  };

  const acknowledgeIntervention = async (interventionId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('interventions')
        .update({ acknowledged: true })
        .eq('id', interventionId);

      if (updateError) throw updateError;
      
      // Reload interventions
      loadInterventions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const notifyCaregiver = async (medication: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iot-adherence-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'notify-caregivers',
            user_id: user?.id,
            medication,
            alert_type: 'missed_doses'
          })
        }
      );

      if (!response.ok) throw new Error('Failed to notify caregiver');
      
      alert(language === 'ar' ? 'تم إرسال الإشعار لمقدم الرعاية' : 'Caregiver notified successfully');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'smart_pill_bottle':
        return <Pill className="w-6 h-6" />;
      case 'smart_watch':
        return <Watch className="w-6 h-6" />;
      case 'mobile_app':
        return <Smartphone className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-50 text-blue-700 border-blue-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[severity] || colors.low;
  };

  return (
    <div className={`min-h-screen bg-gray-50 py-12 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-600 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              {texts.title[language]}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {texts.subtitle[language]}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {(['7', '30', '90'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedPeriod === period
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {texts.period[period][language]}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Connected Devices */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{texts.myDevices[language]}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {devices.length === 0 ? (
              <div className="col-span-3 text-center py-8 bg-white rounded-xl shadow-sm">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">{texts.noDevices[language]}</p>
              </div>
            ) : (
              devices.map((device) => (
                <div key={device.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        {getDeviceIcon(device.device_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{device.device_name}</h3>
                        <p className="text-xs text-gray-500">{device.device_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {device.is_active ? (
                        <>
                          <Wifi className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">{texts.online[language]}</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-400">{texts.offline[language]}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{texts.battery[language]}:</span>
                      <span className={`font-semibold ${
                        device.battery_level > 50 ? 'text-green-600' :
                        device.battery_level > 20 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {device.battery_level}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{texts.lastConnected[language]}:</span>
                      <span className="text-xs text-gray-500">
                        {new Date(device.last_connected_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Adherence Patterns */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{texts.adherenceStats[language]}</h2>
          {loading ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : patterns.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl shadow-sm">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">{texts.noData[language]}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {patterns.map((pattern, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{pattern.medication}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-3xl font-bold text-purple-600">
                          {pattern.adherence_rate.toFixed(0)}%
                        </span>
                        {getTrendIcon(pattern.trend)}
                      </div>
                    </div>
                    {pattern.adherence_rate >= 80 && (
                      <Award className="w-8 h-8 text-yellow-500" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">{texts.streak[language]}</div>
                      <div className="text-xl font-bold text-blue-600">{pattern.streak_days}</div>
                      <div className="text-xs text-gray-500">{texts.days[language]}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">{texts.totalDoses[language]}</div>
                      <div className="text-xl font-bold text-green-600">{pattern.total_doses}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">{texts.missedDoses[language]}</div>
                      <div className="text-xl font-bold text-red-600">{pattern.missed_doses}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">{texts.avgDelay[language]}</div>
                      <div className="text-xl font-bold text-orange-600">
                        {pattern.average_delay_minutes.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">{texts.minutes[language]}</div>
                    </div>
                  </div>

                  {pattern.missed_doses > 3 && (
                    <button
                      onClick={() => notifyCaregiver(pattern.medication)}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      {texts.notifyCaregiver[language]}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interventions */}
        {interventions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{texts.interventions[language]}</h2>
            <div className="space-y-4">
              {interventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className={`p-4 rounded-xl border-2 ${getSeverityColor(intervention.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold text-sm">
                          {texts.severity[intervention.severity as keyof typeof texts.severity][language]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(intervention.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>
                      <p className="font-semibold mb-2">{intervention.message}</p>
                      <p className="text-sm mb-3">{intervention.recommended_action}</p>
                    </div>
                    <button
                      onClick={() => acknowledgeIntervention(intervention.id)}
                      className="px-3 py-1 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
                    >
                      {texts.acknowledge[language]}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IoTAdherenceMonitor;
