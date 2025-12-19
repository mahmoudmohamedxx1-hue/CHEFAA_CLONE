import React, { useState, useEffect } from 'react';
import { Scan, Play, BookOpen, Award, Clock, TrendingUp, CheckCircle, Lock, Sparkles, Box, Video, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ARPatientEducationProps {
  language: 'ar' | 'en';
}

interface ARContent {
  id: string;
  content_type: string;
  title: string;
  description: string;
  asset_url: string;
  thumbnail_url: string;
  difficulty_level: string;
  duration_minutes: number;
  user_progress?: number;
}

interface UserProgress {
  content_id: string;
  progress_percentage: number;
  completion_status: string;
  certificate_earned: boolean;
  time_spent_minutes: number;
  quiz_score: number | null;
}

interface Achievement {
  name: string;
  description: string;
}

const ARPatientEducation: React.FC<ARPatientEducationProps> = ({ language }) => {
  const { user } = useAuth();
  const [content, setContent] = useState<ARContent[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ARContent | null>(null);
  const [activeTab, setActiveTab] = useState<'explore' | 'progress' | 'achievements'>('explore');

  const isRTL = language === 'ar';

  const texts = {
    title: {
      ar: 'التعليم الطبي بتقنية الواقع المعزز',
      en: 'AR-Powered Patient Education'
    },
    subtitle: {
      ar: 'تجربة تعليمية غامرة بتقنية الواقع المعزز ثلاثي الأبعاد',
      en: 'Immersive 3D augmented reality learning experiences'
    },
    exploreTab: {
      ar: 'استكشاف المحتوى',
      en: 'Explore Content'
    },
    progressTab: {
      ar: 'تقدمي',
      en: 'My Progress'
    },
    achievementsTab: {
      ar: 'إنجازاتي',
      en: 'Achievements'
    },
    contentTypes: {
      '3d_model': { ar: 'نموذج ثلاثي الأبعاد', en: '3D Model' },
      'animation': { ar: 'رسوم متحركة', en: 'Animation' },
      'tutorial': { ar: 'درس تعليمي', en: 'Tutorial' },
      'simulation': { ar: 'محاكاة تفاعلية', en: 'Interactive Simulation' }
    },
    difficulty: {
      'beginner': { ar: 'مبتدئ', en: 'Beginner' },
      'intermediate': { ar: 'متوسط', en: 'Intermediate' },
      'advanced': { ar: 'متقدم', en: 'Advanced' }
    },
    startLearning: {
      ar: 'ابدأ التعلم',
      en: 'Start Learning'
    },
    continueLearning: {
      ar: 'واصل التعلم',
      en: 'Continue Learning'
    },
    viewContent: {
      ar: 'عرض المحتوى',
      en: 'View Content'
    },
    completed: {
      ar: 'مكتمل',
      en: 'Completed'
    },
    inProgress: {
      ar: 'قيد التقدم',
      en: 'In Progress'
    },
    minutes: {
      ar: 'دقيقة',
      en: 'minutes'
    },
    totalContent: {
      ar: 'إجمالي المحتوى',
      en: 'Total Content'
    },
    completedCount: {
      ar: 'المكتمل',
      en: 'Completed'
    },
    timeSpent: {
      ar: 'الوقت المستغرق',
      en: 'Time Spent'
    },
    avgScore: {
      ar: 'المعدل',
      en: 'Avg Score'
    },
    certificatesEarned: {
      ar: 'الشهادات المكتسبة',
      en: 'Certificates Earned'
    },
    noContent: {
      ar: 'لا يوجد محتوى متاح',
      en: 'No content available'
    },
    loading: {
      ar: 'جارٍ التحميل...',
      en: 'Loading...'
    },
    progress: {
      ar: 'التقدم',
      en: 'Progress'
    },
    certificate: {
      ar: 'شهادة',
      en: 'Certificate'
    },
    features: {
      molecular: { ar: 'البنية الجزيئية', en: 'Molecular Structure' },
      interactive: { ar: 'تفاعلي', en: 'Interactive' },
      stepByStep: { ar: 'خطوة بخطوة', en: 'Step-by-Step' },
      immersive: { ar: 'غامر', en: 'Immersive' }
    }
  };

  useEffect(() => {
    if (user) {
      loadContent();
      loadUserProgress();
    }
  }, [user]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ar-education-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'get-recommended',
            user_id: user?.id,
            limit: 20
          })
        }
      );

      if (!response.ok) throw new Error('Failed to load content');
      
      const result = await response.json();
      setContent(result.data.recommended_content || []);
    } catch (err: any) {
      console.error('Error loading AR content:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ar-education-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'get-user-progress',
            user_id: user?.id
          })
        }
      );

      if (!response.ok) throw new Error('Failed to load progress');
      
      const result = await response.json();
      setUserProgress(result.data.progress || []);
      setStats(result.data.statistics);
      setAchievements(result.data.achievements || []);
    } catch (err: any) {
      console.error('Error loading progress:', err);
    }
  };

  const handleStartContent = (contentItem: ARContent) => {
    setSelectedContent(contentItem);
    // In a real implementation, this would launch the AR viewer
    alert(language === 'ar' 
      ? `سيتم إطلاق محتوى الواقع المعزز: ${contentItem.title}\n\nهذه نسخة تجريبية. في الإنتاج، سيتم فتح عارض ثلاثي الأبعاد تفاعلي.`
      : `Launching AR content: ${contentItem.title}\n\nThis is a demo. In production, an interactive 3D AR viewer would open.`
    );
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case '3d_model':
        return <Box className="w-5 h-5" />;
      case 'animation':
        return <Video className="w-5 h-5" />;
      case 'tutorial':
        return <BookOpen className="w-5 h-5" />;
      case 'simulation':
        return <Target className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Scan className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {texts.title[language]}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {texts.subtitle[language]}
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total_content}</div>
              <div className="text-xs text-gray-600">{texts.totalContent[language]}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.completed_count}</div>
              <div className="text-xs text-gray-600">{texts.completedCount[language]}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total_time_spent}</div>
              <div className="text-xs text-gray-600">{texts.timeSpent[language]}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.average_quiz_score}%</div>
              <div className="text-xs text-gray-600">{texts.avgScore[language]}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.certificates_earned}</div>
              <div className="text-xs text-gray-600">{texts.certificatesEarned[language]}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-sm">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'explore'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {texts.exploreTab[language]}
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'progress'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {texts.progressTab[language]}
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'achievements'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {texts.achievementsTab[language]}
          </button>
        </div>

        {/* Content Grid */}
        {activeTab === 'explore' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">{texts.loading[language]}</p>
              </div>
            ) : content.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{texts.noContent[language]}</p>
              </div>
            ) : (
              content.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <div className="text-purple-600 group-hover:scale-110 transition-transform">
                      {getContentIcon(item.content_type)}
                    </div>
                    {item.user_progress > 0 && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        {item.user_progress}%
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(item.difficulty_level)}`}>
                        {texts.difficulty[item.difficulty_level as keyof typeof texts.difficulty][language]}
                      </span>
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.duration_minutes} {texts.minutes[language]}
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartContent(item)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 font-semibold"
                    >
                      <Play className="w-4 h-4" />
                      {item.user_progress > 0 ? texts.continueLearning[language] : texts.startLearning[language]}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            {userProgress.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No progress yet. Start learning!</p>
              </div>
            ) : (
              userProgress.map((progress: any) => (
                <div key={progress.content_id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {progress.ar_content_library?.title || 'Content'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {progress.completion_status === 'completed' ? texts.completed[language] : texts.inProgress[language]}
                      </p>
                    </div>
                    {progress.certificate_earned && (
                      <Award className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{texts.progress[language]}</span>
                      <span className="font-semibold">{progress.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {progress.time_spent_minutes} {texts.minutes[language]}
                    </span>
                    {progress.quiz_score !== null && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Score: {progress.quiz_score}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No achievements yet. Keep learning!</p>
              </div>
            ) : (
              achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm p-6 border-2 border-yellow-200"
                >
                  <Award className="w-12 h-12 text-yellow-600 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">{achievement.name}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ARPatientEducation;
