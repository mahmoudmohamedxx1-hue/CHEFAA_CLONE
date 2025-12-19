import React, { useState, useEffect } from 'react';
import { SecurityAPI } from '../lib/securityAPI';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Alert } from './ui/alert';

export default function TwoFactorSetup() {
  const { user } = useAuth();
  const [step, setStep] = useState<'check' | 'setup' | 'verify' | 'complete'>('check');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 2FA status
  const [status, setStatus] = useState<{
    totp_enabled: boolean;
    sms_enabled: boolean;
    backup_codes_remaining: number;
  } | null>(null);
  
  // Setup data
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const statusData = await SecurityAPI.get2FAStatus();
      setStatus(statusData);
      
      if (statusData.totp_enabled) {
        setStep('complete');
      } else {
        setStep('setup');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupTOTP = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await SecurityAPI.setupTOTP();
      setTotpSecret(result.secret);
      setQrCodeUrl(result.qr_code_url);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await SecurityAPI.verifyTOTP(verificationCode);
      
      if (result.success) {
        // Generate backup codes
        const codesResult = await SecurityAPI.generateBackupCodes();
        setBackupCodes(codesResult.backup_codes);
        setSuccess('2FA enabled successfully!');
        setStep('complete');
        await loadStatus();
      } else {
        setError('Invalid verification code');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const code = window.prompt('Enter your current 2FA code to disable:');
      if (!code) return;
      
      const result = await SecurityAPI.disable2FA(code);
      
      if (result.success) {
        setSuccess('2FA disabled successfully');
        await loadStatus();
        setStep('setup');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chefaa-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">Please log in to manage 2FA settings</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication (2FA)</h2>
      
      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
          {success}
        </Alert>
      )}

      {step === 'setup' && (
        <div className="space-y-4">
          <p className="text-gray-700">
            Protect your account with two-factor authentication. You'll need to enter a code from your authenticator app when you sign in.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">What you'll need:</h3>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Your phone or tablet to scan the QR code</li>
              <li>A safe place to store backup codes</li>
            </ul>
          </div>

          <Button
            onClick={handleSetupTOTP}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Setting up...' : 'Enable 2FA'}
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Scan QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use your authenticator app to scan this QR code
            </p>
            
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="2FA QR Code"
                className="mx-auto border-2 border-gray-300 rounded-lg p-2"
              />
            )}
            
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono break-all">
              {totpSecret}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Manual entry code (if QR code doesn't work)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Enter verification code from your app
            </label>
            <Input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>

          <Button
            onClick={handleVerifyTOTP}
            disabled={loading || verificationCode.length !== 6}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
          </Button>
        </div>
      )}

      {step === 'complete' && (
        <div className="space-y-4">
          {backupCodes.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">
                Save Your Backup Codes
              </h3>
              <p className="text-sm text-yellow-800 mb-3">
                Store these codes in a safe place. Each code can only be used once.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded font-mono text-sm text-center">
                    {code}
                  </div>
                ))}
              </div>
              
              <Button
                onClick={downloadBackupCodes}
                variant="outline"
                className="w-full"
              >
                Download Backup Codes
              </Button>
            </div>
          )}

          {status && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">2FA Enabled</h3>
                  <p className="text-sm text-green-700">
                    Your account is protected with two-factor authentication
                  </p>
                  {status.backup_codes_remaining > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      {status.backup_codes_remaining} backup codes remaining
                    </p>
                  )}
                </div>
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          )}

          <Button
            onClick={handleDisable2FA}
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            disabled={loading}
          >
            Disable 2FA
          </Button>
        </div>
      )}
    </Card>
  );
}
