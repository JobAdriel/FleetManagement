import React, { useState } from 'react';
import axios from 'axios';

interface TwoFactorSetupProps {
  onEnabled: () => void;
  onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onEnabled, onCancel }) => {
  const [step, setStep] = useState<'enable' | 'confirm'>('enable');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const enable2FA = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/2fa/enable', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setRecoveryCodes(response.data.recovery_codes);
      setStep('confirm');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const confirm2FA = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/2fa/confirm', { code }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      onEnabled();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const downloadRecoveryCodes = () => {
    const text = recoveryCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'enable') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Enable Two-Factor Authentication</h3>
        <p className="text-sm text-gray-600 mb-6">
          Two-factor authentication adds an extra layer of security to your account.
          You'll need to enter a code from your authenticator app when you log in.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={enable2FA}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Setting up...' : 'Get Started'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Setup Authenticator App</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Step 1: Scan QR Code */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Step 1: Scan QR Code</h4>
          <p className="text-sm text-gray-600 mb-3">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Or enter this key manually: <code className="bg-gray-100 px-2 py-1 rounded">{secret}</code>
          </p>
        </div>

        {/* Step 2: Verify Code */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Step 2: Verify Code</h4>
          <p className="text-sm text-gray-600 mb-3">
            Enter the 6-digit code from your authenticator app
          </p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest"
            maxLength={6}
          />
        </div>

        {/* Step 3: Save Recovery Codes */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Step 3: Save Recovery Codes</h4>
          <p className="text-sm text-gray-600 mb-3">
            Keep these codes safe. You can use them to access your account if you lose your phone.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="bg-white px-3 py-2 rounded border border-gray-200">
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={downloadRecoveryCodes}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Download codes as text file
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={confirm2FA}
            disabled={loading || code.length !== 6}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verifying...' : 'Enable 2FA'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
