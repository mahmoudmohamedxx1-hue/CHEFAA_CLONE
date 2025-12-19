import DrugProvenanceTracker from '../components/DrugProvenanceTracker';

export default function DrugProvenancePage({ language }: { language: 'ar' | 'en' }) {
  return <DrugProvenanceTracker language={language} />;
}
