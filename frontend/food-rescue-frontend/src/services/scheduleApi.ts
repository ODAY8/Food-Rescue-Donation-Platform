import { request } from './apiClient';
import type { FoodItem } from './foodApi';

export type ScheduledStatus = 'SCHEDULED' | 'CLAIMED' | 'COMPLETED' | 'CANCELLED';

export interface ScheduledDonation {
  id: string;
  donorId: string;
  foodId: string;
  donationId: string | null;
  ngoId: string | null;
  scheduledFor: string;
  status: ScheduledStatus;
  reminderSentAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  food?: Pick<FoodItem, 'id' | 'title' | 'quantity' | 'unit' | 'city'>;
  donor?: { id: string; name: string; organization: string | null };
  ngo?: { id: string; name: string; organization: string | null };
}

export interface CreateScheduleBody {
  foodId?: string;
  title?: string;
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expiryDate?: string;
  pickupLocation?: string;
  pickupWindow?: string;
  city?: string;
  scheduledFor: string;
  notes?: string;
}

export const scheduleApi = {
  create: (body: CreateScheduleBody) =>
    request<{ success: boolean; data: ScheduledDonation & { food?: FoodItem } }>('/donations/schedule', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  mySchedules: (filters: { page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ success: boolean; data: ScheduledDonation[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
      `/donations/scheduled${params ? `?${params}` : ''}`
    );
  },

  openSchedules: () =>
    request<{ success: boolean; data: ScheduledDonation[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
      '/donations/scheduled/ngo'
    ),

  accept: (id: string) =>
    request<{ success: boolean; data: { schedule: ScheduledDonation; donation: { id: string; status: string } } }>(
      `/donations/scheduled/${id}/accept`,
      { method: 'POST' }
    ),

  reschedule: (id: string, scheduledFor: string) =>
    request<{ success: boolean; data: ScheduledDonation }>(`/donations/scheduled/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ scheduledFor }),
    }),

  cancel: (id: string) =>
    request<{ success: boolean; data: ScheduledDonation }>(`/donations/scheduled/${id}/cancel`, { method: 'POST' }),
};
