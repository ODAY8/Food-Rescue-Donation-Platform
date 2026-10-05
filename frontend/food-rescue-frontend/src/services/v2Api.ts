import { request, requestFormData } from './apiClient';

export const eventsApi = {
  reportLanguageChange: (lang: string) =>
    request<{ success: boolean; message: string }>('/analytics/events', {
      method: 'POST',
      body: JSON.stringify({ type: 'LANGUAGE_CHANGE', metadata: { lang } }),
    }),
};

export const uploadApi = {
  uploadFoodImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return requestFormData<{ success: boolean; data: { url: string; filename: string; size: number } }>(
      '/uploads/food-image',
      formData
    );
  },
};
