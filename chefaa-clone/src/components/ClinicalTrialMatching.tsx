import React, { useState, useEffect } from 'react';
import { Search, Beaker, MapPin, Users, Calendar, Award, TrendingUp, FileText, Heart, AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ClinicalTrialMatchingProps {
  language: 'ar' | 'en';
}

interface Trial {
  id: string;
  trial_identifier: string;
  title: string;
  description: string;
  phase: string;
  status: string;
  condition: string;
  sponsor: string;
  age_minimum: number;
  age_maximum: number;
  gender: string;
  enrollment_count: number;
  contact_email: string;
  primary_outcome: string;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
}

interface TrialMatch {
  trial: Trial;
  match_score: number;
  match_confidence: string;
  matching_factors: any[];
  eligibility_assessment: any;
}

const ClinicalTrialMatching: React.FC<ClinicalTrialMatchingProps> = ({ language }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<TrialMatch[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<TrialMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conditions, setConditions] = useState<string[]>(['Type 2 Diabetes']);
  const [age, setAge] = useState(45);
  const [gender, setGender] = useState('all');

  const isRTL = language === 'ar';

  const texts = {
    title: {
      ar: 'مطابقة التجارب السريرية بالذكاء الاصطناعي',
      en: 'AI-Driven Clinical Trial Matching (TrialGPT)'
    },
    subtitle: {
      ar: 'اكتشف فرص التجارب السريرية المناسبة لك بدقة 87%',
      en: 'Discover relevant clinical trial opportunities with 87% accuracy'
    },
    findMatches: {
      ar: 'البحث عن تجارب مطابقة',
      en: 'Find Matching Trials'
    },
    matchScore: {
      ar: 'نسبة المطابقة',
      en: 'Match Score'
    },
    confidence: {
      high: { ar: 'ثقة عالية', en: 'High Confidence' },
      medium: { ar: 'ثقة متوسطة', en: 'Medium Confidence' },
      low: { ar: 'ثقة منخفضة', en: 'Low Confidence' }
    },
    viewDetails: {
      ar: 'عرض التفاصيل',
      en: 'View Details'
    },
    applyNow: {
      ar: 'التقديم الآن',
      en: 'Apply Now'
    },
    trialDetails: {
      ar: 'تفاصيل التجربة',
      en: 'Trial Details'
    },
    eligibility: {
      ar: 'معايير الأهلية',
      en: 'Eligibility'
    },
    inclusion: {
      ar: 'معايير القبول',
      en: 'Inclusion Criteria'
    },
    exclusion: {
      ar: 'معايير الاستبعاد',
      en: 'Exclusion Criteria'
    },
    contactInfo: {
      ar: 'معلومات التواصل',
      en: 'Contact Information'
    },
    primaryOutcome: {
      ar: 'النتيجة الأولية',
      en: 'Primary Outcome'
    },
    phase: {
      ar: 'المرحلة',
      en: 'Phase'
    },
    status: {
      recruiting: { ar: 'جاري التوظيف', en: 'Recruiting' },
      active: { ar: 'نشط', en: 'Active' },
      completed: { ar: 'مكتمل', en: 'Completed' }
    },
    sponsor: {
      ar: 'الجهة الراعية',
      en: 'Sponsor'
    },
    enrollment: {
      ar: 'عدد المشاركين',
      en: 'Enrollment'
    },
    ageRange: {
      ar: 'الفئة العمرية',
      en: 'Age Range'
    },
    condition: {
      ar: 'الحالة المرضية',
      en: 'Condition'
    },
    searchPlaceholder: {
      ar: 'ابحث عن تجارب سريرية...',
      en: 'Search for clinical trials...'
    },
    noMatches: {
      ar: 'لم يتم العثور على تجارب مطابقة',
      en: 'No matching trials found'
    },
    loading: {
      ar: 'جارٍ البحث...',
      en: 'Searching...'
    },
    eligible: {
      ar: 'مؤهل',
      en: 'Eligible'
    },
    possiblyEligible: {
      ar: 'مؤهل محتمل',
      en: 'Possibly Eligible'
    },
    notEligible: {
      ar: 'غير مؤهل',
      en: 'Not Eligible'
    },
    years: {
      ar: 'سنة',
      en: 'years'
    },
    participants: {
      ar: 'مشارك',
      en: 'participants'
    },
    accuracy: {
      ar: 'دقة 87%',
      en: '87% Accuracy'
    },
    matchingAlgorithm: {
      ar: 'خوارزمية TrialGPT',
      en: 'TrialGPT Algorithm'
    },
    yourProfile: {
      ar: 'ملفك الشخصي',
      en: 'Your Profile'
    },
    matchingFactors: {
      ar: 'عوامل المطابقة',
      en: 'Matching Factors'
    }
  };

  useEffect(() => {
    if (user) {
      findMatches();
    }
  }, [user]);

  const findMatches = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trialgpt-matching`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'find-matches',
            user_id: user?.id,
            conditions,
            age,
            gender
          })
        }
      );

      if (!response.ok) throw new Error('Failed to find matches');
      
      const result = await response.json();
      setMatches(result.data.matches || []);
    } catch (err: any) {
      console.error('Error finding trial matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (trial: Trial) => {
    alert(language === 'ar'
      ? `سيتم فتح نموذج التقديم للتجربة: ${trial.title}\n\nهذه نسخة تجريبية.`
      : `Opening application for trial: ${trial.title}\n\nThis is a demo version.`
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-slate-500';
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-blue-100 text-blue-700';
      case 'low':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEligibilityIcon = (status: string) => {
    switch (status) {
      case 'eligible':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'possibly_eligible':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'not_eligible':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 py-12 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl shadow-lg">
              <Beaker className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              {texts.title[language]}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            {texts.subtitle[language]}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600 font-semibold">
              <TrendingUp className="w-4 h-4" />
              {texts.accuracy[language]}
            </span>
            <span className="flex items-center gap-1 text-teal-600 font-semibold">
              <Star className="w-4 h-4" />
              {texts.matchingAlgorithm[language]}
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {texts.condition[language]}
              </label>
              <input
                type="text"
                value={conditions[0] || ''}
                onChange={(e) => setConditions([e.target.value])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Diabetes, Cancer, Heart Disease"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {texts.ageRange[language]}
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="18"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <button
            onClick={findMatches}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            {texts.findMatches[language]}
          </button>
        </div>

        {/* Matches List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <div className="inline-block w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">{texts.loading[language]}</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <Beaker className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">{texts.noMatches[language]}</p>
            </div>
          ) : (
            matches.map((match) => (
              <div
                key={match.trial.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Match Score Badge */}
                <div className="relative h-2 bg-gray-200">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreColor(match.match_score)} transition-all`}
                    style={{ width: `${match.match_score}%` }}
                  ></div>
                </div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-gray-500">
                          {match.trial.trial_identifier}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(match.match_confidence)}`}>
                          {texts.confidence[match.match_confidence as keyof typeof texts.confidence][language]}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {match.trial.title}
                      </h2>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {match.trial.description}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(match.match_score)} bg-clip-text text-transparent`}>
                        {match.match_score}%
                      </div>
                      <div className="text-xs text-gray-500">{texts.matchScore[language]}</div>
                    </div>
                  </div>

                  {/* Trial Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Beaker className="w-4 h-4 text-teal-600 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">{texts.phase[language]}</div>
                        <div className="text-sm font-semibold">{match.trial.phase}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-red-600 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">{texts.condition[language]}</div>
                        <div className="text-sm font-semibold">{match.trial.condition}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">{texts.enrollment[language]}</div>
                        <div className="text-sm font-semibold">{match.trial.enrollment_count}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-purple-600 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">{texts.ageRange[language]}</div>
                        <div className="text-sm font-semibold">{match.trial.age_minimum}-{match.trial.age_maximum}</div>
                      </div>
                    </div>
                  </div>

                  {/* Eligibility Assessment */}
                  {match.eligibility_assessment && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        {getEligibilityIcon(match.eligibility_assessment.overall)}
                        <span className="font-semibold text-gray-900">{texts.eligibility[language]}</span>
                      </div>
                      
                      {match.eligibility_assessment.criteria_met && match.eligibility_assessment.criteria_met.length > 0 && (
                        <div className="mb-2">
                          <div className="text-sm font-semibold text-green-700 mb-1">Criteria Met:</div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {match.eligibility_assessment.criteria_met.slice(0, 3).map((criterion: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{criterion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {match.eligibility_assessment.warnings && match.eligibility_assessment.warnings.length > 0 && (
                        <div className="text-xs text-yellow-700 mt-2">
                          {match.eligibility_assessment.warnings[0]}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matching Factors */}
                  {match.matching_factors && match.matching_factors.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2">{texts.matchingFactors[language]}:</div>
                      <div className="flex flex-wrap gap-2">
                        {match.matching_factors.slice(0, 4).map((factor: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded-full"
                          >
                            {factor.type}: {factor.value || factor.match}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedTrial(match)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    >
                      {texts.viewDetails[language]}
                    </button>
                    <button
                      onClick={() => handleApply(match.trial)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-semibold"
                    >
                      {texts.applyNow[language]}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Trial Details Modal */}
        {selectedTrial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{texts.trialDetails[language]}</h2>
                  <button
                    onClick={() => setSelectedTrial(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg mb-2">{selectedTrial.trial.title}</h3>
                    <p className="text-gray-600">{selectedTrial.trial.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{texts.sponsor[language]}</div>
                      <div className="font-semibold">{selectedTrial.trial.sponsor}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{texts.primaryOutcome[language]}</div>
                      <div className="font-semibold">{selectedTrial.trial.primary_outcome}</div>
                    </div>
                  </div>

                  {selectedTrial.trial.inclusion_criteria && selectedTrial.trial.inclusion_criteria.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{texts.inclusion[language]}</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {selectedTrial.trial.inclusion_criteria.map((criterion, idx) => (
                          <li key={idx}>{criterion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTrial.trial.exclusion_criteria && selectedTrial.trial.exclusion_criteria.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{texts.exclusion[language]}</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {selectedTrial.trial.exclusion_criteria.map((criterion, idx) => (
                          <li key={idx}>{criterion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{texts.contactInfo[language]}</h4>
                    <div className="text-sm text-gray-600">
                      <div>Email: {selectedTrial.trial.contact_email}</div>
                      <div>ID: {selectedTrial.trial.trial_identifier}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApply(selectedTrial.trial)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-semibold"
                  >
                    {texts.applyNow[language]}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalTrialMatching;
