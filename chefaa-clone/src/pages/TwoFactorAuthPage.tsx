import { TwoFactorAuth } from '../components/TwoFactorAuth';

type TwoFactorAuthPageProps = {
  language: 'ar' | 'en';
};

export default function TwoFactorAuthPage({ language }: TwoFactorAuthPageProps) {
  return (
    <div className="min-h-screen bg-background-secondary py-12">
      <div className="container mx-auto px-4">
        <TwoFactorAuth />
      </div>
    </div>
  );
}
