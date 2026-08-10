import { requestFormData } from './apiClient';

export interface RecognitionSuggestion {
  foodName: string;
  category: string;
  confidence: number;
  description: string;
}

export interface RecognitionResponse {
  success: boolean;
  data: {
    suggestion: RecognitionSuggestion | null;
    manualEntry: boolean;
    source: string;
  };
}

export const recognitionApi = {
  recognizeImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return requestFormData<RecognitionResponse>('/foods/recognize-image', formData);
  },
};
