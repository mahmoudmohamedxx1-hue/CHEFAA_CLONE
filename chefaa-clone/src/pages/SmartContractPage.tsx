import SmartContractPrescription from '../components/SmartContractPrescription';

export default function SmartContractPage({ language }: { language: 'ar' | 'en' }) {
  return <SmartContractPrescription language={language} />;
}
