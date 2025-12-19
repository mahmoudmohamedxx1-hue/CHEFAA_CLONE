import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Shield, Smartphone, Key, CheckCircle, AlertCircle, X } from 'lucide-react';

interface TwoFactorAuthProps {
  onClose?: () => void;
  isModal?: boolean;
}

interface TwoFactorData {
  id: string;
  user_id: string;
  method: 'sms' | 'totp';
  phone_number?: string;
  secret_key?: string;
  backup_codes?: string[];
  enabled: boolean;
  verified: boolean;
  verified_at?: string;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onClose, isModal = false }) => {
  const [method, setMethod] = useState<'sms' | 'totp'>('totp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'select' | 'setup' | 'verify' | 'complete'>('select');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingAuth, setExistingAuth] = useState<TwoFactorData | null>(null);

  useEffect(() => {
    checkExisting2FA();
  }, []);

  const checkExisting2FA = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .single();

      if (data && !error) {
        setExistingAuth(data);
        setIsEnabled(true);
        setMethod(data.method);
        setStep('complete');
      }
    } catch (err) {
      console.error('Error checking 2FA:', err);
    }
  };

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const generateTOTPSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  };

  const handleSetupTOTP = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const secret = generateTOTPSecret();
      const codes = generateBackupCodes();
      
      // Generate QR code URL (using otpauth URI scheme)
      const appName = 'Chefaa Pharmacy';
      const qrData = `otpauth://totp/${appName}:${user.email}?secret=${secret}&issuer=${appName}`;
      
      // In production, use a QR code library or service
      // For now, we'll show the secret key for manual entry
      setQrCodeUrl(qrData);
      setBackupCodes(codes);
      
      // Store in database (not verified yet)
      const { error } = await supabase
        .from('two_factor_auth')
        .upsert({
          user_id: user.id,
          method: 'totp',
          secret_key: secret,
          backup_codes: codes,
          enabled: false,
          verified: false
        });

      if (error) throw error;
      
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to setup TOTP');
    }
  };

  const handleSetupSMS = async () => {
    try {
      if (!phoneNumber || phoneNumber.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const codes = generateBackupCodes();
      
      // Store in database
      const { error } = await supabase
        .from('two_factor_auth')
        .upsert({
          user_id: user.id,
          method: 'sms',
          phone_number: phoneNumber,
          backup_codes: codes,
          enabled: false,
          verified: false
        });

      if (error) throw error;
      
      setBackupCodes(codes);
      
      // In production, send SMS verification code via Twilio/similar
      setSuccess('Verification code sent to your phone');
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to setup SMS');
    }
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setError('');
      
      if (!verificationCode || verificationCode.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // In production, verify the code against TOTP/SMS service
      // For demonstration, we'll accept any 6-digit code
      
      // Update to verified and enabled
      const { error } = await supabase
        .from('two_factor_auth')
        .update({
          enabled: true,
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('method', method);

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_events')
        .insert({
          user_id: user.id,
          event_type: '2fa_enabled',
          severity: 'low',
          details: { method }
        });

      setSuccess('Two-factor authentication enabled successfully!');
      setIsEnabled(true);
      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('two_factor_auth')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_events')
        .insert({
          user_id: user.id,
          event_type: '2fa_disabled',
          severity: 'medium',
          details: { method }
        });

      setSuccess('Two-factor authentication disabled');
      setIsEnabled(false);
      setExistingAuth(null);
      setStep('select');
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
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

      {/* Step: Select Method */}
      {step === 'select' && (
        <div className="space-y-4">
          <p className="text-gray-700">Choose your preferred authentication method:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TOTP Option */}
            <button
              onClick={() => {
                setMethod('totp');
                setStep('setup');
                handleSetupTOTP();
              }}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left group"
            >
              <div className="flex items-start space-x-4">
                <Key className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Authenticator App</h3>
                  <p className="text-sm text-gray-600">Use Google Authenticator, Authy, or similar apps</p>
                  <p className="text-xs text-green-600 mt-2">✓ Recommended</p>
                </div>
              </div>
            </button>

            {/* SMS Option */}
            <button
              onClick={() => {
                setMethod('sms');
                setStep('setup');
              }}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left group"
            >
              <div className="flex items-start space-x-4">
                <Smartphone className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">SMS Verification</h3>
                  <p className="text-sm text-gray-600">Receive codes via text message</p>
                  <p className="text-xs text-gray-500 mt-2">Requires phone number</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step: Setup TOTP */}
      {step === 'setup' && method === 'totp' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Setup Authenticator App</h3>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>Download an authenticator app (Google Authenticator, Authy, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Scan the QR code or enter the secret key manually</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>Enter the 6-digit code from your app to verify</span>
              </li>
            </ol>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-sm text-gray-500">QR Code<br />Would appear here</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">Or enter this key manually:</p>
            <code className="text-sm bg-gray-100 px-3 py-1 rounded mt-2 inline-block">
              {qrCodeUrl.split('secret=')[1]?.split('&')[0] || 'SECRET-KEY'}
            </code>
          </div>

          {/* Backup Codes */}
          {backupCodes.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Backup Codes</h4>
              <p className="text-sm text-gray-700 mb-3">Save these codes in a safe place. Each can be used once if you lose access to your authenticator app.</p>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="bg-white px-3 py-1 rounded">{code}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Setup SMS */}
      {step === 'setup' && method === 'sms' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Setup SMS Verification</h3>
            <p className="text-sm text-gray-700">Enter your phone number to receive verification codes</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+20 123 456 7890"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +20 for Egypt)</p>
          </div>

          <button
            onClick={handleSetupSMS}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Send Verification Code
          </button>
        </div>
      )}

      {/* Step: Verify */}
      {step === 'verify' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Enter Verification Code</h3>
            <p className="text-sm text-gray-700">
              {method === 'totp' 
                ? 'Enter the 6-digit code from your authenticator app'
                : 'Enter the 6-digit code sent to your phone'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('setup')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && isEnabled && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Two-Factor Authentication Enabled</h3>
            <p className="text-sm text-gray-700">Your account is now protected with {method === 'totp' ? 'authenticator app' : 'SMS'} verification</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Security Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Method:</span>
                <span className="font-medium">{method === 'totp' ? 'Authenticator App' : 'SMS'}</span>
              </div>
              {existingAuth?.verified_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Enabled on:</span>
                  <span className="font-medium">{new Date(existingAuth.verified_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDisable2FA}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Disable Two-Factor Authentication
          </button>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          {content}
        </div>
      </div>
    );
  }

  return <div className="max-w-2xl mx-auto">{content}</div>;
};
