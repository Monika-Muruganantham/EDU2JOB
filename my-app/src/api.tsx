import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  UserProfile,
  JobPrediction,
  PredictionHistory,
  Certification,
} from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

class ApiClient {
  // ===============================
  // TOKEN HANDLING
  // ===============================
  private getToken(): string | null {
    return localStorage.getItem('access');
  }

  private setToken(token: string): void {
    localStorage.setItem('access', token);
  }

  private clearToken(): void {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('admin_access');
  }

  // ===============================
  // CORE REQUEST METHOD
  // ===============================
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    admin: boolean = false
  ): Promise<T> {
    const token = admin
      ? localStorage.getItem('admin_access')
      : this.getToken();

    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) this.clearToken();
      const text = await response.text();
      throw new Error(text || 'Request failed');
    }

    return response.json() as Promise<T>;
  }

  // ===============================
  // AUTH
  // ===============================
  async login(data: LoginCredentials): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setToken(res.access);
    localStorage.setItem('refresh', res.refresh);
    return res;
  }

  async googleLogin(credential: string) {
    const res = await this.request<{ access: string; refresh: string }>(
      '/api/auth/google/',
      {
        method: 'POST',
        body: JSON.stringify({ credential }),
      }
    );

    this.setToken(res.access);
    localStorage.setItem('refresh', res.refresh);
    return res;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setToken(res.access);
    localStorage.setItem('refresh', res.refresh);
    return res;
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/me/');
  }

  // ===============================
  // PROFILE
  // ===============================
  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const payload = {
      ...profile,
      skills: Array.isArray(profile.skills)
        ? profile.skills.join(', ')
        : profile.skills,
    };

    return this.request<UserProfile>('/api/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // ===============================
  // JOB PREDICTION
  // ===============================
  async predictJob(education: UserProfile): Promise<JobPrediction> {
    return this.request<JobPrediction>('/api/auth/predict/', {
      method: 'POST',
      body: JSON.stringify(education),
    });
  }

  async getPredictionHistory(): Promise<PredictionHistory[]> {
    return this.request<PredictionHistory[]>('/api/auth/predictions/');
  }

  // ===============================
  // CERTIFICATIONS
  // ===============================
  async addCertificationWithPDF(formData: FormData): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      '/api/auth/add-certification/',
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async getCertifications(): Promise<Certification[]> {
    return this.request<Certification[]>('/api/auth/certifications/');
  }

  // ===============================
  // FEEDBACK
  // ===============================
  async submitFeedback(feedback: {
    role: string;
    rating: number;
    comment?: string;
  }) {
    return this.request('/api/auth/feedback/', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  // ===============================
  // ADMIN AUTH
  // ===============================
  async adminRegister(data: {
    username: string;
    email: string;
    password: string;
    admin_code: string;
  }): Promise<{ access: string; refresh: string }> {
    const res = await this.request<{ access: string; refresh: string }>(
      '/api/admin-api/register/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    localStorage.setItem('admin_access', res.access);
    localStorage.setItem('refresh', res.refresh);
    return res;
  }

  async adminLogin(data: { username: string; password: string }) {
    const res = await this.request<{
      access: string;
      refresh: string;
      is_admin: boolean;
    }>('/api/admin-api/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!res.is_admin) {
      throw new Error('Not an admin');
    }

    localStorage.setItem('admin_access', res.access);
    localStorage.setItem('refresh', res.refresh);
    return res;
  }

  // ===============================
  // ADMIN DASHBOARD (IMPORTANT)
  // ===============================
  // ===============================
// ADMIN DASHBOARD
// ===============================
async getAdminStats(): Promise<{
  total_users: number;
  total_predictions: number;
  flagged_count: number;
  feedback_count: number;
}> {
  return this.request<{
    total_users: number;
    total_predictions: number;
    flagged_count: number;
    feedback_count: number;
  }>(
    '/api/admin-api/dashboard/',
    {
      method: 'GET',
    },
    true // 🔥 VERY IMPORTANT → admin token
  );
}


  // ===============================
  // ADMIN LOGS
  // ===============================
  async getUserLogs(): Promise<any[]> {
    return this.request<any[]>(
      '/api/admin-api/logs/',
      {},
      true
    );
  }

  // ===============================
  // ADMIN FLAGGED
  // ===============================
  async getFlaggedPredictions(): Promise<any[]> {
    return this.request<any[]>(
      '/api/admin-api/flagged/',
      {},
      true
    );
  }

  async resolveFlaggedPrediction(
    id: number
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/admin-api/flagged/${id}/resolve/`,
      { method: 'POST' },
      true
    );
  }

  // ===============================
  // ADMIN RETRAIN
  // ===============================
  async uploadTrainingData(file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<{ message: string }>(
      '/api/admin-api/retrain/',
      {
        method: 'POST',
        body: formData,
      },
      true
    );
  }
}

export const api = new ApiClient();
