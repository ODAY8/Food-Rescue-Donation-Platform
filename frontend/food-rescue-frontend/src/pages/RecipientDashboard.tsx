import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Clock, CheckCircle, MapPin, ScanLine, CalendarClock, Sparkles } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { foodApi } from '../services/foodApi';
import { donationApi, type Donation, type DonationStatus } from '../services/donationApi';
import { resolveAssetUrl } from '../services/apiClient';
import { useApi } from '../hooks/useApi';
import { useState } from 'react';


const NGO_ACTIONS = [
  { label: 'Scan QR', to: '/ngo/scan', icon: ScanLine, desc: 'Verify a pickup and confirm collection' },
  { label: 'Scheduled Donations', to: '/ngo/scheduled', icon: CalendarClock, desc: 'Accept upcoming scheduled donations' },
];

const claimStatusConfig: Record<string, { label: string; color: 'green' | 'orange' | 'blue' | 'red' | 'gray' }> = {
  PENDING:          { label: 'Pending Approval', color: 'orange' },
  APPROVED:         { label: 'Approved',         color: 'blue' },
  REJECTED:         { label: 'Rejected',         color: 'red' },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: 'blue' },
  COLLECTED:        { label: 'Collected',        color: 'blue' },
  DELIVERED:        { label: 'Delivered',        color: 'green' },
  COMPLETED:        { label: 'Completed',        color: 'green' },
  CANCELLED:        { label: 'Cancelled',        color: 'red' },
};

const NEXT_STATUS: Partial<Record<DonationStatus, DonationStatus>> = {
  PICKUP_SCHEDULED: 'COLLECTED',
  COLLECTED: 'DELIVERED',
};

export default function RecipientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<'available' | 'claims'>('available');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: foodsRes, loading: foodsLoading } = useApi(() => foodApi.getAll({ status: 'AVAILABLE' }), []);
  const { data: claimsRes, loading: claimsLoading, refetch: refetchClaims } = useApi(() => donationApi.getMyClaims(), [user?.id]);

  if (!user) {
    return (
      <PageWrapper>
        <div className="max-w-6xl mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h2>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </PageWrapper>
    );
  }

  const available = foodsRes?.data?.data ?? [];
  const claims: Donation[] = claimsRes?.data ?? [];

  const activeClaims    = claims.filter(c => ['PENDING', 'APPROVED', 'COLLECTED', 'DELIVERED'].includes(c.status));
  const completedClaims = claims.filter(c => c.status === 'COMPLETED');
  const mealsReceived   = completedClaims.reduce((s, c) => s + (c.food?.servings || 0), 0);

  const stats = [
    { label: 'Active Claims',      value: activeClaims.length,    icon: Clock,        color: 'text-[#f4845f]' },
    { label: 'Pickups Completed',  value: completedClaims.length, icon: CheckCircle,  color: 'text-[#2d6a4f]' },
    { label: 'Meals Received',     value: mealsReceived,          icon: Heart,        color: 'text-blue-600' },
  ];

  const handleAdvance = async (donation: Donation) => {
    const next = NEXT_STATUS[donation.status];
    if (!next) return;
    setUpdatingId(donation.id);
    try {
      await donationApi.updateStatus(donation.id, next);
      toast(`Status updated to ${next.toLowerCase()}`, 'success');
      refetchClaims();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1c1c1e]">NGO Dashboard</h1>
          <p className="text-[#6b7280] text-sm mt-1">Welcome back, {user.name}{user.organization ? ` · ${user.organization}` : ''}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <s.icon size={22} className={`${s.color} mx-auto mb-2`} />
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[#6b7280] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* V2 quick actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#1c1c1e] mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-[#f4845f]" /> Smart Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            {NGO_ACTIONS.map(a => (
              <Link key={a.to} to={a.to} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-[#2d6a4f]/30 transition-all flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d8f3dc] text-[#2d6a4f] flex items-center justify-center flex-shrink-0">
                  <a.icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-[#1c1c1e]">{a.label}</div>
                  <div className="text-xs text-[#6b7280] mt-0.5">{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(['available', 'claims'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-white shadow text-[#1c1c1e]' : 'text-[#6b7280]'}`}>
              {t === 'available' ? `Available (${available.length})` : `My Claims (${claims.length})`}
            </button>
          ))}
        </div>

        {tab === 'available' ? (
          foodsLoading ? (
            <div className="text-sm text-[#6b7280] py-8 text-center">Loading...</div>
          ) : (
            <motion.div key="available" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {available.map(food => (
                <motion.div key={food.id} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer"
                  onClick={() => navigate(`/listing/${food.id}`)}>
                  {food.imageUrl && (
                    <img
                      src={resolveAssetUrl(food.imageUrl)}
                      alt={food.title}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="font-semibold text-[#1c1c1e] text-sm mb-1">{food.title}</div>
                    <div className="text-xs text-[#6b7280] line-clamp-2 mb-2">{food.description}</div>
                    <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                      <MapPin size={11} /> {food.city}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )
        ) : (
          <motion.div key="claims" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {claimsLoading ? (
              <div className="text-sm text-[#6b7280] py-8 text-center">Loading...</div>
            ) : claims.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <Heart size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-[#6b7280] text-sm">No claims yet. Browse available food and claim what you need.</p>
                <Button className="mt-4" onClick={() => setTab('available')}>Browse Available Food</Button>
              </div>
            ) : (
              claims.map((claim, i) => {
                const cfg = claimStatusConfig[claim.status] ?? { label: claim.status, color: 'gray' as const };
                const next = NEXT_STATUS[claim.status];
                return (
                  <motion.div key={claim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                    {claim.food.imageUrl && (
                      <img
                        src={resolveAssetUrl(claim.food.imageUrl)}
                        alt={claim.food.title}
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#1c1c1e] text-sm">{claim.food.title}</div>
                      <div className="text-xs text-[#6b7280] flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {claim.food.pickupLocation}, {claim.food.city}
                      </div>
                      <div className="text-xs text-[#6b7280] mt-0.5">
                        Claimed {new Date(claim.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={cfg.label} color={cfg.color} />
                      {next && (
                        <Button size="sm" loading={updatingId === claim.id} onClick={() => handleAdvance(claim)}>
                          Mark {next.charAt(0) + next.slice(1).toLowerCase()}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
