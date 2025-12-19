import UserSecuritySettings from '../components/UserSecuritySettings';

type UserSecurityPageProps = {
  language: 'ar' | 'en';
};

export default function UserSecurityPage({ language }: UserSecurityPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <UserSecuritySettings language={language} />
      </div>
    </div>
  );
}
