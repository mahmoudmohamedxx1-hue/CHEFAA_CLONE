import ClinicalTrialMatching from '../components/ClinicalTrialMatching';

export default function TrialGPTPage({ language }: { language: 'ar' | 'en' }) {
  return <ClinicalTrialMatching language={language} />;
}
