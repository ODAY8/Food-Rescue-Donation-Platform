import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import ImageRecognitionForm from '../food/ImageRecognitionForm';

vi.mock('../../services/recognitionApi', () => ({
  recognitionApi: { recognizeImage: vi.fn() },
}));
vi.mock('../../services/v2Api', () => ({
  uploadApi: { uploadFoodImage: vi.fn() },
}));

import { recognitionApi } from '../../services/recognitionApi';
import { uploadApi } from '../../services/v2Api';

// A tiny valid PNG blob.
const TINY_PNG = new Blob(
  [Uint8Array.from(Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c626001000000ffff03000006000557bfabd40000000049454e44ae426082', 'hex'))],
  { type: 'image/png' }
);

const renderForm = (onRecognized = vi.fn()) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ImageRecognitionForm onRecognized={onRecognized} />
    </I18nextProvider>
  );

describe('ImageRecognitionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an invalid file type client-side', () => {
    renderForm();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(['x'], 'x.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByText(/Only JPEG, PNG, or WebP/)).toBeTruthy();
    expect(recognitionApi.recognizeImage).not.toHaveBeenCalled();
  });

  it('shows manual entry fallback when AI is unavailable', async () => {
    recognitionApi.recognizeImage.mockResolvedValue({
      success: true,
      data: { suggestion: null, manualEntry: true, source: 'ai-unavailable' },
    });
    uploadApi.uploadFoodImage.mockResolvedValue({ success: true, data: { url: '/uploads/foods/x.png' } });
    renderForm();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File([TINY_PNG], 'f.png', { type: 'image/png' })] } });
    await waitFor(() => {
      expect(screen.getByText(/couldn't recognize|पहचान नहीं/)).toBeTruthy();
    });
  });

  it('shows a suggestion with confidence when AI succeeds', async () => {
    recognitionApi.recognizeImage.mockResolvedValue({
      success: true,
      data: {
        suggestion: { foodName: 'Cooked Rice', category: 'Prepared', confidence: 91, description: 'Rice' },
        manualEntry: false,
        source: 'ai',
      },
    });
    const onRecognized = vi.fn();
    renderForm(onRecognized);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File([TINY_PNG], 'f.png', { type: 'image/png' })] } });
    await waitFor(() => {
      expect(screen.getByText('Cooked Rice')).toBeTruthy();
      expect(screen.getByText(/91%/)).toBeTruthy();
    });
  });
});
