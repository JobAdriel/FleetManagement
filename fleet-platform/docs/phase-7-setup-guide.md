# Phase 7 - Real-time Features Setup Instructions

## Required NPM Packages

Install these packages in both web-admin and web-client apps:

```bash
cd apps/web-admin
npm install laravel-echo pusher-js

cd ../web-client  
npm install laravel-echo pusher-js
```

## Laravel Backend Setup

### 1. Install Broadcasting Dependencies

```bash
cd apps/api
composer require pusher/pusher-php-server
```

### 2. Configure Environment Variables

Add to `.env`:

```env
BROADCAST_DRIVER=pusher

PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
```

**For local development with Laravel WebSockets:**

```bash
composer require beyondcode/laravel-websockets
php artisan websockets:serve
```

Then update `.env`:

```env
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=local
PUSHER_APP_KEY=local
PUSHER_APP_SECRET=local
PUSHER_APP_CLUSTER=mt1
PUSHER_HOST=127.0.0.1
PUSHER_PORT=6001
PUSHER_SCHEME=http
```

### 3. Configure Queue Worker

Broadcasting works best with queue workers running:

```bash
php artisan queue:work
```

## Frontend Setup

### 1. Environment Variables

Create/update `.env` or `.env.local` in web-admin and web-client:

```env
VITE_PUSHER_APP_KEY=local
VITE_PUSHER_APP_CLUSTER=mt1
VITE_PUSHER_HOST=127.0.0.1
VITE_PUSHER_PORT=6001
VITE_PUSHER_SCHEME=http
```

### 2. Initialize Echo in Your App

Update your main App component to include ToastProvider and Echo initialization:

```tsx
import { useEffect } from 'react';
import { ToastProvider } from './components/ToastNotification';
import { initializeEcho, disconnectEcho } from './services/echo';
import { useAuth } from './hooks/useAuth';

function App() {
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      initializeEcho(token);
    }
    
    return () => {
      disconnectEcho();
    };
  }, [token]);

  return (
    <ToastProvider>
      {/* Your app components */}
    </ToastProvider>
  );
}
```

### 3. Listen to Real-time Events

Example in NotificationCenter component:

```tsx
useEffect(() => {
  if (!token) return;

  const channel = window.Echo.private(`user.${userId}`);
  
  channel.listen('.notification.sent', (event: any) => {
    showToast({
      type: 'info',
      title: 'New Notification',
      message: event.payload.message || 'You have a new notification',
    });
    fetchNotifications(); // Refresh list
  });

  return () => {
    channel.stopListening('.notification.sent');
  };
}, [token, userId]);
```

## Testing Real-time Features

### 1. Start Backend Services

```bash
# Terminal 1: Queue worker
cd apps/api
php artisan queue:work

# Terminal 2: WebSocket server (if using laravel-websockets)
php artisan websockets:serve

# Terminal 3: API server
php artisan serve
```

### 2. Test Broadcasting

Create a test route in `routes/api.php`:

```php
Route::get('/test-broadcast', function () {
    $user = auth()->user();
    event(new \App\Events\NotificationSent(
        \App\Models\Notification::first()
    ));
    return 'Event broadcasted!';
})->middleware('auth:sanctum');
```

### 3. Monitor Events

Open browser console and check for:
- WebSocket connection established
- Event subscriptions
- Incoming broadcasts

## Usage Examples

### Drag-and-Drop Upload

Replace DocumentUpload with DragDropUpload:

```tsx
import DragDropUpload from '../components/DragDropUpload';

<DragDropUpload
  entityType="vehicle"
  entityId={vehicleId}
  onUploadSuccess={() => console.log('Upload complete!')}
  multiple={true}
/>
```

### Toast Notifications

```tsx
import { useToast } from '../components/ToastNotification';

function MyComponent() {
  const { showToast } = useToast();

  const handleAction = () => {
    showToast({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully',
      duration: 5000,
    });
  };
}
```

### Live Dashboard

```tsx
import LiveDashboard from '../pages/LiveDashboard';

// Add to your router
<Route path="/dashboard" element={<LiveDashboard />} />
```

## Troubleshooting

### WebSocket Connection Fails

1. Check CORS settings in `config/cors.php`
2. Verify Pusher credentials
3. Check browser console for connection errors
4. Ensure websockets:serve is running (if using laravel-websockets)

### Events Not Broadcasting

1. Verify queue worker is running
2. Check event implements `ShouldBroadcast`
3. Verify channel authorization in `routes/channels.php`
4. Check Laravel logs for errors

### Authentication Issues

1. Ensure token is passed in Echo initialization
2. Check Sanctum middleware on broadcast routes
3. Verify auth endpoint is accessible

## Production Deployment

### Pusher (Recommended for Production)

1. Sign up at pusher.com
2. Create an app
3. Copy credentials to `.env`
4. Update frontend `.env` with Pusher credentials
5. No need for websockets:serve

### Laravel WebSockets (Self-hosted)

1. Use process manager (Supervisor) for websockets:serve
2. Configure SSL/TLS for wss:// connections
3. Set up reverse proxy (nginx) for WebSocket traffic

## Alternative: Polling Fallback

If WebSockets are not available, keep polling-based updates:

```tsx
// Notification polling (existing implementation)
useEffect(() => {
  const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, []);
```

Both approaches can coexist - WebSocket for instant updates, polling as fallback.
