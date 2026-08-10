export { tokenStorage } from './apiClient';
import { request } from './apiClient';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'DONOR' | 'NGO' | 'ADMIN';
  platformRole: 'donor' | 'ngo' | 'admin';
  organization: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: AuthUser;
}

export interface ProfileResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    platform_role: string;
    organization: string | null;
    phone?: string | null;
    address?: string | null;
    createdAt: string;
  };
}

export interface UpdateProfileBody {
  name?: string;
  email?: string;
  organization?: string;
  phone?: string;
  address?: string;
}

export const authApi = {
  register: (body: { name: string; email: string; password: string; role: string; organization?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getProfile: () =>
    request<ProfileResponse>('/auth/profile'),

  updateProfile: (body: UpdateProfileBody) =>
    request<ProfileResponse>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),
};
