import { request } from './apiClient';

export interface FoodItem {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  servings: number;
  expiryDate: string;
  pickupLocation: string;
  pickupWindow: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl: string;
  status: 'AVAILABLE' | 'CLAIMED' | 'EXPIRED';
  donorId: string;
  donor: { id: string; name: string; email: string; organization: string | null };
  createdAt: string;
}

export interface FoodListResponse {
  success: boolean;
  data: { data: FoodItem[]; pagination: { total: number; page: number; limit: number; pages: number } };
}

export interface FoodResponse {
  success: boolean;
  data: FoodItem;
}

export interface FoodFilters {
  search?: string;
  category?: string;
  city?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateFoodBody {
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit?: string;
  servings?: number;
  expiryDate: string;
  pickupLocation: string;
  pickupWindow: string;
  city: string;
  imageUrl?: string;
}

export const foodApi = {
  getAll: (filters: FoodFilters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return request<FoodListResponse>(`/foods${params ? `?${params}` : ''}`);
  },

  getById: (id: string) =>
    request<FoodResponse>(`/foods/${id}`),

  getMy: () =>
    request<{ success: boolean; data: FoodItem[] }>('/foods/my'),

  create: (body: CreateFoodBody) =>
    request<FoodResponse>('/foods', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: Partial<CreateFoodBody>) =>
    request<FoodResponse>(`/foods/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/foods/${id}`, { method: 'DELETE' }),
};
