import { request } from './apiClient';
import type { FoodItem } from './foodApi';

export interface SearchFilters {
  q?: string;
  category?: string;
  city?: string;
  status?: string;
  availability?: string;
  expiryBefore?: string;
  expiryAfter?: string;
  urgency?: number;
  minQty?: number;
  maxQty?: number;
  lat?: number;
  lng?: number;
  sort?: 'expiring' | 'quantity' | 'recent' | 'relevance' | 'nearest';
  page?: number;
  limit?: number;
}

export interface RankedFood extends FoodItem {
  matchScore?: number;
  matchReasons?: string[];
  distanceKm?: number | null;
}

export interface SearchResponse {
  success: boolean;
  data: RankedFood[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

const buildParams = (filters: SearchFilters) => {
  const params = new URLSearchParams(
    Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== '' && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
  return params.toString();
};

export const searchApi = {
  search: (filters: SearchFilters = {}) => {
    const qs = buildParams(filters);
    return request<SearchResponse>(`/foods/search${qs ? `?${qs}` : ''}`);
  },

  recommendations: () =>
    request<{ success: boolean; data: RankedFood[]; count: number }>('/foods/recommendations'),
};
