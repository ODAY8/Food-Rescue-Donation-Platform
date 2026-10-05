import { request } from './apiClient';
import type { Donation, DonationStatus } from './donationApi';

export interface QrGenerated {
  id: string;
  code: string;
  qrDataUrl: string;
  expiresAt: string;
}

export interface QrResolveResult {
  code: string;
  status: DonationStatus;
  foodTitle: string | null;
  pickupLocation: string | null;
  city: string | null;
  scheduledAt: string | null;
  authorized: boolean;
  full: boolean;
  donation?: Donation;
}

export const qrApi = {
  generate: (donationId: string) =>
    request<{ success: boolean; data: QrGenerated }>(`/donations/${donationId}/qr`, { method: 'POST' }),

  resolve: (code: string) =>
    request<{ success: boolean; data: QrResolveResult }>(`/donations/qr/${code}`),

  validate: (code: string) =>
    request<{ success: boolean; data: { valid: boolean; donationId?: string; status?: DonationStatus; message?: string } }>(
      '/donations/qr/validate',
      { method: 'POST', body: JSON.stringify({ code }) }
    ),

  confirmCollect: (donationId: string) =>
    request<{ success: boolean; data: Donation }>(`/donations/${donationId}/scan/collect`, { method: 'POST' }),

  confirmDeliver: (donationId: string) =>
    request<{ success: boolean; data: Donation }>(`/donations/${donationId}/scan/deliver`, { method: 'POST' }),
};
