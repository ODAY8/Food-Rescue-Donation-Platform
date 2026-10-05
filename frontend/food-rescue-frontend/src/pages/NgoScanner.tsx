import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanLine, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToast } from '../hooks/useToast';
import { qrApi, type QrResolveResult } from '../services/qrApi';
import { translateError } from '../utils/errorMessages';

export default function NgoScanner() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<QrResolveResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [busy, setBusy] = useState(false);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => () => { void stopScanner(); }, []);

  const startScanner = async () => {
    setScanning(true);
    setResult(null);
    try {
      scannerRef.current = new Html5Qrcode('qr-reader-region');
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => { void resolve(decodedText); },
        () => {}
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : t('qr.notFound'), 'error');
      setScanning(false);
    }
  };

  const resolve = async (code: string) => {
    await stopScanner();
    setBusy(true);
    try {
      const res = await qrApi.resolve(code.trim());
      setResult(res.data);
    } catch (e) {
      toast(translateError(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await resolve(manualCode.trim());
    setManualCode('');
  };

  const confirmAction = async (action: 'collect' | 'deliver') => {
    if (!result?.donation?.id) return;
    setBusy(true);
    try {
      if (action === 'collect') {
        await qrApi.confirmCollect(result.donation.id);
        toast(t('qr.collect') + ' ✓', 'success');
      } else {
        await qrApi.confirmDeliver(result.donation.id);
        toast(t('qr.deliver') + ' ✓', 'success');
      }
      setResult(null);
    } catch (e) {
      toast(translateError(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2 mb-6">
          <ScanLine size={24} className="text-[#2d6a4f]" />
          {t('qr.scan')}
        </h1>

        {!scanning && !result && (
          <div className="space-y-4">
            <Button onClick={() => void startScanner()} className="w-full" size="lg">
              <ScanLine size={18} />
              {t('qr.scan')}
            </Button>

            <form onSubmit={handleManual} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#1c1c1e] mb-2">
                <Keyboard size={16} />
                {t('qr.manualCode')}
              </label>
              <div className="flex gap-2">
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="FRD-..."
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono"
                />
                <Button type="submit" size="sm">OK</Button>
              </div>
            </form>
          </div>
        )}

        <div id="qr-reader-region" className={scanning ? 'bg-white rounded-2xl border border-gray-100 p-4' : 'hidden'} />

        {scanning && (
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => void stopScanner()}>
            {t('common.cancel')}
          </Button>
        )}

        {result && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1c1c1e]">{result.foodTitle}</h3>
              <Badge label={t(`status.${result.status}`)} color={result.status === 'COLLECTED' ? 'orange' : 'green'} />
            </div>
            {result.pickupLocation && <p className="text-sm text-[#6b7280]">{result.pickupLocation}</p>}
            {result.city && <p className="text-sm text-[#6b7280]">{result.city}</p>}
            {result.scheduledAt && (
              <p className="text-sm text-[#6b7280]">
                {t('scheduled.scheduledFor')}: {new Date(result.scheduledAt).toLocaleString()}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              {result.status === 'PICKUP_SCHEDULED' || result.status === 'APPROVED' ? (
                <Button className="flex-1" onClick={() => void confirmAction('collect')} loading={busy}>
                  {t('qr.collect')}
                </Button>
              ) : result.status === 'COLLECTED' ? (
                <Button className="flex-1" onClick={() => void confirmAction('deliver')} loading={busy}>
                  {t('qr.deliver')}
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => setResult(null)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
