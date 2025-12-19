import SecurityDashboard from '../components/SecurityDashboard';

type SecurityDashboardPageProps = {
  language: 'ar' | 'en';
};

export default function SecurityDashboardPage({ language }: SecurityDashboardPageProps) {
  return <SecurityDashboard language={language} />;
}
