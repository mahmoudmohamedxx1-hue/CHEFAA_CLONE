import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Package, Heart, MapPin, CreditCard, Settings as SettingsIcon, LogOut, Loader2 } from 'lucide-react';

type ProfilePageProps = {
  language: 'ar' | 'en';
};

export default function ProfilePage({ language }: ProfilePageProps) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  // Redirect if not authenticated
  if (!loading && !user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">{t('جارٍ التحميل...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    {
      icon: Package,
      title: t('طلباتي', 'My Orders'),
      description: t('عرض جميع طلباتك السابقة', 'View all your past orders'),
      path: '/orders',
    },
    {
      icon: Heart,
      title: t('قائمة الرغبات', 'Wishlist'),
      description: t('المنتجات المحفوظة', 'Your saved products'),
      path: '/wishlist',
    },
    {
      icon: MapPin,
      title: t('العناوين', 'Addresses'),
      description: t('إدارة عناوين التوصيل', 'Manage delivery addresses'),
      path: '/addresses',
    },
    {
      icon: CreditCard,
      title: t('طرق الدفع', 'Payment Methods'),
      description: t('إدارة بطاقاتك ووسائل الدفع', 'Manage your cards and payment methods'),
      path: '/payment-methods',
    },
    {
      icon: SettingsIcon,
      title: t('الإعدادات', 'Settings'),
      description: t('إعدادات الحساب والتفضيلات', 'Account settings and preferences'),
      path: '/settings',
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-base p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-brand-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.email?.split('@')[0] || t('مستخدم', 'User')}
                </h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('تسجيل الخروج', 'Logout')}</span>
            </button>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-lg shadow-base p-6 text-left hover:shadow-hover transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-brand-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
