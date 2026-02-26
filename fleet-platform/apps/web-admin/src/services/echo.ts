// Echo configuration for Laravel Broadcasting
// Install dependencies: npm install laravel-echo pusher-js

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<'pusher'> | null;
  }
}

window.Pusher = Pusher;

export const initializeEcho = (token: string) => {
  window.Echo = new Echo<'pusher'>({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'local',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_PUSHER_PORT ? parseInt(import.meta.env.VITE_PUSHER_PORT) : 6001,
    wssPort: import.meta.env.VITE_PUSHER_PORT ? parseInt(import.meta.env.VITE_PUSHER_PORT) : 6001,
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || 'https') === 'https',
    encrypted: true,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
    authEndpoint: 'http://localhost:8000/broadcasting/auth',
  });

  return window.Echo;
};

export const disconnectEcho = () => {
  if (window.Echo) {
    window.Echo.disconnect();
  }
};

export default { initializeEcho, disconnectEcho };
