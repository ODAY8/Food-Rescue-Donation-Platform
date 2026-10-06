import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import ImageRecognitionForm from '../components/food/ImageRecognitionForm';
import { foodApi, type CreateFoodBody } from '../services/foodApi';
import type { RecognitionSuggestion } from '../services/recognitionApi';
import { useToast } from '../hooks/useToast';
import { translateError } from '../utils/errorMessages';

const CATEGORIES = ['Produce', 'Dairy', 'Bakery', 'Meat', 'Prepared', 'Beverages', 'Pantry', 'Other'];
const STORAGE = ['ROOM_TEMP', 'REFRIGERATED', 'FROZEN'];
const PACKAGING = ['OPEN', 'SEALED', 'VACUUM_SEALED', 'CANNED'];

const EMPTY: CreateFoodBody & {
  preparationDate?: string;
  storageCondition?: string;
  packaging?: string;
  temperature?: number;
} = {
  title: '',
  description: '',
  category: 'Other',
  quantity: 1,
  unit: 'kg',
  servings: 1,
  expiryDate: '',
  pickupLocation: '',
  pickupWindow: '',
  city: '',
  imageUrl: '',
  preparationDate: '',
  storageCondition: '',
  packaging: '',
  temperature: undefined,
};

export default function DonorFoodCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<RecognitionSuggestion | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [showPrediction, setShowPrediction] = useState(false);

  const set = (k: keyof typeof EMPTY, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleRecognized = (sug: RecognitionSuggestion | null, url: string) => {
    setImageUrl(url);
    if (sug) {
      setSuggestion(sug);
      const generatedDesc =
        sug.description && sug.description.trim().length >= 10
          ? sug.description.trim()
          : `Fresh surplus ${sug.foodName} available for immediate donation and pickup.`;

      setForm((f) => ({
        ...f,
        title: sug.foodName,
        category: sug.category,
        description: f.description && f.description.trim().length >= 10 ? f.description : generatedDesc,
        imageUrl: url,
      }));
      setShowPrediction(true);
    } else {
      setSuggestion(null);
      setForm((f) => ({ ...f, imageUrl: url }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let desc = form.description?.trim() || '';
      if (desc.length < 10) {
        desc = `Fresh surplus ${form.title || 'food item'} available for donation and pickup.`;
      }

      const body: CreateFoodBody = {
        title: form.title,
        description: desc,
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        servings: Number(form.servings || 0),
        expiryDate: form.expiryDate,
        pickupLocation: form.pickupLocation,
        pickupWindow: form.pickupWindow,
        city: form.city,
        imageUrl: imageUrl || form.imageUrl,
        // V2 prediction inputs
        ...(form.preparationDate ? { preparationDate: form.preparationDate } : {}),
        ...(form.storageCondition ? { storageCondition: form.storageCondition } : {}),
        ...(form.packaging ? { packaging: form.packaging } : {}),
        ...(form.temperature !== undefined ? { temperature: Number(form.temperature) } : {}),
      };
      await foodApi.create(body);
      toast(t('donor.createSuccess') || 'Listing created!', 'success');
      navigate('/donor');
    } catch (e) {
      toast(translateError(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate('/donor')}
          className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#2d6a4f] mb-6"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>

        <h1 className="text-2xl font-bold text-[#1c1c1e] mb-1">{t('donor.createListing')}</h1>
        <p className="text-sm text-[#6b7280] mb-8">{t('recognition.uploadHint')}</p>

        <ImageRecognitionForm onRecognized={handleRecognized} />

        {showPrediction && (
          <div className="mt-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-[#6b7280] mb-2">
                {t('prediction.title')} — {suggestion?.foodName}
              </p>
              <p className="text-xs text-[#9ca3af]">{t('prediction.disclaimer')}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-[#1c1c1e]">{t('inventory.itemName')} *</span>
              <input
                required
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1c1c1e]">{t('inventory.category')}</span>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-[#1c1c1e]">{t('inventory.description') || 'Description'} *</span>
              <textarea
                required
                minLength={10}
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Brief description of the food item (e.g. freshly prepared, ingredients, condition — minimum 10 characters)"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              />
              <span className="text-xs text-[#9ca3af] mt-1 block">
                {form.description.length < 10
                  ? `${10 - form.description.length} more characters required`
                  : `${form.description.length} characters`}
              </span>
            </label>
            <label className="block">

              <span className="text-sm font-medium text-[#1c1c1e]">{t('inventory.quantity')} *</span>
              <input
                required
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => set('quantity', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1c1c1e]">{t('inventory.unit')}</span>
              <input
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1c1c1e]">{t('inventory.expiryDate')} *</span>
              <input
                required
                type="date"
                value={form.expiryDate}
                onChange={(e) => set('expiryDate', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1c1c1e]">{t('inventory.preparationDate')}</span>
              <input
                type="date"
                value={form.preparationDate || ''}
                onChange={(e) => set('preparationDate', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1c1c1e]">{t('inventory.storageCondition')}</span>
              <select
                value={form.storageCondition || ''}
                onChange={(e) => set('storageCondition', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              >
                <option value="">—</option>
                {STORAGE.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1c1c1e]">Packaging</span>
              <select
                value={form.packaging || ''}
                onChange={(e) => set('packaging', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              >
                <option value="">—</option>
                {PACKAGING.map((p) => (
                  <option key={p} value={p}>{p.replace('_', ' ')}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1c1c1e]">Temperature (°C)</span>
              <input
                type="number"
                step="0.1"
                value={form.temperature ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({ ...f, temperature: v === '' ? undefined : Number(v) }));
                }}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-[#1c1c1e]">{t('inventory.location')}</span>
              <input
                value={form.pickupLocation}
                onChange={(e) => set('pickupLocation', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
              />
            </label>
          </div>

          <Button type="submit" loading={submitting} className="w-full">
            {t('donor.createListing')}
          </Button>
        </form>
      </div>
    </PageWrapper>
  );
}
