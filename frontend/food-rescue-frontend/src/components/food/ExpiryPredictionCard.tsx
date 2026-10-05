import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { predictionApi, type ExpiryPrediction } from '../../services/predictionApi';
import Button from '../ui/Button';

const URGENCY_COLORS: Record<string, { badge: string; text: string; bar: string }> = {
  LOW: { badge: 'bg-[#d8f3dc] text-[#2d6a4f]', text: 'text-[#2d6a4f]', bar: 'bg-[#52b788]' },
  MEDIUM: { badge: 'bg-[#fde8df] text-[#c0522a]', text: 'text-[#c0522a]', bar: 'bg-[#f4845f]' },
  HIGH: { badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700', bar: 'bg-orange-500' },
  CRITICAL: { badge: 'bg-red-100 text-red-700', text: 'text-red-700', bar: 'bg-red-500' },
};

export default function ExpiryPredictionCard({ foodId }: { foodId: string }) {
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState<ExpiryPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictionApi.getForFood(foodId);
      setPrediction(res.data.prediction);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodId]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await predictionApi.refreshForFood(foodId);
      setPrediction(res.data.prediction);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-full" />
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm text-red-600">{error || t('common.empty')}</p>
        <Button size="sm" variant="ghost" className="mt-3" onClick={() => void load()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const color = URGENCY_COLORS[prediction.urgency] || URGENCY_COLORS.LOW;
  const factors = Array.isArray(prediction.explanation?.factors)
    ? prediction.explanation.factors
    : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1c1c1e] flex items-center gap-2">
          <AlertTriangle size={18} className="text-[#f4845f]" />
          {t('prediction.title')}
        </h3>
        <Button size="sm" variant="ghost" onClick={() => void refresh()} loading={refreshing}>
          <RefreshCw size={14} />
          {t('prediction.refresh')}
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#6b7280]">{t('prediction.riskScore')}</span>
            <span className={`text-sm font-bold ${color.text}`}>{prediction.riskScore}/100</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${prediction.riskScore}%` }} />
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${color.badge}`}>
          {t(`status.${prediction.urgency}`)}
        </span>
      </div>

      <p className="text-sm text-[#1c1c1e] font-medium mb-3">{prediction.recommendation}</p>

      {factors.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#6b7280] font-medium mb-1.5">{t('prediction.factors')}</p>
          <ul className="space-y-1">
            {factors.map((f, i) => (
              <li key={i} className="text-xs text-[#6b7280] flex items-start gap-1.5">
                <span className="text-[#40916c] mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-[#9ca3af] leading-relaxed border-t border-gray-100 pt-3">
        {t('prediction.disclaimer')}
      </p>
    </div>
  );
}
