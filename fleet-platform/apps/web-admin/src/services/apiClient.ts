import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const DATA_PROVIDER = (import.meta.env.VITE_DATA_PROVIDER || 'api').toLowerCase();
const IS_FIREBASE_DATA = DATA_PROVIDER === 'firebase';

const VEHICLES_ENDPOINT = /^\/vehicles(?:\/([^/?]+))?(?:\?.*)?$/;
const DRIVERS_ENDPOINT = /^\/drivers(?:\/([^/?]+))?(?:\?.*)?$/;
const SERVICE_REQUESTS_ENDPOINT = /^\/service-requests(?:\/([^/?]+))?(?:\?.*)?$/;
const WORK_ORDERS_ENDPOINT = /^\/work-orders(?:\/([^/?]+))?(?:\?.*)?$/;
const INVOICES_ENDPOINT = /^\/invoices(?:\/([^/?]+))?(?:\?.*)?$/;
const QUOTES_ENDPOINT = /^\/quotes(?:\/([^/?]+))?(?:\?.*)?$/;
const VENDORS_ENDPOINT = /^\/vendors(?:\/([^/?]+))?(?:\?.*)?$/;
const APPROVALS_ENDPOINT = /^\/approvals(?:\/([^/?]+))?(?:\?.*)?$/;
const PREVENTIVE_RULES_ENDPOINT = /^\/preventive-rules(?:\/([^/?]+))?(?:\?.*)?$/;
const USERS_ENDPOINT = /^\/users(?:\/([^/?]+))?(?:\?.*)?$/;
const ROLES_ENDPOINT = /^\/roles(?:\/([^/?]+))?(?:\?.*)?$/;
const NOTIFICATIONS_ENDPOINT = /^\/notifications(?:\/([^/?]+))?(?:\?.*)?$/;
const NOTIFICATION_MARK_SENT_ENDPOINT = /^\/notifications\/([^/?]+)\/mark-sent(?:\?.*)?$/;

export const buildApiUrl = (endpoint: string): string => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

const resolveToken = (token?: string): string | undefined => {
  if (token) return token;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || undefined;
  }
  return undefined;
};

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

const getCurrentTenantId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as { tenant_id?: string };
    return user.tenant_id || null;
  } catch {
    return null;
  }
};

const withVehicleId = (id: string, data: Record<string, unknown>) => ({
  id,
  ...data,
});

const handleFirestoreCollection = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  matcher: RegExp,
  collectionName: string,
  notFoundMessage: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  const match = endpoint.match(matcher);
  if (!match) return null;

  const docId = match[1];
  const tenantId = getCurrentTenantId();

  if (method === 'GET' && !docId) {
    const ref = collection(db, collectionName);
    const snapshot = tenantId
      ? await getDocs(query(ref, where('tenant_id', '==', tenantId)))
      : await getDocs(ref);

    const items = snapshot.docs.map((item) => withVehicleId(item.id, item.data() as Record<string, unknown>));

    return {
      data: {
        data: items,
        current_page: 1,
        last_page: 1,
        per_page: items.length,
        total: items.length,
      },
      status: 200,
    };
  }

  if (method === 'GET' && docId) {
    const snapshot = await getDoc(doc(db, collectionName, docId));
    if (!snapshot.exists()) {
      return { error: notFoundMessage, status: 404 };
    }

    return {
      data: withVehicleId(snapshot.id, snapshot.data() as Record<string, unknown>),
      status: 200,
    };
  }

  if (method === 'POST' && !docId) {
    const payload = (body as Record<string, unknown>) || {};
    const now = new Date().toISOString();
    const data = {
      ...payload,
      tenant_id: tenantId || payload.tenant_id || 'default',
      created_at: now,
      updated_at: now,
    };

    const created = await addDoc(collection(db, collectionName), data);

    return {
      data: withVehicleId(created.id, data),
      status: 201,
    };
  }

  if ((method === 'PUT' || method === 'PATCH') && docId) {
    const payload = (body as Record<string, unknown>) || {};
    const data = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    await updateDoc(doc(db, collectionName, docId), data);

    return {
      data: withVehicleId(docId, data),
      status: 200,
    };
  }

  if (method === 'DELETE' && docId) {
    await deleteDoc(doc(db, collectionName, docId));
    return {
      data: { success: true },
      status: 200,
    };
  }

  return null;
};

const handleFirestoreVehicles = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, VEHICLES_ENDPOINT, 'vehicles', 'Vehicle not found', body);
};

const handleFirestoreDrivers = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, DRIVERS_ENDPOINT, 'drivers', 'Driver not found', body);
};

const handleFirestoreServiceRequests = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(
    method,
    endpoint,
    SERVICE_REQUESTS_ENDPOINT,
    'service_requests',
    'Service request not found',
    body
  );
};

const handleFirestoreWorkOrders = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, WORK_ORDERS_ENDPOINT, 'work_orders', 'Work order not found', body);
};

const handleFirestoreInvoices = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, INVOICES_ENDPOINT, 'invoices', 'Invoice not found', body);
};

const handleFirestoreQuotes = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, QUOTES_ENDPOINT, 'quotes', 'Quote not found', body);
};

const handleFirestoreVendors = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, VENDORS_ENDPOINT, 'vendors', 'Vendor not found', body);
};

const handleFirestoreApprovals = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, APPROVALS_ENDPOINT, 'approvals', 'Approval not found', body);
};

const handleFirestorePreventiveRules = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(
    method,
    endpoint,
    PREVENTIVE_RULES_ENDPOINT,
    'preventive_rules',
    'Preventive rule not found',
    body
  );
};

const handleFirestoreUsers = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, USERS_ENDPOINT, 'users', 'User not found', body);
};

const handleFirestoreRoles = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, ROLES_ENDPOINT, 'roles', 'Role not found', body);
};

const handleFirestoreNotificationMarkSent = async (
  method: ApiRequestOptions['method'],
  endpoint: string
): Promise<ApiResponse | null> => {
  if (method !== 'PATCH') return null;

  const match = endpoint.match(NOTIFICATION_MARK_SENT_ENDPOINT);
  if (!match) return null;

  const notificationId = match[1];
  const data = {
    status: 'sent',
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await updateDoc(doc(db, 'notifications', notificationId), data);
  return {
    data: {
      id: notificationId,
      ...data,
    },
    status: 200,
  };
};

const handleFirestoreNotifications = async (
  method: ApiRequestOptions['method'],
  endpoint: string,
  body?: unknown
): Promise<ApiResponse | null> => {
  return handleFirestoreCollection(method, endpoint, NOTIFICATIONS_ENDPOINT, 'notifications', 'Notification not found', body);
};

export const apiClient = {
  async request<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, token } = options;

    if (IS_FIREBASE_DATA) {
      try {
        const firebaseResponse =
          await handleFirestoreNotificationMarkSent(method, endpoint)
          || await handleFirestoreVehicles(method, endpoint, body)
          || await handleFirestoreDrivers(method, endpoint, body)
          || await handleFirestoreServiceRequests(method, endpoint, body)
          || await handleFirestoreWorkOrders(method, endpoint, body)
          || await handleFirestoreInvoices(method, endpoint, body)
          || await handleFirestoreQuotes(method, endpoint, body)
          || await handleFirestoreVendors(method, endpoint, body)
          || await handleFirestoreApprovals(method, endpoint, body)
          || await handleFirestorePreventiveRules(method, endpoint, body)
          || await handleFirestoreUsers(method, endpoint, body)
          || await handleFirestoreRoles(method, endpoint, body)
          || await handleFirestoreNotifications(method, endpoint, body);
        if (firebaseResponse) {
          return firebaseResponse as ApiResponse<T>;
        }
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Firestore request failed',
        };
      }
    }

    const resolvedToken = resolveToken(token);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (resolvedToken) {
      requestHeaders['Authorization'] = `Bearer ${resolvedToken}`;
    }

    const finalUrl = buildApiUrl(endpoint);
    console.log(`🌐 API Request: ${method} ${finalUrl}`);
    console.log(`   Headers:`, requestHeaders);
    if (body) console.log(`   Body:`, body);

    try {
      const response = await fetch(finalUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log(`🌐 API Response: ${method} ${finalUrl} - Status: ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const errorMessage =
          data && typeof data === 'object' && 'message' in data
            ? String((data as { message?: string }).message || 'Request failed')
            : 'Request failed';

        return {
          error: errorMessage,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  async get(endpoint: string, token?: string) {
    return this.request(endpoint, { token });
  },

  async post(endpoint: string, body: Record<string, unknown>, token?: string) {
    return this.request(endpoint, { method: 'POST', body, token });
  },

  async put(endpoint: string, body: Record<string, unknown>, token?: string) {
    return this.request(endpoint, { method: 'PUT', body, token });
  },

  async delete(endpoint: string, token?: string) {
    return this.request(endpoint, { method: 'DELETE', token });
  },

  async patch(endpoint: string, body: Record<string, unknown>, token?: string) {
    return this.request(endpoint, { method: 'PATCH', body, token });
  },

  // Vehicles
  async getVehicles(token: string, page = 1) {
    return this.request(`/vehicles?page=${page}`, { token });
  },

  async getVehicle(id: string, token: string) {
    return this.request(`/vehicles/${id}`, { token });
  },

  async createVehicle(vehicleData: Record<string, unknown>, token: string) {
    return this.request('/vehicles', {
      method: 'POST',
      body: vehicleData,
      token,
    });
  },

  async updateVehicle(id: string, vehicleData: Record<string, unknown>, token: string) {
    return this.request(`/vehicles/${id}`, {
      method: 'PUT',
      body: vehicleData,
      token,
    });
  },

  async deleteVehicle(id: string, token: string) {
    return this.request(`/vehicles/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  // Drivers
  async getDrivers(token: string, page = 1) {
    return this.request(`/drivers?page=${page}`, { token });
  },

  async getDriver(id: string, token: string) {
    return this.request(`/drivers/${id}`, { token });
  },

  async createDriver(driverData: Record<string, unknown>, token: string) {
    return this.request('/drivers', {
      method: 'POST',
      body: driverData,
      token,
    });
  },

  // Service Requests
  async getServiceRequests(token: string, page = 1) {
    return this.request(`/service-requests?page=${page}`, { token });
  },

  async createServiceRequest(srData: Record<string, unknown>, token: string) {
    return this.request('/service-requests', {
      method: 'POST',
      body: srData,
      token,
    });
  },

  // Quotes
  async getQuotes(token: string) {
    return this.request('/quotes', { token });
  },

  // Work Orders
  async getWorkOrders(token: string) {
    return this.request('/work-orders', { token });
  },

  // Invoices
  async getInvoices(token: string) {
    return this.request('/invoices', { token });
  },
};

export default apiClient;
