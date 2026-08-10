import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X, Upload, Check } from 'lucide-react';
import { recognitionApi, type RecognitionSuggestion } from '../../services/recognitionApi';
import { uploadApi } from '../../services/v2Api';
import Button from '../ui/Button';

interface Props {
  onRecognized: (suggestion: RecognitionSuggestion | null, imageUrl: string) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;

export default function ImageRecognitionForm({ onRecognized }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [suggestion, setSuggestion] = useState<RecognitionSuggestion | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPreviewUrl(null);
    setFile(null);
    setSuggestion(null);
    setManualEntry(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleFile = async (selected: File | undefined) => {
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError(t('recognition.fileTypeError'));
      return;
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      setError(t('recognition.sizeError'));
      return;
    }
    setError(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setAnalyzing(true);
    setManualEntry(false);
    setSuggestion(null);

    try {
      const res = await recognitionApi.recognizeImage(selected);
      setSuggestion(res.data.suggestion);
      setManualEntry(res.data.manualEntry);
      if (!res.data.manualEntry && res.data.suggestion) {
        onRecognized(res.data.suggestion, '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setManualEntry(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmSuggestion = async () => {
    if (!suggestion || !file) return;
    setUploading(true);
    setError(null);
    try {
      // Upload the image first, then pass the URL + suggestion up.
      const up = await uploadApi.uploadFoodImage(file);
      onRecognized(suggestion, up.data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const useManual = () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    void uploadApi
      .uploadFoodImage(file)
      .then((up) => onRecognized(null, up.data.url))
      .catch((e) => setError(e instanceof Error ? e.message : t('common.error')))
      .finally(() => setUploading(false));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-[#1c1c1e] mb-1 flex items-center gap-2">
        <ImagePlus size={18} className="text-[#2d6a4f]" />
        {t('recognition.title')}
      </h3>
      <p className="text-xs text-[#6b7280] mb-4">{t('recognition.uploadHint')}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {!previewUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-[#2d6a4f] hover:bg-[#f0fdf4] transition-colors cursor-pointer"
        >
          <Upload size={24} className="text-[#6b7280]" />
          <span className="text-sm text-[#6b7280]">{t('recognition.dragDrop')}</span>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img src={previewUrl} alt="preview" className="w-full h-48 object-cover rounded-xl" />
            <button
              type="button"
              onClick={reset}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
              aria-label="clear"
            >
              <X size={16} />
            </button>
          </div>

          {analyzing && (
            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
              <svg className="animate-spin h-4 w-4 text-[#2d6a4f]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {t('recognition.recognizing')}
            </div>
          )}

          {suggestion && !analyzing && (
            <div className="border border-[#d8f3dc] bg-[#f0fdf4] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#2d6a4f]">{t('recognition.suggestion')}</span>
                <span className="text-xs text-[#2d6a4f] font-medium">{t('recognition.confidence')}: {suggestion.confidence}%</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-semibold text-[#1c1c1e]">{suggestion.foodName}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#d8f3dc] text-[#2d6a4f] text-xs font-semibold">{suggestion.category}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                <div className="h-full bg-[#2d6a4f] rounded-full" style={{ width: `${suggestion.confidence}%` }} />
              </div>
              {suggestion.description && <p className="text-xs text-[#6b7280] mb-3">{suggestion.description}</p>}
              <Button size="sm" onClick={() => void confirmSuggestion()} loading={uploading}>
                <Check size={14} />
                {t('recognition.confirm')}
              </Button>
            </div>
          )}

          {manualEntry && !analyzing && (
            <div className="border border-orange-100 bg-[#fde8df] rounded-xl p-4 text-sm text-[#6b7280]">
              {t('recognition.manualEntry')}
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={useManual} loading={uploading}>
                  {t('common.continue')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
