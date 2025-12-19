import ARPatientEducation from '../components/ARPatientEducation';

export default function AREducationPage({ language }: { language: 'ar' | 'en' }) {
  return <ARPatientEducation language={language} />;
}
