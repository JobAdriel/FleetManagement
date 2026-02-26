import { vi } from 'vitest';

/**
 * Mock fetch responses
 */
export const mockFetch = (data: any, status = 200) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Headers(),
      redirected: false,
      statusText: 'OK',
      type: 'basic',
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => new Blob(),
      formData: async () => new FormData(),
      bytes: async () => new Uint8Array(),
    } as Response)
  ) as any;
};

/**
 * Mock fetch error
 */
export const mockFetchError = (error: string) => {
  global.fetch = vi.fn(() => Promise.reject(new Error(error))) as any;
};

/**
 * Mock successful API response with data
 */
export const mockApiSuccess = (data: any) => {
  mockFetch({ data }, 200);
};

/**
 * Mock API error response
 */
export const mockApiError = (message: string, status = 400) => {
  mockFetch({ message, errors: {} }, status);
};

/**
 * Mock validation errors
 */
export const mockValidationErrors = (errors: Record<string, string[]>) => {
  mockFetch({ message: 'Validation failed', errors }, 422);
};

/**
 * Create mock file for testing file uploads
 */
export const createMockFile = (
  name: string,
  size: number,
  type: string
): File => {
  const blob = new Blob(['a'.repeat(size)], { type });
  return new File([blob], name, { type });
};

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: 0,
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

/**
 * Mock authentication token
 */
export const mockAuthToken = (token = 'test-token-123') => {
  const storage = mockLocalStorage();
  storage.setItem('auth_token', token);
  global.localStorage = storage as any;
  return token;
};

/**
 * Mock WebSocket/Echo connection
 */
export const mockEcho = () => {
  const listeners: Record<string, Function[]> = {};

  return {
    private: vi.fn((_channel: string) => ({
      listen: vi.fn((event: string, callback: Function) => {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event].push(callback);
        return {
          stopListening: vi.fn(),
        };
      }),
      notification: vi.fn(),
      listenForWhisper: vi.fn(),
    })),
    channel: vi.fn((_channel: string) => ({
      listen: vi.fn(),
    })),
    leave: vi.fn(),
    disconnect: vi.fn(),
    // Helper to trigger events
    trigger: (event: string, data: any) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(data));
      }
    },
  };
};

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock XMLHttpRequest for upload progress
 */
export const mockXHR = () => {
  const mockXHR = {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    abort: vi.fn(),
    status: 200,
    responseText: JSON.stringify({ data: { id: 'test-id' } }),
    upload: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

  return mockXHR;
};

/**
 * Create mock user data
 */
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  tenant_id: 'tenant-123',
  role: 'user',
  ...overrides,
});

/**
 * Create mock vehicle data
 */
export const createMockVehicle = (overrides = {}) => ({
  id: 'vehicle-123',
  tenant_id: 'tenant-123',
  plate: 'ABC-1234',
  vin: 'TEST1234567890123',
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  status: 'active',
  mileage: 15000,
  ...overrides,
});

/**
 * Create mock notification data
 */
export const createMockNotification = (overrides = {}) => ({
  id: 'notification-123',
  tenant_id: 'tenant-123',
  user_id: 'user-123',
  type: 'info',
  title: 'Test Notification',
  message: 'This is a test notification',
  is_sent: false,
  sent_at: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock document data
 */
export const createMockDocument = (overrides = {}) => ({
  id: 'document-123',
  tenant_id: 'tenant-123',
  entity_type: 'vehicle',
  entity_id: 'vehicle-123',
  file_name: 'test-document.pdf',
  file_path: 'documents/test-document.pdf',
  file_size: 1024000,
  mime_type: 'application/pdf',
  category: 'registration',
  uploaded_by: 'user-123',
  created_at: new Date().toISOString(),
  ...overrides,
});
