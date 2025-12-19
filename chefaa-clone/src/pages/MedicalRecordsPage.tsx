import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MedicalRecordsDashboard from '../components/MedicalRecords';
import { Shield } from 'lucide-react';

interface MedicalRecordsPageProps {
  language: 'ar' | 'en';
}

const MedicalRecordsPage: React.FC<MedicalRecordsPageProps> = ({ language }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MedicalRecordsDashboard language={language} />
    </div>
  );
};

export default MedicalRecordsPage;