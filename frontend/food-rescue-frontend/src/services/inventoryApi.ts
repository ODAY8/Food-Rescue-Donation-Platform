import { request } from './apiClient';

export type InventoryStatus = 'IN_STOCK' | 'PARTIAL' | 'DONATED' | 'EXPIRED' | 'REMOVED';

export interface InventoryItem {
  id: string;
  donorId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  preparationDate: string | null;
  expiryDate: string;
  storageCondition: string | null;
  location: string;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'ADD' | 'ADJUST' | 'DONATE' | 'EXPIRE' | 'REMOVE';
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  note: string | null;
  foodId: string | null;
  createdAt: string;
  item: { id: string; name: string; unit: string };
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface CreateInventoryBody {
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  expiryDate: string;
  preparationDate?: string;
  storageCondition?: string;
  location?: string;
}

export interface DonateBody {
  quantity: number;
  title?: string;
  description?: string;
  pickupLocation?: string;
  city?: string;
}

export const inventoryApi = {
  list: (filters: { status?: string; category?: string; search?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])
    ).toString();
    return request<Paginated<InventoryItem>>(`/inventory${params ? `?${params}` : ''}`);
  },

  get: (id: string) => request<{ success: boolean; data: InventoryItem }>(`/inventory/${id}`),

  create: (body: CreateInventoryBody) =>
    request<{ success: boolean; data: InventoryItem }>('/inventory', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: Partial<CreateInventoryBody>) =>
    request<{ success: boolean; data: InventoryItem }>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  remove: (id: string) =>
    request<{ success: boolean; message: string }>(`/inventory/${id}`, { method: 'DELETE' }),

  adjust: (id: string, delta: number, note?: string) =>
    request<{ success: boolean; data: InventoryItem }>(`/inventory/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ delta, note }),
    }),

  donate: (id: string, body: DonateBody) =>
    request<{ success: boolean; data: { item: InventoryItem; food: unknown } }>(`/inventory/${id}/donate`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  markExpired: (id: string) =>
    request<{ success: boolean; message: string }>(`/inventory/${id}/expired`, { method: 'POST' }),

  history: (filters: { page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])
    ).toString();
    return request<Paginated<InventoryTransaction>>(`/inventory/history${params ? `?${params}` : ''}`);
  },
};
