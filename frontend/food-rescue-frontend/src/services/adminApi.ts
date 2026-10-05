import { request } from './apiClient';
import type { FoodItem } from './foodApi';
import type { Donation } from './donationApi';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'DONOR' | 'NGO' | 'ADMIN';
  organization: string | null;
  phone: string | null;
  createdAt: string;
  _count: { foods: number; donationsDonated: number; donationsReceived: number };
}

export interface AdminFood extends FoodItem {}
export interface AdminDonation extends Donation {}

export interface Paginated<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export const adminApi = {
  getDashboard: () =>
    request<{ success: boolean; data: any }>('/admin/dashboard'),

  getUsers: (params: { search?: string; role?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ success: boolean; data: AdminUser[] }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  getFoods: (params: { status?: string; search?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ success: boolean; data: Paginated<AdminFood> }>(`/admin/foods${qs ? `?${qs}` : ''}`);
  },

  moderateFood: (id: string, status: string) =>
    request<{ success: boolean; message: string }>(`/admin/foods/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteFood: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/foods/${id}`, { method: 'DELETE' }),

  getDonations: (params: { status?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ success: boolean; data: Paginated<AdminDonation> }>(`/admin/donations${qs ? `?${qs}` : ''}`);
  },
};
