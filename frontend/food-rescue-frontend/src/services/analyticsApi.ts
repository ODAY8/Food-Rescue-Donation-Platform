import { request } from './apiClient';

// Platform-wide analytics (ADMIN only)
export interface PlatformStats {
  foods: {
    total_listings: number;
    total_servings: number;
    available: number;
    claimed: number;
    expired: number;
  };
  donations: {
    total_donations: number;
    completed: number;
    pending: number;
    cancelled: number;
    approved: number;
    collected: number;
    delivered: number;
    rejected?: number;
    pickup_scheduled?: number;
  };
  users: {
    total_users: number;
    donors: number;
    ngos: number;
    admins: number;
  };
  topDonors: { id: string; name: string; organization: string | null; listings_count: number; meals_donated: number }[];
  byCategory: { category: string; count: number; servings: number }[];
  byMonth: { month: string; listings: number; servings: number }[];
}

export const analyticsApi = {
  getPlatform: () =>
    request<{ success: boolean; data: PlatformStats }>('/analytics/platform'),
};
