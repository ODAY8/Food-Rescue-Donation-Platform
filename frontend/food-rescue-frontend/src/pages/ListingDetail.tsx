import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, Users, Calendar, ArrowLeft, CheckCircle } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ExpiryPredictionCard from '../components/food/ExpiryPredictionCard';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { foodApi } from '../services/foodApi';
import { donationApi } from '../services/donationApi';
import { useApi } from '../hooks/useApi';

const categoryColors: Record<string, 'green' | 'orange' | 'blue' | 'gray'> = {
  Bakery: 'orange', Produce: 'green', Dairy: 'blue',
  Prepared: 'orange', Pantry: 'gray', Beverages: 'blue',
};

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  return h < 24 ? `${h} hours` : `${Math.floor(h / 24)} days`;
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: res, loading: fetching, error } = useApi(() => foodApi.getById(id!), [id]);
  const food = res?.data;

  if (fetching) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-24 text-center text-[#6b7280]">Loading...</div>
      </PageWrapper>
    );
  }

  if (error || !food) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-bold text-[#1c1c1e] mb-2">Listing not found</h2>
          <Button onClick={() => navigate('/browse')}>Back to Browse</Button>
        </div>
      </PageWrapper>
    );
  }

  const handleClaim = async () => {
    setLoading(true);
    try {
      await donationApi.claim(food.id);
      setClaimed(true);
      setConfirmOpen(false);
      toast('Listing claimed! The donor has been notified.', 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Claim failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isClaimed = claimed || food.status !== 'AVAILABLE';

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#2d6a4f] transition-colors mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="relative rounded-2xl overflow-hidden">
              {food.imageUrl ? (
                <img src={food.imageUrl} alt={food.title} className="w-full h-72 object-cover" />
              ) : (
                <div className="w-full h-72 bg-[#d8f3dc] flex items-center justify-center text-[#2d6a4f] text-4xl font-bold rounded-2xl">
                  {food.title[0]}
                </div>
              )}
              <div className="absolute top-3 left-3">
                <Badge label={food.category} color={categoryColors[food.category] ?? 'gray'} />
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1c1c1e] mb-2">{food.title}</h1>
              <p className="text-[#6b7280] text-sm leading-relaxed">{food.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Users,    label: 'Servings',      value: String(food.servings) },
                { icon: Clock,    label: 'Expires in',    value: timeUntil(food.expiryDate) },
                { icon: MapPin,   label: 'Location',      value: `${food.pickupLocation}, ${food.city}` },
                { icon: Calendar, label: 'Pickup window', value: food.pickupWindow },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-[#f0fdf4] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#6b7280] mb-1"><Icon size={12} /> {label}</div>
                  <div className="text-sm font-semibold text-[#1c1c1e]">{value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d8f3dc] text-[#2d6a4f] font-bold flex items-center justify-center">
                {food.donor.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1c1c1e]">{food.donor.name}</div>
                {food.donor.organization && <div className="text-xs text-[#6b7280]">{food.donor.organization}</div>}
              </div>
            </div>

            {isClaimed ? (
              <div className="flex items-center gap-2 bg-[#d8f3dc] text-[#2d6a4f] rounded-xl px-4 py-3 text-sm font-semibold">
                <CheckCircle size={18} /> {claimed ? 'You claimed this listing!' : 'Already claimed'}
              </div>
            ) : (
              <Button size="lg" className="w-full" onClick={() => user ? setConfirmOpen(true) : navigate('/auth')}>
                {user ? 'Claim This Donation' : 'Sign in to Claim'}
              </Button>
            )}
          </motion.div>
        </div>

        {/* V2: AI expiry prediction */}
        <div className="mt-8">
          <ExpiryPredictionCard foodId={food.id} />
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Claim">
        <p className="text-sm text-[#6b7280] mb-6">
          You're about to claim <strong className="text-[#1c1c1e]">{food.title}</strong> from {food.donor.name}.
          Please ensure you can pick up during: <strong className="text-[#1c1c1e]">{food.pickupWindow}</strong>.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleClaim} loading={loading}>Confirm Claim</Button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
