const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
  isNetworkError?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private readonly timeout: number = 30000; // 30 seconds
  private readonly maxRetries: number = 2;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async requestWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge additional headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await this.requestWithTimeout(
        url,
        {
          ...options,
          headers,
          credentials: 'include',
        },
        this.timeout
      );

      if (!response.ok) {
        const error: ApiError = {
          message: 'An error occurred',
          status: response.status,
        };

        try {
          const data = await response.json();
          error.message = data.message || error.message;
          error.errors = data.errors;
        } catch {
          // Response doesn't have JSON body
          error.message = `HTTP ${response.status}: ${response.statusText}`;
        }

        throw error;
      }

      return response.json();
    } catch (error) {
      // Handle network errors, timeouts, and CORS issues
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const timeoutError: ApiError = {
            message: 'Request timed out. Please check your connection and try again.',
            status: 0,
            isNetworkError: true,
          };
          throw timeoutError;
        }

        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          // Retry logic for network errors
          if (retryCount < this.maxRetries) {
            console.warn(`Network error, retrying... (${retryCount + 1}/${this.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return this.request<T>(endpoint, options, retryCount + 1);
          }

          const networkError: ApiError = {
            message: 'Unable to connect to the server. Please check your internet connection and try again.',
            status: 0,
            isNetworkError: true,
          };
          throw networkError;
        }
      }

      // Re-throw API errors
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: unknown }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { email: string; password: string; name: string }) {
    return this.request<{ token: string; user: unknown }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async registerEmployee(data: { email: string; password: string; name: string }) {
    return this.request<{ token: string; user: unknown }>('/api/v1/auth/register/employee', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async registerManager(data: { 
    email: string; 
    password: string; 
    name: string;
    companyName: string;
    employeeCount: number;
  }) {
    return this.request<{ token: string; user: unknown }>('/api/v1/auth/register/manager', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request('/api/v1/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request<{ user: unknown }>('/api/v1/auth/me');
  }

  // Accrual & Balance
  async getBalance(userId: string) {
    return this.request(`/api/v1/accrual/balance/${userId}`);
  }

  async getWorkLogs(userId: string, year?: number) {
    const params = year ? `?year=${year}` : '';
    return this.request(`/api/v1/accrual/work-logs/${userId}${params}`);
  }

  async logWorkHours(data: { userId: string; hours: number; date: string }) {
    return this.request('/api/v1/accrual/log-work', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Sick Time Requests
  async createRequest(data: {
    hours: number;
    isPaid: boolean;
    category: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    return this.request('/api/v1/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRequests(filters?: { status?: string; userId?: string }) {
    const params = new URLSearchParams(filters as Record<string, string>);
    return this.request(`/api/v1/requests?${params}`);
  }

  async updateRequest(requestId: string, status: 'approved' | 'denied', denialReason?: string) {
    return this.request(`/api/v1/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, denialReason }),
    });
  }

  // Audit Trail
  async getAuditLog(filters?: {
    userId?: string;
    employerId?: string;
    startDate?: string;
    endDate?: string;
    action?: string;
  }) {
    const params = new URLSearchParams(filters as Record<string, string>);
    return this.request(`/api/v1/audit/logs?${params}`);
  }

  async exportAudit(format: 'pdf' | 'csv', filters?: {
    employerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams({
      format,
      ...(filters as Record<string, string>),
    });
    return this.request(`/api/v1/audit/export?${params}`);
  }

  // Retaliation Reports
  async reportRetaliation(data: {
    incidentDate: string;
    description: string;
    relatedRequestId?: string;
  }) {
    return this.request('/api/v1/retaliation/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRetaliationReports(employerId?: string) {
    const params = employerId ? `?employerId=${employerId}` : '';
    return this.request(`/api/v1/retaliation/reports${params}`);
  }

  // Employer Management
  async getEmployees() {
    return this.request('/api/v1/employer/employees');
  }

  async updateEmployerSettings(data: unknown) {
    return this.request('/api/v1/employer/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Encryption & Decryption
  /**
   * Decrypt encrypted data using the secure decrypt endpoint
   * Requires authentication and authorization
   * 
   * @param payload - Encrypted payload (encryptedData, encryptedAESKey, iv, authTag)
   * @param privateKey - RSA private key in PEM format
   * @param resourceOwnerId - Optional: User ID that owns the encrypted data
   * @param tenantId - Optional: Tenant ID for the encrypted data
   * @returns Decrypted data
   */
  async decryptData(
    payload: {
      encryptedData: string;
      encryptedAESKey: string;
      iv: string;
      authTag: string;
    },
    privateKey: string,
    resourceOwnerId?: string,
    tenantId?: string
  ) {
    return this.request<{ success: boolean; decrypted: string }>('/api/secure/decrypt', {
      method: 'POST',
      body: JSON.stringify({
        payload,
        privateKey,
        resourceOwnerId,
        tenantId
      }),
    });
  }
}

export const apiClient = new ApiClient(API_URL);
