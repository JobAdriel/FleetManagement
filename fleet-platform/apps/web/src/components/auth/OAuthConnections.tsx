import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface OAuthConnection {
  provider: string;
  provider_email: string;
  connected_at: string;
}

const OAuthConnections: React.FC = () => {
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const providers = [
    { id: 'google', name: 'Google', color: 'bg-red-600 hover:bg-red-700', icon: '🔴' },
    { id: 'github', name: 'GitHub', color: 'bg-gray-900 hover:bg-gray-800', icon: '⚫' },
    { id: 'microsoft', name: 'Microsoft', color: 'bg-blue-600 hover:bg-blue-700', icon: '🔵' },
  ];

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await axios.get('/api/oauth/connections', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setConnections(response.data.connections);
    } catch (err) {
      console.error('Failed to fetch connections', err);
    } finally {
      setLoading(false);
    }
  };

  const connectProvider = async (provider: string) => {
    setConnecting(provider);
    try {
      const response = await axios.get(`/api/oauth/${provider}/redirect`);
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        response.data.redirect_url,
        'OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'oauth-success') {
          await fetchConnections();
          setConnecting(null);
        }
      });
    } catch (err) {
      console.error('Failed to connect provider', err);
      setConnecting(null);
    }
  };

  const disconnectProvider = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/oauth/${provider}/disconnect`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchConnections();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to disconnect provider');
    }
  };

  const isConnected = (providerId: string) => {
    return connections.find((c) => c.provider === providerId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Connected Accounts</h3>
      <p className="text-sm text-gray-600 mb-6">
        Connect your account with third-party providers for easier sign-in
      </p>

      <div className="space-y-4">
        {providers.map((provider) => {
          const connection = isConnected(provider.id);
          
          return (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{provider.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                  {connection ? (
                    <p className="text-sm text-gray-600">
                      Connected as {connection.provider_email}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Not connected</p>
                  )}
                </div>
              </div>

              <div>
                {connection ? (
                  <button
                    onClick={() => disconnectProvider(provider.id)}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connectProvider(provider.id)}
                    disabled={connecting === provider.id}
                    className={`px-4 py-2 text-sm text-white rounded-md transition-colors disabled:opacity-50 ${provider.color}`}
                  >
                    {connecting === provider.id ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Connecting an account allows you to sign in using that provider.
          You can disconnect accounts at any time.
        </p>
      </div>
    </div>
  );
};

export default OAuthConnections;
