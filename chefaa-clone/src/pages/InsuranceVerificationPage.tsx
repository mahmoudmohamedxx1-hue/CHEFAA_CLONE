import InsuranceVerification from '../components/InsuranceVerification';

interface InsuranceVerificationPageProps {
  language: 'ar' | 'en';
}

export default function InsuranceVerificationPage({ language }: InsuranceVerificationPageProps) {
  return <InsuranceVerification language={language} />;
}
