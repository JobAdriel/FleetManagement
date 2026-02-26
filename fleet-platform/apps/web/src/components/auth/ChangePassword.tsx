import React, { useState } from 'react';

const ChangePassword: React.FC = () => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPasswordErrors([]);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.errors?.new_password) {
          setPasswordErrors(data.errors.new_password);
        } else {
          setError(data?.message || 'Failed to change password');
        }
        return;
      }

      setSuccess(true);
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.new_password);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Change Password</h3>
      <p className="text-sm text-gray-600 mb-6">
        Update your password regularly to keep your account secure
      </p>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">
            Password changed successfully. All other sessions have been logged out.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {passwordErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm font-medium text-red-800 mb-2">Password requirements:</p>
          <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
            {passwordErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <input
            type="password"
            id="current_password"
            value={formData.current_password}
            onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            type="password"
            id="new_password"
            value={formData.new_password}
            onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {formData.new_password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {passwordStrength.label}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Must contain: 8+ characters, uppercase, lowercase, number, special character
              </p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            id="new_password_confirmation"
            value={formData.new_password_confirmation}
            onChange={(e) => setFormData({ ...formData, new_password_confirmation: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Security tip:</strong> Use a unique password that you don't use on other sites.
          Avoid common passwords and consider using a password manager.
        </p>
      </div>
    </div>
  );
};

export default ChangePassword;
