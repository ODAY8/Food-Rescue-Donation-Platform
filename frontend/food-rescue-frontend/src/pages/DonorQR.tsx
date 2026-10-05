import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { QrCode, RefreshCw, Download } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { donationApi } from '../services/donationApi';
import { qrApi, type QrGenerated } from '../services/qrApi';
import { translateError } from '../utils/errorMessages';

export default function DonorQR() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [qr, setQr] = useState<QrGenerated | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: donationRes } = useApi(() => (id ? donationApi.getById(id) : Promise.reject('no id')), [id]);

  const generate = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await qrApi.generate(id);
      setQr(res.data);
      toast(t('common.success'), 'success');
    } catch (e) {
      toast(translateError(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center justify-center gap-2 mb-2">
          <QrCode size={24} className="text-[#2d6a4f]" />
          {t('qr.title')}
        </h1>
        <p className="text-sm text-[#6b7280] mb-8">
          {donationRes?.data?.food?.title ?? t('listing.donor')}
        </p>

        {!qr && (
          <Button onClick={() => void generate()} loading={loading}>
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
                <Button variant="ghost" size="sm">
                  <Download size={14} />
                  Download
                </Button>
              </a>
              <Button size="sm" onClick={() => void generate()} loading={loading}>
                <RefreshCw size={14} />
                {t('qr.regenerate')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
