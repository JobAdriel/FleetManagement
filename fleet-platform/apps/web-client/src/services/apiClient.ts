const API_BASE_URL = 'http://localhost:8000/api';

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

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || 'Request failed',
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
