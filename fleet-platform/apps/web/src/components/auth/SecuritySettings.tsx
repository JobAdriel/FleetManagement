import React, { useState } from 'react';
import TwoFactorSetup from './TwoFactorSetup';
import SessionManagement from './SessionManagement';
import OAuthConnections from './OAuthConnections';
import ChangePassword from './ChangePassword';

const SecuritySettings: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | '2fa' | 'sessions' | 'oauth'>('password');

  const tabs = [
    { id: 'password', name: 'Password', icon: '🔐' },
    { id: '2fa', name: 'Two-Factor Auth', icon: '🛡️' },
    { id: 'sessions', name: 'Active Sessions', icon: '📱' },
    { id: 'oauth', name: 'Connected Accounts', icon: '🔗' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account security, passwords, and authentication methods
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'password' && <ChangePassword />}

        {activeTab === '2fa' && (
          <div>
            {!twoFactorEnabled && !showTwoFactorSetup ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                  You'll need to enter a code from your phone in addition to your password when signing in.
                </p>
                <button
                  onClick={() => setShowTwoFactorSetup(true)}
                  className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Enable Two-Factor Authentication
                </button>
              </div>
            ) : showTwoFactorSetup ? (
              <TwoFactorSetup
                onEnabled={() => {
                  setTwoFactorEnabled(true);
                  setShowTwoFactorSetup(false);
                }}
                onCancel={() => setShowTwoFactorSetup(false)}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      Two-Factor Authentication
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        Enabled
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Your account is protected with two-factor authentication.
                    </p>
                  </div>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                    Disable
                  </button>
                </div>

                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>✓ Protected:</strong> Your account requires a verification code when signing in from new devices.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && <SessionManagement />}

        {activeTab === 'oauth' && <OAuthConnections />}
      </div>
    </div>
  );
};

export default SecuritySettings;
