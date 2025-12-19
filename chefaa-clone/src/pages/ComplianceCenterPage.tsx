import ComplianceCenter from '../components/ComplianceCenter';

type ComplianceCenterPageProps = {
  language: 'ar' | 'en';
};

export default function ComplianceCenterPage({ language }: ComplianceCenterPageProps) {
  return <ComplianceCenter language={language} />;
}
