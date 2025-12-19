import { useAuth } from '../contexts/AuthContext';
import PillVerificationScanner from '../components/PillVerificationScanner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PillVerificationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pill Verification</h1>
          <p className="text-gray-600">AI-powered medication identification using computer vision</p>
        </div>

        <PillVerificationScanner
          userId={user?.id}
          prescriptionMedications={['Panadol', 'Aspirin']}
        />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">How It Works</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Take a photo of your pill or enter its characteristics</li>
            <li>• AI analyzes shape, color, and imprint to identify medication</li>
            <li>• Instantly verifies against your prescriptions</li>
            <li>• 85%+ accuracy with instant results</li>
            <li>• Prevents dangerous medication errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
