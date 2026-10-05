import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ExpiryPredictionCard from '../food/ExpiryPredictionCard';

vi.mock('../../services/predictionApi', () => ({
  predictionApi: {
    getForFood: vi.fn(),
    refreshForFood: vi.fn(),
  },
}));

import { predictionApi } from '../../services/predictionApi';

const prediction = {
  id: 'p-1',
  foodId: 'f-1',
  featuresHash: 'abc',
  urgency: 'HIGH',
  riskScore: 72,
  recommendation: 'Prioritize this donation within the next few hours.',
  explanation: { factors: ['short shelf life', 'prepared food'], model: 'rules' },
  model: 'rules',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  disclaimer: 'This is an AI estimate. NOT a food-safety certification.',
};

const renderCard = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <ExpiryPredictionCard foodId="f-1" />
    </I18nextProvider>
  );

describe('ExpiryPredictionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton then the prediction', async () => {
    predictionApi.getForFood.mockResolvedValue({
      success: true,
      data: { prediction, cached: false, disclaimer: prediction.disclaimer },
    });
    renderCard();
    await waitFor(() => {
      expect(screen.getByText('72/100')).toBeTruthy();
    });
    expect(screen.getByText('Expiry Prediction')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy(); // urgency translated
    expect(screen.getByText(prediction.recommendation)).toBeTruthy();
    // Disclaimer shown
    expect(screen.getByText(/NOT a food-safety certification/)).toBeTruthy();
  });

  it('shows an error state when the API fails', async () => {
    predictionApi.getForFood.mockRejectedValue(new Error('boom'));
    renderCard();
    await waitFor(() => {
      expect(screen.getByText('boom')).toBeTruthy();
    });
  });
});
