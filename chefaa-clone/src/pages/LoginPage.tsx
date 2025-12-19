import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type LoginPageProps = {
  language: 'ar' | 'en';
};

export default function LoginPage({ language }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/');
      } else {
        await signUp(email, password);
        setError(t(
          'تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.',
          'Account created successfully! Please log in.'
        ));
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || t('حدث خطأ', 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-base p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            {isLogin ? t('تسجيل الدخول', 'Login') : t('إنشاء حساب', 'Sign Up')}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t('البريد الإلكتروني', 'Email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {t('كلمة المرور', 'Password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-brand-blue-500 text-white rounded-lg font-bold hover:bg-brand-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading 
                ? t('جاري التحميل...', 'Loading...') 
                : isLogin 
                  ? t('تسجيل الدخول', 'Login')
                  : t('إنشاء حساب', 'Sign Up')
              }
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-brand-blue-500 hover:text-brand-blue-600 font-semibold"
            >
              {isLogin
                ? t('ليس لديك حساب؟ إنشاء حساب', "Don't have an account? Sign Up")
                : t('لديك حساب؟ تسجيل الدخول', 'Already have an account? Login')
              }
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-text-secondary hover:text-brand-blue-500">
              {t('العودة للرئيسية', 'Back to Home')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
