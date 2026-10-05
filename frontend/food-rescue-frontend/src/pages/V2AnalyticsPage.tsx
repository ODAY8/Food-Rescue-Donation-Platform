import { useTranslation } from 'react-i18next';
import PageWrapper from '../components/layout/PageWrapper';
import { useApi } from '../hooks/useApi';
import { v2AnalyticsApi } from '../services/v2AnalyticsApi';
import Badge from '../components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#2d6a4f', '#f4845f', '#52b788', '#f9a07a', '#d8f3dc', '#fde8df'];

export default function V2AnalyticsPage() {
  const { t } = useTranslation();
  const { data: res, loading } = useApi(() => v2AnalyticsApi.getStats(), []);
  const stats = res?.data;

  const urgencyData = stats?.predictions.byUrgency.map((u) => ({
    name: t(`status.${u.urgency}`),
    count: u.count,
  })) ?? [];

  const inventoryData = stats?.inventory.byStatus.map((i) => ({
    name: t(`status.${i.status}`),
    value: i.totalQty ?? 0,
  })) ?? [];

  const scheduleData = stats?.schedules.byStatus.map((s) => ({
    name: t(`status.${s.status}`),
    count: s.count,
  })) ?? [];

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#1c1c1e] mb-8">{t('admin.v2Analytics')}</h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-[#6b7280]">{t('admin.predictions')}</p>
                <p className="text-3xl font-bold text-[#2d6a4f]">{stats?.predictions.total ?? 0}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-[#6b7280]">{t('admin.qrActivity')}</p>
                <p className="text-3xl font-bold text-[#2d6a4f]">{stats?.qr.totalScans ?? 0}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-[#6b7280]">{t('admin.schedules')}</p>
                <p className="text-3xl font-bold text-[#2d6a4f]">{stats?.schedules.total ?? 0}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-[#6b7280]">{t('admin.inventoryStats')} · {t('inventory.expiryDate')}</p>
                <p className="text-3xl font-bold text-[#f4845f]">{stats?.inventory.expiringSoon ?? 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Predictions by urgency */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-[#1c1c1e] mb-4">{t('admin.predictions')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={urgencyData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Inventory by status */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-[#1c1c1e] mb-4">{t('admin.inventoryStats')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={inventoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {inventoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Schedules */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-[#1c1c1e] mb-4">{t('admin.schedules')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={scheduleData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f4845f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Events */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-[#1c1c1e] mb-4">{t('admin.searchUsage')} & {t('admin.languageUsage')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#f0fdf4] rounded-xl">
                    <span className="text-sm text-[#1c1c1e]">{t('admin.searchUsage')}</span>
                    <Badge label={String(stats?.events.searchCount ?? 0)} color="green" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#fde8df] rounded-xl">
                    <span className="text-sm text-[#1c1c1e]">{t('admin.languageUsage')}</span>
                    <Badge label={String(stats?.events.languageCount ?? 0)} color="orange" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-[#1c1c1e]">{t('admin.expiryTrends')}</span>
                    <Badge label={String(stats?.expiryTrends.reduce((s, e) => s + e.count, 0) ?? 0)} color="red" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
