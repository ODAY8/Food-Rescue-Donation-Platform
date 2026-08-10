import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, History, Package, TrendingUp } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { inventoryApi, type InventoryItem } from '../services/inventoryApi';
import { translateError } from '../utils/errorMessages';

const CATEGORIES = ['Produce', 'Dairy', 'Bakery', 'Meat', 'Prepared', 'Beverages', 'Pantry', 'Other'];
const STORAGE = ['ROOM_TEMP', 'REFRIGERATED', 'FROZEN'];

const STATUS_COLOR: Record<string, 'green' | 'orange' | 'red' | 'gray' | 'blue'> = {
  IN_STOCK: 'green',
  PARTIAL: 'blue',
  DONATED: 'gray',
  EXPIRED: 'red',
  REMOVED: 'gray',
};

const EMPTY_FORM = { name: '', category: 'Other', quantity: 1, unit: 'kg', expiryDate: '', storageCondition: '', location: '' };

export default function InventoryPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: res, loading, refetch } = useApi(() => inventoryApi.list(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [donateTarget, setDonateTarget] = useState<InventoryItem | null>(null);
  const [donateQty, setDonateQty] = useState(1);

  const items = res?.data ?? [];

  const set = (k: keyof typeof EMPTY_FORM, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryApi.create({
        name: form.name,
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        expiryDate: form.expiryDate,
        storageCondition: form.storageCondition || undefined,
        location: form.location,
      });
      toast(t('inventory.addItemSuccess'), 'success');
      setModalOpen(false);
      setForm({ ...EMPTY_FORM });
      void refetch();
    } catch (e) {
      toast(translateError(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (item: InventoryItem) => {
    try {
      await inventoryApi.remove(item.id);
      toast(t('inventory.removeSuccess'), 'success');
      void refetch();
    } catch (e) {
      toast(translateError(e), 'error');
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donateTarget) return;
    try {
      const res = await inventoryApi.donate(donateTarget.id, { quantity: donateQty, title: donateTarget.name });
      toast(`${t('inventory.donateSuccess')} — ${t('inventory.remaining')}: ${res.data.item.quantity} ${res.data.item.unit}`, 'success');
      setDonateTarget(null);
      setDonateQty(1);
      void refetch();
    } catch (e) {
      toast(translateError(e), 'error');
    }
  };

  const handleExpired = async (item: InventoryItem) => {
    try {
      await inventoryApi.markExpired(item.id);
      toast(t('common.success'), 'success');
      void refetch();
    } catch (e) {
      toast(translateError(e), 'error');
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2">
              <Package size={24} className="text-[#2d6a4f]" />
              {t('inventory.title')}
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">{t('donor.inventory')}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/donor/inventory/history">
              <Button variant="ghost" size="sm">
                <History size={14} />
                {t('inventory.history')}
              </Button>
            </Link>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              {t('inventory.addItem')}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <Package size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-[#6b7280]">{t('inventory.noItems')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const expiring = new Date(item.expiryDate).getTime() - Date.now() < 72 * 3600 * 1000;
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-[#1c1c1e]">{item.name}</h3>
                      <p className="text-xs text-[#6b7280]">{item.category}</p>
                    </div>
                    <Badge label={t(`status.${item.status}`)} color={STATUS_COLOR[item.status] || 'gray'} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-[#2d6a4f]">{item.quantity}</span>
                    <span className="text-sm text-[#6b7280]">{item.unit}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <TrendingUp size={14} className={expiring ? 'text-red-500' : 'text-[#2d6a4f]'} />
                    <span className={expiring ? 'text-red-600 font-medium' : 'text-[#6b7280]'}>
                      {t('listing.expiresIn', { days: Math.max(0, Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000)) })}
                    </span>
                  </div>
                  {item.location && <p className="text-xs text-[#6b7280]">{item.location}</p>}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Button size="sm" onClick={() => { setDonateTarget(item); setDonateQty(item.quantity); }}>
                      {t('inventory.donate')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void handleExpired(item)}>
                      {t('inventory.markExpired')}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void handleRemove(item)}>
                      {t('inventory.remove')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('inventory.addItem')}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={t('inventory.itemName')} value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={(e) => set('category', e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.storageCondition} onChange={(e) => set('storageCondition', e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
              <option value="">{t('inventory.storageCondition')}</option>
              {STORAGE.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input required type="number" min={1} placeholder={t('inventory.quantity')} value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            <input placeholder={t('inventory.unit')} value={form.unit} onChange={(e) => set('unit', e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            <input placeholder={t('inventory.location')} value={form.location} onChange={(e) => set('location', e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <input required type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <Button type="submit" loading={submitting} className="w-full">{t('common.save')}</Button>
        </form>
      </Modal>

      <Modal open={!!donateTarget} onClose={() => setDonateTarget(null)} title={`${t('inventory.donate')} — ${donateTarget?.name ?? ''}`}>
        <form onSubmit={handleDonate} className="space-y-3">
          <p className="text-sm text-[#6b7280]">
            {t('inventory.remaining')}: {donateTarget?.quantity} {donateTarget?.unit}
          </p>
          <input required type="number" min={1} max={donateTarget?.quantity ?? 1} value={donateQty}
            onChange={(e) => setDonateQty(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <Button type="submit" className="w-full">{t('inventory.donate')}</Button>
        </form>
      </Modal>
    </PageWrapper>
  );
}
