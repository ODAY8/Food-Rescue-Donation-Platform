import { request } from './apiClient';
import type { FoodItem } from './foodApi';

export type DonationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PICKUP_SCHEDULED' | 'COLLECTED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export interface Donation {
  id: string;
  foodId: string;
  donorId: string;
  ngoId: string;
  status: DonationStatus;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  pickupScheduledAt: string | null;
  collectedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  createdAt: string;
  food: FoodItem;
  ngo?: { id: string; name: string; email: string; organization: string | null };
  donor?: { id: string; name: string; email: string; organization: string | null };
}

export const donationApi = {
  claim: (foodId: string) =>
    request<{ success: boolean; data: Donation }>(`/donations/claim/${foodId}`, { method: 'POST' }),

  getMyDonations: () =>
    request<{ success: boolean; data: Donation[] }>('/donations/my-donations'),

  getMyClaims: () =>
    request<{ success: boolean; data: Donation[] }>('/donations/my-claims'),

  getById: (id: string) =>
    request<{ success: boolean; data: Donation }>(`/donations/${id}`),

  updateStatus: (id: string, status: DonationStatus) =>
    request<{ success: boolean; data: Donation }>(`/donations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};
