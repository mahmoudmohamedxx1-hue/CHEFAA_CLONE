import React, { useState, useRef } from 'react';
import { Camera, Upload, Scan, CheckCircle, AlertTriangle, XCircle, Loader, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PillCharacteristics {
  imprint?: string;
  color?: string;
  shape?: string;
}

interface IdentifiedMedication {
  id: string;
  name: string;
  imprint: string;
  color: string;
  shape: string;
  imageUrl: string;
  manufacturer: string;
  dosage: string;
  description: string;
  isPrescription: boolean;
}

interface VerificationResult {
  sessionId: string;
  verificationStatus: 'identified' | 'uncertain' | 'not_found' | 'manual_review';
  confidenceScore: number;
  identifiedMedication: IdentifiedMedication | null;
  alternativeMatches: Array<{ id: string; name: string; confidence: number }>;
  prescriptionMatch: boolean;
  verificationDurationMs: number;
  recommendations: string[];
}

interface PillVerificationScannerProps {
  userId?: string;
  prescriptionMedications?: string[];
  onVerificationComplete?: (result: VerificationResult) => void;
}

export default function PillVerificationScanner({
  userId,
  prescriptionMedications = [],
  onVerificationComplete
}: PillVerificationScannerProps) {
  const [mode, setMode] = useState<'camera' | 'upload' | 'manual'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [characteristics, setCharacteristics] = useState<PillCharacteristics>({
    imprint: '',
    color: '',
    shape: ''
  });
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setImagePreview(imageData);
        stopCamera();
      }
    }
  };

  const performVerification = async () => {
    if (!imagePreview && (!characteristics.imprint && !characteristics.color && !characteristics.shape)) {
      setError('Please provide either an image or pill characteristics');
      return;
    }

    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('pill-identification', {
        body: {
          imageData: imagePreview,
          characteristics: mode === 'manual' ? characteristics : null,
          userId,
          prescriptionMedications
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.error) {
        throw new Error(data.error.message);
      }

      const verificationResult = data.data as VerificationResult;
      setResult(verificationResult);
      
      if (onVerificationComplete) {
        onVerificationComplete(verificationResult);
      }
    } catch (err: any) {
      console.error('Pill verification error:', err);
      setError(err.message || 'Failed to verify pill');
    } finally {
      setVerifying(false);
    }
  };

  const resetScanner = () => {
    setImagePreview(null);
    setCharacteristics({ imprint: '', color: '', shape: '' });
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'identified':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'uncertain':
        return <Info className="w-8 h-8 text-yellow-600" />;
      case 'manual_review':
        return <AlertTriangle className="w-8 h-8 text-orange-600" />;
      case 'not_found':
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Scan className="w-8 h-8 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identified':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'uncertain':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'manual_review':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'not_found':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <Scan className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pill Verification Scanner</h2>
            <p className="text-sm text-gray-600">AI-powered medication identification</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!result && (
          <>
            {/* Mode Selection */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setMode('upload')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Photo
              </button>
              <button
                onClick={() => { setMode('camera'); if (!cameraActive) startCamera(); }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Camera
              </button>
              <button
                onClick={() => { setMode('manual'); stopCamera(); }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Manual Entry
              </button>
            </div>

            {/* Upload Mode */}
            {mode === 'upload' && (
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Click to upload pill photo</p>
                  <p className="text-sm text-gray-500 mt-1">JPEG, PNG, or WebP (max 5MB)</p>
                </button>
              </div>
            )}

            {/* Camera Mode */}
            {mode === 'camera' && (
              <div className="mb-6">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  {cameraActive && (
                    <button
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:bg-gray-100"
                    >
                      Capture Photo
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Manual Entry Mode */}
            {mode === 'manual' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imprint (text/numbers on pill)</label>
                  <input
                    type="text"
                    value={characteristics.imprint || ''}
                    onChange={(e) => setCharacteristics({ ...characteristics, imprint: e.target.value })}
                    placeholder="e.g., L 10, BAYER"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="text"
                    value={characteristics.color || ''}
                    onChange={(e) => setCharacteristics({ ...characteristics, color: e.target.value })}
                    placeholder="e.g., White, Pink, Purple"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shape</label>
                  <select
                    value={characteristics.shape || ''}
                    onChange={(e) => setCharacteristics({ ...characteristics, shape: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select shape</option>
                    <option value="Round">Round</option>
                    <option value="Oval">Oval</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Square">Square</option>
                    <option value="Rectangle">Rectangle</option>
                  </select>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-6">
                <img src={imagePreview} alt="Pill preview" className="w-full max-h-64 object-contain rounded-lg border border-gray-200" />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Verification Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={performVerification}
                disabled={verifying || (!imagePreview && mode !== 'manual')}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {verifying ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5" />
                    <span>Verify Pill</span>
                  </>
                )}
              </button>
              {(imagePreview || characteristics.imprint || characteristics.color || characteristics.shape) && (
                <button
                  onClick={resetScanner}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Reset
                </button>
              )}
            </div>
          </>
        )}

        {/* Verification Result */}
        {result && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`border-2 rounded-lg p-6 ${getStatusColor(result.verificationStatus)}`}>
              <div className="flex items-center space-x-4 mb-4">
                {getStatusIcon(result.verificationStatus)}
                <div>
                  <h3 className="text-lg font-bold capitalize">{result.verificationStatus.replace('_', ' ')}</h3>
                  <p className="text-sm opacity-80">Confidence: {result.confidenceScore.toFixed(1)}%</p>
                </div>
              </div>
              
              {result.identifiedMedication && (
                <div className="bg-white rounded-lg p-4 mt-4">
                  <div className="flex items-start space-x-4">
                    {result.identifiedMedication.imageUrl && (
                      <img
                        src={result.identifiedMedication.imageUrl}
                        alt={result.identifiedMedication.name}
                        className="w-24 h-24 object-contain rounded-lg border border-gray-200"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">{result.identifiedMedication.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{result.identifiedMedication.dosage}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {result.identifiedMedication.shape}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {result.identifiedMedication.color}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {result.identifiedMedication.imprint}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{result.identifiedMedication.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Prescription Match */}
            {prescriptionMedications.length > 0 && (
              <div className={`border rounded-lg p-4 ${result.prescriptionMatch ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center space-x-2">
                  {result.prescriptionMatch ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className={`font-medium ${result.prescriptionMatch ? 'text-green-800' : 'text-yellow-800'}`}>
                    {result.prescriptionMatch ? 'Matches Prescription' : 'Does Not Match Prescription'}
                  </span>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternative Matches */}
            {result.alternativeMatches.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Alternative Matches</h3>
                <div className="space-y-2">
                  {result.alternativeMatches.map((match, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-sm text-gray-700">{match.name}</span>
                      <span className="text-xs text-gray-500">{match.confidence.toFixed(1)}% match</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={resetScanner}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Scan Another Pill
              </button>
            </div>

            {/* Metadata */}
            <div className="text-xs text-gray-500 pt-2">
              Verification completed in {result.verificationDurationMs}ms
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
