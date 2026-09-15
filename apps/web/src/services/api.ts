import axios from 'axios';
import {
  UserDto,
  SubmissionDto,
  PaginatedResult,
  DocumentType,
  SubmissionStatus,
  DualPlagiarismSummaryDto,
  ReviewAction,
  AuditLogDto,
  DepartmentDto,
  TurnitinScopeConfig,
} from '@fulafia/shared';

const API_BASE_URL = `${(import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Access Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for automatic refresh token rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

// Auth Endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ user: UserDto; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: { email: string; password: string; firstName: string; lastName: string; role?: string; departmentId: string }) => {
    const res = await apiClient.post<{ user: UserDto; tokens: { accessToken: string; refreshToken: string } }>('/auth/register', data);
    return res.data;
  },
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    // Clear tokens FIRST — prevents the 401 interceptor from attempting a refresh
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Best-effort server-side revocation (fire-and-forget, no auth header needed)
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
    }
  },
  getMe: async () => {
    const res = await apiClient.get<{ user: UserDto }>('/auth/me');
    return res.data.user;
  },
};

// Departments & Users Endpoints
export const departmentsApi = {
  getAll: async () => {
    const res = await apiClient.get<DepartmentDto[]>('/departments');
    return res.data;
  },
};

export const usersApi = {
  getSupervisors: async (departmentId?: string) => {
    const res = await apiClient.get<UserDto[]>('/users/supervisors', { params: { departmentId } });
    return res.data;
  },
  getAllUsers: async (role?: string) => {
    const res = await apiClient.get<UserDto[]>('/users', { params: { role } });
    return res.data;
  },
  updateUserRole: async (userId: string, role: string) => {
    const res = await apiClient.patch(`/users/${userId}/role`, { role });
    return res.data;
  },
};

// Search & Catalog Endpoints
export const searchApi = {
  searchCatalog: async (params: {
    query?: string;
    departmentId?: string;
    documentType?: DocumentType;
    year?: number;
    authorId?: string;
    status?: SubmissionStatus;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<PaginatedResult<SubmissionDto>>('/search', { params });
    return res.data;
  },
  /** Shorthand alias */
  search: async (params: { query?: string; limit?: number }) => {
    const res = await apiClient.get<PaginatedResult<SubmissionDto>>('/search', { params });
    return res.data;
  },
};


// Submissions Endpoints
export const submissionsApi = {
  createSubmission: async (formData: FormData) => {
    const res = await apiClient.post<SubmissionDto>('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  addVersion: async (submissionId: string, formData: FormData) => {
    const res = await apiClient.post<SubmissionDto>(`/submissions/${submissionId}/version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  /** Alias used in MySubmissions revision modal */
  createVersion: async (submissionId: string, formData: FormData) => {
    const res = await apiClient.post<SubmissionDto>(`/submissions/${submissionId}/version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  /** Returns all submissions owned by the authenticated user */
  getMySubmissions: async () => {
    const res = await apiClient.get<any[]>('/submissions/my');
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<SubmissionDto>(`/submissions/${id}`);
    return res.data;
  },
  getManifest: async (id: string) => {
    const res = await apiClient.get<Record<string, any>>(`/submissions/${id}/manifest`);
    return res.data;
  },
};


// Plagiarism Endpoints
export const plagiarismApi = {
  getDualReport: async (versionId: string) => {
    const res = await apiClient.get<DualPlagiarismSummaryDto>(`/plagiarism/report/${versionId}`);
    return res.data;
  },
  triggerCheck: async (versionId: string, scopes?: TurnitinScopeConfig) => {
    const res = await apiClient.post(`/plagiarism/trigger/${versionId}`, { scopes });
    return res.data;
  },
};

// Review Endpoints
export const reviewApi = {
  getQueue: async () => {
    const res = await apiClient.get<SubmissionDto[]>('/review/queue');
    return res.data;
  },
  processAction: async (submissionId: string, action: ReviewAction, comments: string) => {
    const res = await apiClient.post(`/review/${submissionId}/action`, { action, comments });
    return res.data;
  },
};

// Audit Endpoints
export const auditApi = {
  getLogs: async (page = 1, limit = 20, entity?: string) => {
    const res = await apiClient.get<PaginatedResult<AuditLogDto>>('/audit', { params: { page, limit, entity } });
    return res.data;
  },
};
