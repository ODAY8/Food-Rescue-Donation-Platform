import { request } from './apiClient';

export interface ExpiryPrediction {
  id: string;
  foodId: string;
  featuresHash: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  recommendation: string;
  explanation: { factors: string[]; model: string };
  model: string;
  createdAt: string;
  updatedAt: string;
  disclaimer?: string;
}

export interface PredictionResponse {
  success: boolean;
  data: {
    prediction: ExpiryPrediction;
    cached: boolean;
    disclaimer: string;
  };
}

export const predictionApi = {
  getForFood: (foodId: string) =>
    request<PredictionResponse>(`/foods/${foodId}/prediction`),

  refreshForFood: (foodId: string) =>
    request<PredictionResponse>(`/foods/${foodId}/expiry-prediction`, { method: 'POST', body: JSON.stringify({ force: true }) }),
};
