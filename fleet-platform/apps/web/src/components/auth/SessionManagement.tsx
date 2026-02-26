import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Session {
  id: string;
  device_name: string;
  device_type: string;
  ip_address: string;
  last_activity_at: string;
  is_current: boolean;
  created_at: string;
}

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('/api/sessions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSessions(response.data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await axios.delete(`/api/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchSessions();
    } catch (err) {
      console.error('Failed to revoke session', err);
    } finally {
      setRevoking(null);
    }
  };

  const revokeOtherSessions = async () => {
    setLoading(true);
    try {
      await axios.post('/api/sessions/revoke-others', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchSessions();
    } catch (err) {
      console.error('Failed to revoke other sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const revokeAllSessions = async () => {
    setLoading(true);
    try {
      await axios.post('/api/sessions/revoke-all', { password }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      // User will be logged out, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke all sessions');
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'mobile') {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Active Sessions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage devices that are currently signed in to your account
            </p>
          </div>
          <button
            onClick={revokeOtherSessions}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            Revoke Other Sessions
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sessions.map((session) => (
          <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1 text-gray-400">
                  {getDeviceIcon(session.device_type)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    {session.device_name}
                    {session.is_current && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    IP Address: {session.ip_address}
                  </p>
                  <p className="text-sm text-gray-600">
                    Last active: {formatDate(session.last_activity_at)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Signed in: {formatDate(session.created_at)}
                  </p>
                </div>
              </div>

              {!session.is_current && (
                <button
                  onClick={() => revokeSession(session.id)}
                  disabled={revoking === session.id}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                >
                  {revoking === session.id ? 'Revoking...' : 'Revoke'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-gray-200bg-gray-50">
        <button
          onClick={() => setShowRevokeAll(!showRevokeAll)}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Revoke all sessions and sign out
        </button>

        {showRevokeAll && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 mb-3">
              This will sign you out from all devices. Enter your password to confirm.
            </p>
            <div className="flex gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={revokeAllSessions}
                disabled={!password}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowRevokeAll(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManagement;
