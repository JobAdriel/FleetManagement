const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

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

export const apiClient = {
  async request<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, token } = options;
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
