import { request } from './apiClient';

export interface V2Stats {
  predictions: {
    byUrgency: { urgency: string; count: number; avgRisk: number }[];
    byModel: { model: string; count: number }[];
    total: number;
  };
  inventory: {
    byStatus: { status: string; count: number; totalQty: number | null }[];
    expiringSoon: number;
  };
  schedules: {
    byStatus: { status: string; count: number }[];
    total: number;
  };
  qr: { totalCodes: number; totalScans: number };
  expiryTrends: { category: string; count: number }[];
  events: { searchCount: number; languageCount: number };
}

export const v2AnalyticsApi = {
  getStats: () => request<{ success: boolean; data: V2Stats }>('/analytics/v2'),
};
