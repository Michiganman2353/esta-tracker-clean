const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

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
      }

      throw error;
    }

    return response.json();
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
}

export const apiClient = new ApiClient(API_URL);
