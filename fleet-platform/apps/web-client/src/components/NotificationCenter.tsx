import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import '../styles/NotificationCenter.css';

interface Notification {
  id: string;
  channel: string;
  template: string;
  payload: Record<string, unknown>;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export default function NotificationCenter() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await apiClient.get('/notifications', token);
      if (response.error) {
        throw new Error(response.error);
      }
      const data = response.data as { data?: Notification[] } | Notification[];
      const notifs = Array.isArray(data) ? data : data.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => n.status === 'pending').length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsSent = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await apiClient.patch(`/notifications/${notificationId}/mark-sent`, {}, token);
      if (response.error) {
        throw new Error(response.error);
      }
      fetchNotifications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark notification');
    }
  };

  const getNotificationMessage = (notif: Notification): string => {
    if (notif.payload?.message && typeof notif.payload.message === 'string') {
      return notif.payload.message;
    }
    return `${notif.template} notification`;
  };

  if (loading) return <div className="loading">Loading notifications...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount} unread</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">No notifications</div>
      ) : (
        <div className="notification-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${notif.status === 'pending' ? 'unread' : 'read'}`}
            >
              <div className="notification-content">
                <div className="notification-channel">
                  {notif.channel === 'in_app' ? '📱' : '📧'} {notif.channel}
                </div>
                <div className="notification-message">
                  {getNotificationMessage(notif)}
                </div>
                <div className="notification-time">
                  {new Date(notif.created_at).toLocaleString()}
                </div>
              </div>
              <div className="notification-actions">
                {notif.status === 'pending' && (
                  <button
                    onClick={() => markAsSent(notif.id)}
                    className="btn-small btn-success"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
