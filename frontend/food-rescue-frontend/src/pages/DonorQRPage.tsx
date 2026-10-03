import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, QrCode } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import { useApi } from '../hooks/useApi';
import { donationApi } from '../services/donationApi';
import { qrApi } from '../services/qrApi';
import { useToast } from '../hooks/useToast';
import { translateError } from '../utils/errorMessages';

export default function DonorQRPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState('');
  const [qr, setQr] = useState<{ qrDataUrl: string; code: string; expiresAt: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: donationsRes, loading: donationsLoading } = useApi(() => donationApi.getMyDonations(), []);

  const donations = donationsRes?.data ?? [];

  const generate = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await qrApi.generate(selectedId);
      setQr(res.data);
    } catch (e) {
      toast(translateError(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate('/donor')}
          className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#2d6a4f] mb-6"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>

        <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2 mb-2">
          <QrCode size={24} className="text-[#2d6a4f]" />
          {t('qr.title')}
        </h1>
        <p className="text-sm text-[#6b7280] mb-8">{t('qr.generateForDonation')}</p>

        {donationsLoading ? (
          <div className="text-sm text-[#6b7280] py-8 text-center">{t('common.loading')}</div>
        ) : donations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <QrCode size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-[#6b7280]">{t('qr.noDonations')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-[#1c1c1e]">{t('qr.selectDonation')}</span>
              <select
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setQr(null); }}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white"
              >
                <option value="">{t('qr.selectDonationPlaceholder')}</option>
                {donations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.food.title} — {d.food.city || ''} ({d.status})
                  </option>
                ))}
              </select>
            </label>

            {!qr && (
              <Button onClick={() => void generate()} loading={loading} disabled={!selectedId}>
                {t('qr.generate')}
              </Button>
            )}

            {qr && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <img src={qr.qrDataUrl} alt="QR" className="w-64 h-64 mx-auto rounded-xl" />
                <p className="font-mono text-sm text-[#6b7280] mt-4 break-all">{qr.code}</p>
                {qr.expiresAt && (
                  <p className="text-xs text-[#9ca3af] mt-1">
                    {t('common.date')}: {new Date(qr.expiresAt).toLocaleString()}
                  </p>
                )}
                <div className="flex justify-center gap-3 mt-6">
                  <a href={qr.qrDataUrl} download="donation-qr.png">
                    <Button variant="ghost" size="sm">Download</Button>
                  </a>
                  <Button size="sm" onClick={() => void generate()} loading={loading}>
                    {t('qr.regenerate')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
