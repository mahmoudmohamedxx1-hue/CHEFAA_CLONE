import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { Upload, FileText, CheckCircle, AlertCircle, X, Camera, Eye } from 'lucide-react';

interface PrescriptionUploadProps {
  orderId?: string;
  onUploadComplete?: (verificationId: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

interface PrescriptionFile {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  url?: string;
  error?: string;
}

export const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({
  orderId,
  onUploadComplete,
  onClose,
  isModal = false
}) => {
  const [files, setFiles] = useState<PrescriptionFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setError('');
    
    // Validate files
    const validFiles: PrescriptionFile[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    
    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setError(`${file.name} has invalid format. Please upload JPG, PNG, WebP, or PDF files.`);
        continue;
      }
      
      if (file.size > maxSize) {
        setError(`${file.name} exceeds 10MB limit.`);
        continue;
      }
      
      const preview = file.type.startsWith('image/') 
        ? URL.createObjectURL(file)
        : '';
      
      validFiles.push({
        file,
        preview,
        status: 'pending'
      });
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('prescriptions')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('prescriptions')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const analyzeImage = async (imageUrl: string): Promise<any> => {
    // Simulate image analysis (OCR/AI processing)
    // In production, this would call an edge function with OCR service
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    
    // Simulated analysis results
    return {
      confidence: 0.85,
      detected_text: [
        'Dr. Ahmed Hassan',
        'Medical License: 12345',
        'Patient: [Extracted Name]',
        'Date: ' + new Date().toLocaleDateString()
      ],
      is_valid: true,
      contains_prescription: true,
      medications_detected: ['Medication A', 'Medication B'],
      warnings: []
    };
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    if (!patientName.trim()) {
      setError('Please enter patient name');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload all files
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i].status = 'uploading';
          return newFiles;
        });

        try {
          const url = await uploadFile(files[i].file);
          uploadedUrls.push(url);
          
          setFiles(prev => {
            const newFiles = [...prev];
            newFiles[i].status = 'uploaded';
            newFiles[i].url = url;
            return newFiles;
          });
        } catch (err: any) {
          setFiles(prev => {
            const newFiles = [...prev];
            newFiles[i].status = 'error';
            newFiles[i].error = err.message;
            return newFiles;
          });
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error('No files were uploaded successfully');
      }

      // Analyze first image for verification
      const analysis = await analyzeImage(uploadedUrls[0]);

      // Create prescription verification record
      const { data: verification, error: verificationError } = await supabase
        .from('prescription_verifications')
        .insert({
          user_id: user.id,
          order_id: orderId || null,
          prescription_url: uploadedUrls[0],
          additional_urls: uploadedUrls.slice(1),
          patient_name: patientName,
          doctor_name: doctorName || null,
          prescription_date: prescriptionDate || null,
          verification_status: 'pending',
          ai_confidence_score: analysis.confidence,
          detected_medications: analysis.medications_detected,
          verification_notes: notes || null,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (verificationError) throw verificationError;

      setVerificationId(verification.id);
      setVerificationStatus('pending');
      setSuccess('Prescription uploaded successfully! Our pharmacist will review it shortly.');

      // Log audit event
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'prescription_upload',
          resource_type: 'prescription',
          resource_id: verification.id,
          details: {
            files_count: uploadedUrls.length,
            ai_confidence: analysis.confidence,
            patient_name: patientName
          }
        });

      if (onUploadComplete) {
        onUploadComplete(verification.id);
      }

      // Reset form after 3 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to upload prescription');
    } finally {
      setUploading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Prescription</h2>
            <p className="text-sm text-gray-600">Upload your doctor's prescription for verification</p>
          </div>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {!verificationId && (
        <>
          {/* Information Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Requirements:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Clear image of valid prescription from licensed doctor</li>
              <li>• File format: JPG, PNG, WebP, or PDF</li>
              <li>• Maximum file size: 10MB per file</li>
              <li>• Prescription must be legible and not expired</li>
            </ul>
          </div>

          {/* Patient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name as on prescription"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Prescribing doctor's name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescription Date
              </label>
              <input
                type="date"
                value={prescriptionDate}
                onChange={(e) => setPrescriptionDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Click to upload prescription files</p>
              <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP, or PDF up to 10MB</p>
            </button>
          </div>

          {/* Uploaded Files Preview */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Selected Files ({files.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((fileData, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    {fileData.preview && (
                      <div className="mb-3">
                        <img
                          src={fileData.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileData.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="mt-2">
                          {fileData.status === 'pending' && (
                            <span className="text-xs text-gray-500">Ready to upload</span>
                          )}
                          {fileData.status === 'uploading' && (
                            <span className="text-xs text-blue-600">Uploading...</span>
                          )}
                          {fileData.status === 'uploaded' && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs">Uploaded</span>
                            </div>
                          )}
                          {fileData.status === 'error' && (
                            <span className="text-xs text-red-600">{fileData.error}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                        className="ml-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0 || !patientName.trim()}
            className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading & Verifying...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload Prescription</span>
              </>
            )}
          </button>
        </>
      )}

      {/* Verification Status */}
      {verificationId && (
        <div className="bg-white border-2 border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Prescription Submitted</h3>
          <p className="text-gray-700 mb-4">
            Your prescription has been uploaded and is being reviewed by our licensed pharmacist.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Verification ID:</span>
                <span className="font-mono font-medium">{verificationId.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                  Pending Review
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Patient:</span>
                <span className="font-medium">{patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Files:</span>
                <span className="font-medium">{files.length}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            You will be notified once the verification is complete (typically within 1-2 hours)
          </p>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
          {content}
        </div>
      </div>
    );
  }

  return <div className="max-w-3xl mx-auto">{content}</div>;
};
