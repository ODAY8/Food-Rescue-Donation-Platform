import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Check, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { scheduleApi, type ScheduledDonation } from '../services/scheduleApi';
import { translateError } from '../utils/errorMessages';

const STATUS_COLOR: Record<string, 'green' | 'orange' | 'red' | 'gray' | 'blue'> = {
  SCHEDULED: 'blue',
  CLAIMED: 'orange',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

export default function ScheduledDonations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isDonor = user?.role === 'DONOR';

  const fetchFn = isDonor ? scheduleApi.mySchedules : scheduleApi.openSchedules;
  const { data: res, loading, refetch } = useApi(() => fetchFn(), [isDonor]);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', quantity: 1, unit: 'kg', expiryDate: '', scheduledFor: '', city: '', notes: '' });

  const schedules = res?.data ?? [];

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await scheduleApi.create({
        title: form.title,
        quantity: Number(form.quantity),
        unit: form.unit,
        expiryDate: form.expiryDate,
        scheduledFor: form.scheduledFor,
        city: form.city,
        notes: form.notes,
      });
      toast(t('scheduled.createSuccess'), 'success');
      setCreateOpen(false);
      setForm({ title: '', quantity: 1, unit: 'kg', expiryDate: '', scheduledFor: '', city: '', notes: '' });
      void refetch();
    } catch (e) {
      toast(translateError(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (s: ScheduledDonation) => {
    try {
      await scheduleApi.accept(s.id);
      toast(t('scheduled.acceptSuccess'), 'success');
      void refetch();
    } catch (e) {
      toast(translateError(e), 'error');
    }
  };

  const handleCancel = async (s: ScheduledDonation) => {
    try {
      await scheduleApi.cancel(s.id);
      toast(t('scheduled.cancelSuccess'), 'success');
      void refetch();
    } catch (e) {
      toast(translateError(e), 'error');
    }
  };

  const handleReschedule = async (s: ScheduledDonation) => {
    const next = window.prompt(`${t('scheduled.reschedule')} (YYYY-MM-DDTHH:MM)`, s.scheduledFor);
    if (!next) return;
    try {
      await scheduleApi.reschedule(s.id, new Date(next).toISOString());
      toast(t('common.success'), 'success');
      void refetch();
    } catch (e) {
      toast(translateError(e), 'error');
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2">
            <CalendarClock size={24} className="text-[#2d6a4f]" />
            {t('scheduled.title')}
          </h1>
          {isDonor && <Button size="sm" onClick={() => setCreateOpen(true)}>{t('scheduled.createSchedule')}</Button>}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <CalendarClock size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-[#6b7280]">{t('scheduled.noSchedules')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#1c1c1e]">{s.food?.title}</h3>
                    <Badge label={t(`status.${s.status}`)} color={STATUS_COLOR[s.status] || 'gray'} />
                  </div>
                  <p className="text-xs text-[#6b7280]">
                    {t('scheduled.scheduledFor')}: {new Date(s.scheduledFor).toLocaleString()}
                  </p>
                  {s.food?.city && <p className="text-xs text-[#6b7280]">{s.food.city}</p>}
                  {s.notes && <p className="text-xs text-[#6b7280] mt-1">{s.notes}</p>}
                </div>
                <div className="flex gap-2">
                  {!isDonor && s.status === 'SCHEDULED' && (
                    <Button size="sm" onClick={() => void handleAccept(s)}>
                      <Check size={14} />
                      {t('scheduled.accept')}
                    </Button>
                  )}
                  {isDonor && s.status === 'SCHEDULED' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => void handleReschedule(s)}>
                        <RefreshCw size={14} />
                        {t('scheduled.reschedule')}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void handleCancel(s)}>
                        <X size={14} />
                        {t('scheduled.cancel')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('scheduled.createSchedule')}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder={t('inventory.itemName')} value={form.title} onChange={(e) => set('title', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" min={1} placeholder={t('inventory.quantity')} value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            <input placeholder={t('inventory.unit')} value={form.unit} onChange={(e) => set('unit', e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <input required type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <input required type="datetime-local" value={form.scheduledFor} onChange={(e) => set('scheduledFor', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <input placeholder={t('inventory.location')} value={form.city} onChange={(e) => set('city', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <input placeholder={t('scheduled.notes')} value={form.notes} onChange={(e) => set('notes', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <Button type="submit" loading={submitting} className="w-full">{t('common.save')}</Button>
        </form>
      </Modal>
    </PageWrapper>
  );
}
