import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  AlertTriangle, 
  Activity, 
  Pill, 
  Heart, 
  TestTube, 
  Calendar,
  Shield,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface DrugInteraction {
  medication_a_name: string;
  medication_b_name: string;
  interaction_severity: 'contraindicated' | 'major' | 'moderate' | 'minor' | 'monitor';
  clinical_effects: string;
  management_recommendations: string;
  is_emergency: boolean;
}

interface PrescriptionHistory {
  id: string;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  prescribed_by: string;
  prescription_status: 'active' | 'completed' | 'discontinued' | 'on_hold' | 'expired';
  adherence_score?: number;
  effectiveness_rating?: number;
  is_controlled_substance: boolean;
}

interface AllergyRecord {
  id: string;
  allergen_name: string;
  allergen_type: 'medication' | 'food' | 'environmental' | 'contact' | 'other';
  allergic_reaction: string;
  reaction_severity: 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'anaphylaxis';
  is_verified: boolean;
  verified_by?: string;
}

interface ConditionRecord {
  id: string;
  condition_name: string;
  condition_code?: string;
  diagnosis_date?: string;
  diagnosed_by?: string;
  severity: 'asymptomatic' | 'mild' | 'moderate' | 'severe' | 'life_threatening';
  status: 'active' | 'inactive' | 'resolved' | 'chronic' | 'recurring';
  symptom_severity_score?: number;
  is_verified: boolean;
}

interface LabResult {
  id: string;
  test_name: string;
  test_date: string;
  result_value: string;
  unit?: string;
  reference_range?: string;
  is_abnormal: boolean;
  critical_value: boolean;
  lab_name: string;
  clinical_significance?: string;
}

interface TreatmentPlan {
  id: string;
  plan_name: string;
  condition_treated?: string;
  plan_type: 'medication' | 'therapy' | 'lifestyle' | 'surgical' | 'preventive' | 'palliative';
  start_date: string;
  end_date?: string;
  plan_status: 'planned' | 'active' | 'completed' | 'discontinued' | 'on_hold';
  adherence_rate?: number;
}

interface AuditLog {
  id: string;
  action_type: string;
  resource_type: string;
  audit_timestamp: string;
  ip_address?: string;
}

const MedicalRecordsDashboard: React.FC<{ language: 'ar' | 'en' }> = ({ language }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'prescriptions' | 'interactions' | 'allergies' | 'conditions' | 'labs' | 'treatments' | 'audit'>('overview');
  const [prescriptions, setPrescriptions] = useState<PrescriptionHistory[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [interactionWarnings, setInteractionWarnings] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<AllergyRecord[]>([]);
  const [conditions, setConditions] = useState<ConditionRecord[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | '6months' | '1year'>('all');

  const isRTL = language === 'ar';

  // Supabase client for API calls
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const makeApiCall = async (endpoint: string, options: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || localStorage.getItem('supabase.auth.token');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/medical-records?action=${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  const loadMedicalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [prescriptionsData, allergiesData, conditionsData, labData] = await Promise.all([
        makeApiCall('get-prescription-history'),
        makeApiCall('get-allergies'),
        makeApiCall('get-conditions'),
        makeApiCall('get-lab-results'),
      ]);

      if (prescriptionsData.success) {
        setPrescriptions(prescriptionsData.data);
        // Check for drug interactions
        if (prescriptionsData.data.length > 1) {
          const activeMeds = prescriptionsData.data
            .filter((p: PrescriptionHistory) => p.prescription_status === 'active')
            .map((p: PrescriptionHistory) => p.medication_name);
          
          if (activeMeds.length > 1) {
            const interactionData = await makeApiCall('check-interactions', { medications: activeMeds });
            if (interactionData.success) {
              setInteractions(interactionData.data.interactions);
              setInteractionWarnings(interactionData.data.warnings);
            }
          }
        }
      }

      if (allergiesData.success) setAllergies(allergiesData.data);
      if (conditionsData.success) setConditions(conditionsData.data);
      if (labData.success) setLabResults(labData.data);

    } catch (err) {
      console.error('Error loading medical data:', err);
      setError('Failed to load medical records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMedicalData();
    }
  }, [user]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'contraindicated':
      case 'life_threatening':
      case 'anaphylaxis':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'major':
      case 'severe':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'moderate':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'minor':
      case 'mild':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'discontinued':
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.prescribed_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading medical records...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Records</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadMedicalData}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Emergency Interaction Alerts */}
      {interactionWarnings.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">
              {language === 'ar' ? 'تحذيرات تفاعل دوائية طارئة' : 'Emergency Drug Interaction Warnings'}
            </h3>
          </div>
          <div className="space-y-2">
            {interactionWarnings.map((warning, index) => (
              <div key={index} className="flex items-start">
                <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{warning}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            {language === 'ar' ? 'مراجعة الأدوية' : 'Review Medications'}
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {language === 'ar' ? 'الأدوية النشطة' : 'Active Medications'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {prescriptions.filter(p => p.prescription_status === 'active').length}
              </p>
            </div>
            <Pill className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {language === 'ar' ? 'الحساسيات' : 'Allergies'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{allergies.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {language === 'ar' ? 'النتائج المخبرية' : 'Lab Results'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{labResults.length}</p>
            </div>
            <TestTube className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {language === 'ar' ? 'التفاعلات الدوائية' : 'Drug Interactions'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{interactions.length}</p>
            </div>
            <Activity className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'ar' ? 'النشاط الطبي الأخير' : 'Recent Medical Activity'}
        </h3>
        <div className="space-y-4">
          {labResults.slice(0, 5).map((lab, index) => (
            <div key={lab.id} className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${lab.is_abnormal ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{lab.test_name}</p>
                <p className="text-sm text-gray-600">{formatDate(lab.test_date)} - {lab.lab_name}</p>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${lab.is_abnormal ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {lab.is_abnormal ? (language === 'ar' ? 'غير طبيعي' : 'Abnormal') : (language === 'ar' ? 'طبيعي' : 'Normal')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {language === 'ar' ? 'تاريخ الوصفات الطبية' : 'Prescription History'}
        </h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث في الأدوية...' : 'Search medications...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'إضافة وصفة' : 'Add Prescription'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الدواء' : 'Medication'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الجرعة' : 'Dosage'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'التردد' : 'Frequency'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الالتزام' : 'Adherence'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrescriptions.map((prescription) => (
                <tr key={prescription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Pill className="w-4 h-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{prescription.medication_name}</div>
                        {prescription.generic_name && (
                          <div className="text-sm text-gray-500">{prescription.generic_name}</div>
                        )}
                        {prescription.is_controlled_substance && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                            {language === 'ar' ? 'مواد خاضعة للرقابة' : 'Controlled'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prescription.dosage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prescription.frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.prescription_status)}`}>
                      {prescription.prescription_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(prescription.start_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {prescription.adherence_score !== undefined && (
                      <div className="flex items-center">
                        <div className={`w-16 bg-gray-200 rounded-full h-2 mr-2`}>
                          <div 
                            className={`h-2 rounded-full ${prescription.adherence_score >= 80 ? 'bg-green-500' : prescription.adherence_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${prescription.adherence_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{prescription.adherence_score}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDrugInteractions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {language === 'ar' ? 'التفاعلات الدوائية' : 'Drug Interactions'}
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {language === 'ar' ? 'فحص جديد' : 'New Check'}
        </button>
      </div>

      {interactionWarnings.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-3">
            {language === 'ar' ? 'تحذيرات حرجة' : 'Critical Warnings'}
          </h3>
          <div className="space-y-2">
            {interactionWarnings.map((warning, index) => (
              <div key={index} className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {interactions.length > 0 ? (
        <div className="grid gap-4">
          {interactions.map((interaction, index) => (
            <div key={index} className={`p-6 rounded-lg border ${getSeverityColor(interaction.interaction_severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">
                    {interaction.medication_a_name} × {interaction.medication_b_name}
                  </h4>
                  <p className="mb-2">
                    <strong>{language === 'ar' ? 'الأثر: ' : 'Effect: '}</strong>
                    {interaction.clinical_effects}
                  </p>
                  <p className="mb-2">
                    <strong>{language === 'ar' ? 'التوصية: ' : 'Recommendation: '}</strong>
                    {interaction.management_recommendations}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(interaction.interaction_severity)}`}>
                    {interaction.interaction_severity}
                  </span>
                  {interaction.is_emergency && (
                    <div className="mt-2 text-red-600 font-semibold">
                      {language === 'ar' ? 'طارئة' : 'Emergency'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد تفاعلات' : 'No Interactions Found'}
          </h3>
          <p className="text-gray-600">
            {language === 'ar' 
              ? 'لم يتم العثور على تفاعلات دوائية في الأدوية الحالية'
              : 'No drug interactions found in current medications'
            }
          </p>
        </div>
      )}
    </div>
  );

  const renderAllergies = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {language === 'ar' ? 'الحساسيات' : 'Allergies'}
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'إضافة حساسية' : 'Add Allergy'}
        </button>
      </div>

      <div className="grid gap-4">
        {allergies.map((allergy) => (
          <div key={allergy.id} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="font-semibold text-lg">{allergy.allergen_name}</h3>
                  {allergy.is_verified && (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                  )}
                </div>
                <p className="text-gray-600 mb-2">
                  <strong>{language === 'ar' ? 'النوع: ' : 'Type: '}</strong>
                  {allergy.allergen_type}
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>{language === 'ar' ? 'التفاعل: ' : 'Reaction: '}</strong>
                  {allergy.allergic_reaction}
                </p>
                {allergy.verified_by && (
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'تم التحقق بواسطة: ' : 'Verified by: '}
                    {allergy.verified_by}
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(allergy.reaction_severity)}`}>
                {allergy.reaction_severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConditions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {language === 'ar' ? 'الحالات الطبية' : 'Medical Conditions'}
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'إضافة حالة' : 'Add Condition'}
        </button>
      </div>

      <div className="grid gap-4">
        {conditions.map((condition) => (
          <div key={condition.id} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Heart className="w-5 h-5 text-red-500 mr-2" />
                  <h3 className="font-semibold text-lg">{condition.condition_name}</h3>
                  {condition.is_verified && (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                  )}
                </div>
                <p className="text-gray-600 mb-2">
                  <strong>{language === 'ar' ? 'الحالة: ' : 'Status: '}</strong>
                  {condition.status}
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>{language === 'ar' ? 'الشدة: ' : 'Severity: '}</strong>
                  {condition.severity}
                </p>
                {condition.diagnosis_date && (
                  <p className="text-gray-600 mb-2">
                    <strong>{language === 'ar' ? 'تاريخ التشخيص: ' : 'Diagnosis Date: '}</strong>
                    {formatDate(condition.diagnosis_date)}
                  </p>
                )}
                {condition.symptom_severity_score !== undefined && (
                  <p className="text-gray-600">
                    <strong>{language === 'ar' ? 'درجة الشدة: ' : 'Severity Score: '}</strong>
                    {condition.symptom_severity_score}/10
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(condition.severity)}`}>
                {condition.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLabResults = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {language === 'ar' ? 'النتائج المخبرية' : 'Lab Results'}
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'إضافة نتيجة' : 'Add Result'}
        </button>
      </div>

      <div className="grid gap-4">
        {labResults.map((lab) => (
          <div key={lab.id} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <TestTube className={`w-5 h-5 mr-2 ${lab.is_abnormal ? 'text-red-500' : 'text-green-500'}`} />
                  <h3 className="font-semibold text-lg">{lab.test_name}</h3>
                  {lab.critical_value && (
                    <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                  )}
                </div>
                <p className="text-gray-600 mb-2">
                  <strong>{language === 'ar' ? 'النتيجة: ' : 'Result: '}</strong>
                  {lab.result_value} {lab.unit}
                </p>
                {lab.reference_range && (
                  <p className="text-gray-600 mb-2">
                    <strong>{language === 'ar' ? 'النطاق المرجعي: ' : 'Reference Range: '}</strong>
                    {lab.reference_range}
                  </p>
                )}
                <p className="text-gray-600 mb-2">
                  <strong>{language === 'ar' ? 'المختبر: ' : 'Lab: '}</strong>
                  {lab.lab_name}
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>{language === 'ar' ? 'تاريخ الفحص: ' : 'Test Date: '}</strong>
                  {formatDate(lab.test_date)}
                </p>
                {lab.clinical_significance && (
                  <p className="text-gray-600">
                    <strong>{language === 'ar' ? 'الأهمية السريرية: ' : 'Clinical Significance: '}</strong>
                    {lab.clinical_significance}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${lab.is_abnormal ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {lab.is_abnormal ? (language === 'ar' ? 'غير طبيعي' : 'Abnormal') : (language === 'ar' ? 'طبيعي' : 'Normal')}
                </span>
                {lab.critical_value && (
                  <div className="mt-2 text-red-600 font-semibold">
                    {language === 'ar' ? 'قيمة حرجة' : 'Critical Value'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {language === 'ar' ? 'سجلات المراجعة' : 'Audit Logs'}
        </h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Download className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'تصدير السجلات' : 'Export Logs'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الإجراء' : 'Action'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'نوع البيانات' : 'Data Type'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'عنوان IP' : 'IP Address'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.audit_timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.resource_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.ip_address || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: language === 'ar' ? 'نظرة عامة' : 'Overview', icon: Activity },
    { id: 'prescriptions', label: language === 'ar' ? 'الوصفات' : 'Prescriptions', icon: Pill },
    { id: 'interactions', label: language === 'ar' ? 'التفاعلات' : 'Interactions', icon: AlertTriangle },
    { id: 'allergies', label: language === 'ar' ? 'الحساسيات' : 'Allergies', icon: AlertCircle },
    { id: 'conditions', label: language === 'ar' ? 'الحالات' : 'Conditions', icon: Heart },
    { id: 'labs', label: language === 'ar' ? 'الفحوصات' : 'Lab Results', icon: TestTube },
    { id: 'audit', label: language === 'ar' ? 'المراجعة' : 'Audit Logs', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'السجلات الطبية الآمنة' : 'Secure Medical Records'}
                </h1>
                <p className="text-gray-600">
                  {language === 'ar' ? 'نظام متوافق مع HIPAA لإدارة السجلات الطبية' : 'HIPAA-compliant medical records management system'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {language === 'ar' ? 'آمن ومتوافق' : 'Secure & Compliant'}
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {language === 'ar' ? 'مُشفّر' : 'Encrypted'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'prescriptions' && renderPrescriptions()}
          {activeTab === 'interactions' && renderDrugInteractions()}
          {activeTab === 'allergies' && renderAllergies()}
          {activeTab === 'conditions' && renderConditions()}
          {activeTab === 'labs' && renderLabResults()}
          {activeTab === 'audit' && renderAuditLogs()}
        </div>

        {/* HIPAA Compliance Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                {language === 'ar' ? 'متطلبات HIPAA' : 'HIPAA Compliance Notice'}
              </h4>
              <p className="text-sm text-blue-700">
                {language === 'ar' 
                  ? 'جميع السجلات الطبية محمية بـ HIPAA ومشفرة لحمايتك. يتم تسجيل جميع عمليات الوصول للمراجعة الأمنية.'
                  : 'All medical records are HIPAA protected and encrypted for your security. All access is logged for security auditing.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsDashboard;