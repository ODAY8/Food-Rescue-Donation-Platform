import { useTranslation } from 'react-i18next';
import PageWrapper from '../components/layout/PageWrapper';
import { useApi } from '../hooks/useApi';
import { inventoryApi } from '../services/inventoryApi';
import Badge from '../components/ui/Badge';

const TXT_COLOR: Record<string, 'green' | 'orange' | 'red' | 'gray' | 'blue'> = {
  ADD: 'green',
  ADJUST: 'blue',
  DONATE: 'orange',
  EXPIRE: 'red',
  REMOVE: 'gray',
};

export default function InventoryHistoryPage() {
  const { t } = useTranslation();
  const { data: res, loading } = useApi(() => inventoryApi.history(), []);

  const txns = res?.data ?? [];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#1c1c1e] mb-6">{t('inventory.history')}</h1>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        ) : txns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-sm text-[#6b7280]">{t('common.empty')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f0fdf4] text-left text-xs text-[#6b7280] uppercase">
                <tr>
                  <th className="px-4 py-3">{t('inventory.transaction')}</th>
                  <th className="px-4 py-3">{t('inventory.itemName')}</th>
                  <th className="px-4 py-3">{t('inventory.quantityChange')}</th>
                  <th className="px-4 py-3">{t('inventory.before')}</th>
                  <th className="px-4 py-3">{t('inventory.after')}</th>
                  <th className="px-4 py-3">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {txns.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3"><Badge label={t(`inventory.${tx.type.toLowerCase()}`)} color={TXT_COLOR[tx.type] || 'gray'} /></td>
                    <td className="px-4 py-3 font-medium text-[#1c1c1e]">{tx.item.name}</td>
                    <td className={`px-4 py-3 font-semibold ${tx.quantityChange >= 0 ? 'text-[#2d6a4f]' : 'text-red-600'}`}>
                      {tx.quantityChange >= 0 ? '+' : ''}{tx.quantityChange} {tx.item.unit}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">{tx.quantityBefore}</td>
                    <td className="px-4 py-3 text-[#6b7280]">{tx.quantityAfter}</td>
                    <td className="px-4 py-3 text-xs text-[#6b7280]">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
