import AdminAnalyticsDashboard from '../components/AdminAnalyticsDashboard';

type AdminDashboardPageProps = {
  language: 'ar' | 'en';
};

export default function AdminDashboardPage({ language }: AdminDashboardPageProps) {
  return <AdminAnalyticsDashboard language={language} />;
}
