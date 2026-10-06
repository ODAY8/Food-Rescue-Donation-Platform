import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Package, Clock, Pencil, Trash2, Sparkles, Camera, QrCode, Boxes, CalendarClock } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { foodApi, type FoodItem, type CreateFoodBody } from '../services/foodApi';
import { donationApi, type Donation } from '../services/donationApi';
import { resolveAssetUrl } from '../services/apiClient';
import { useApi } from '../hooks/useApi';


const QUICK_ACTIONS = [
  { label: 'AI Expiry Prediction', to: '/browse', icon: Sparkles, desc: 'See AI risk scores on every listing' },
  { label: 'Food Image Recognition', to: '/donor/food/new', icon: Camera, desc: 'Upload a photo to auto-fill a listing' },
  { label: 'Generate QR Code', to: '/donor/qr', icon: QrCode, desc: 'Create a pickup QR for a donation' },
  { label: 'Inventory', to: '/donor/inventory', icon: Boxes, desc: 'Track stock and donate from inventory' },
  { label: 'Scheduled Donations', to: '/donor/scheduled', icon: CalendarClock, desc: 'Plan future donation pickups' },
];

const CATEGORIES = ['Produce', 'Bakery', 'Dairy', 'Meat', 'Prepared', 'Beverages', 'Pantry', 'Other'];

const statusConfig: Record<string, { label: string; color: 'green' | 'orange' | 'blue' | 'red' | 'gray' }> = {
  AVAILABLE: { label: 'Available', color: 'green' },
  CLAIMED:   { label: 'Claimed',   color: 'orange' },
  EXPIRED:   { label: 'Expired',   color: 'red' },
};

const donationStatusConfig: Record<string, { label: string; color: 'green' | 'orange' | 'blue' | 'red' | 'gray' }> = {
  PENDING:          { label: 'Pending',          color: 'orange' },
  APPROVED:         { label: 'Approved',         color: 'blue' },
  REJECTED:         { label: 'Rejected',         color: 'red' },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: 'blue' },
  COLLECTED:        { label: 'Collected',        color: 'blue' },
  DELIVERED:        { label: 'Delivered',        color: 'green' },
  COMPLETED:        { label: 'Completed',        color: 'green' },
  CANCELLED:        { label: 'Cancelled',        color: 'red' },
};

const EMPTY_FORM: CreateFoodBody = {
  title: '', description: '', category: 'Produce', quantity: 0, unit: 'kg',
  servings: 0, expiryDate: '', pickupLocation: '', pickupWindow: '', city: '', imageUrl: '',
};

export default function DonorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FoodItem | null>(null);
  const [form, setForm] = useState<CreateFoodBody>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const { data: foodsRes, loading: foodsLoading, refetch: refetchFoods } = useApi(() => foodApi.getMy(), [user?.id]);
  const { data: donationsRes, loading: donationsLoading } = useApi(() => donationApi.getMyDonations(), [user?.id]);

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

  const foods: FoodItem[] = foodsRes?.data ?? [];
  const donations: Donation[] = donationsRes?.data ?? [];

  const active = foods.filter(f => f.status === 'AVAILABLE');
  const totalMeals = foods.reduce((s, f) => s + (f.servings || 0), 0);

  const stats = [
    { label: 'Active Listings', value: active.length, color: 'text-[#2d6a4f]' },
    { label: 'Total Donated', value: foods.length, color: 'text-[#f4845f]' },
    { label: 'Meals Rescued', value: totalMeals, color: 'text-blue-600' },
  ];

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (food: FoodItem) => {
    setEditTarget(food);
    setForm({
      title: food.title, description: food.description, category: food.category,
      quantity: food.quantity, unit: food.unit, servings: food.servings,
      expiryDate: food.expiryDate.slice(0, 10), pickupLocation: food.pickupLocation,
      pickupWindow: food.pickupWindow, city: food.city, imageUrl: food.imageUrl,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await foodApi.delete(id);
      toast('Listing deleted.', 'success');
      refetchFoods();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  };

  const handleApprove = async (donation: Donation) => {
    try {
      await donationApi.updateStatus(donation.id, 'APPROVED');
      toast('Claim approved!', 'success');
      refetchFoods();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const handleReject = async (donation: Donation) => {
    if (!confirm(`Reject the claim for "${donation.food.title}"?`)) return;
    try {
      await donationApi.updateStatus(donation.id, 'REJECTED');
      toast('Claim rejected.', 'success');
      refetchFoods();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const handleSchedulePickup = async (donation: Donation) => {
    try {
      await donationApi.updateStatus(donation.id, 'PICKUP_SCHEDULED');
      toast('Pickup scheduled!', 'success');
      refetchFoods();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget) {
        await foodApi.update(editTarget.id, form);
        toast('Listing updated!', 'success');
      } else {
        await foodApi.create(form);
        toast('Listing posted! NGOs can now claim it.', 'success');
      }
      setModalOpen(false);
      refetchFoods();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed to save listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: keyof CreateFoodBody, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const pendingDonations = donations.filter(d => d.status === 'PENDING');

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1c1c1e]">Donor Dashboard</h1>
            <p className="text-[#6b7280] text-sm mt-1">Welcome back, {user.name}{user.organization ? ` · ${user.organization}` : ''}</p>
          </div>
          <Button onClick={openCreate}><Plus size={16} /> Post Surplus Food</Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
              <div className="text-xs text-[#6b7280] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* V2 quick actions */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-[#1c1c1e] mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-[#f4845f]" /> Smart Donor Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map(a => (
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

        {/* Pending approvals */}
        {pendingDonations.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-[#1c1c1e] mb-4 flex items-center gap-2">
              <Clock size={18} className="text-[#f4845f]" /> Pending Approvals ({pendingDonations.length})
            </h2>
            <div className="space-y-3 mb-8">
              {pendingDonations.map(d => (
                <div key={d.id} className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-[#1c1c1e]">{d.food.title}</div>
                    <div className="text-xs text-[#6b7280]">Claimed by {d.ngo?.name || 'NGO'}{d.ngo?.organization ? ` · ${d.ngo.organization}` : ''}</div>
                  </div>
                  <Button size="sm" onClick={() => handleApprove(d)}>Approve</Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleReject(d)}>Reject</Button>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="text-lg font-semibold text-[#1c1c1e] mb-4 flex items-center gap-2">
          <Package size={18} className="text-[#2d6a4f]" /> My Listings
        </h2>
        {foodsLoading ? (
          <div className="text-sm text-[#6b7280] py-8 text-center">Loading...</div>
        ) : foods.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center mb-8">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-[#6b7280] text-sm">No listings yet. Post your first surplus food donation!</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {foods.map((f, i) => {
              const cfg = statusConfig[f.status] ?? { label: f.status, color: 'gray' as const };
              return (
                <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  {f.imageUrl && (
                    <img
                      src={resolveAssetUrl(f.imageUrl)}
                      alt={f.title}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1c1c1e] text-sm truncate">{f.title}</div>
                    <div className="text-xs text-[#6b7280]">{f.quantity} {f.unit} · {f.pickupWindow}</div>
                  </div>
                  <Badge label={cfg.label} color={cfg.color} />
                  {f.status === 'AVAILABLE' && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#6b7280]"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <h2 className="text-lg font-semibold text-[#1c1c1e] mb-4">Donation History</h2>
        {donationsLoading ? (
          <div className="text-sm text-[#6b7280] py-4 text-center">Loading...</div>
        ) : donations.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No donation activity yet.</p>
        ) : (
          <div className="space-y-3">
            {donations.map((d, i) => {
              const cfg = donationStatusConfig[d.status] ?? { label: d.status, color: 'gray' as const };
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 opacity-80">
                  {d.food.imageUrl && (
                    <img
                      src={resolveAssetUrl(d.food.imageUrl)}
                      alt={d.food.title}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 grayscale"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1c1c1e] text-sm truncate">{d.food.title}</div>
                    <div className="text-xs text-[#6b7280]">{d.food.servings} servings · {new Date(d.createdAt).toLocaleDateString()}</div>
                  </div>
                  <Badge label={cfg.label} color={cfg.color} />
                  <Link to="/donor/qr" aria-label={`Generate QR for ${d.food.title}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#6b7280]">
                    <QrCode size={14} />
                  </Link>
                  {d.status === 'APPROVED' && (
                    <Button size="sm" onClick={() => handleSchedulePickup(d)}>Schedule Pickup</Button>
                  )}
                  {d.status === 'DELIVERED' && (
                    <Button size="sm" onClick={() => donationApi.updateStatus(d.id, 'COMPLETED').then(() => { toast('Donation completed!', 'success'); refetchFoods(); })}>
                      Complete
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Listing' : 'Post Surplus Food'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {([
            { id: 'title', label: 'Title', placeholder: 'e.g. Fresh Sourdough Loaves', key: 'title' as const, type: 'text' },
            { id: 'pickupLocation', label: 'Pickup Address', placeholder: 'Street address', key: 'pickupLocation' as const, type: 'text' },
            { id: 'pickupWindow', label: 'Pickup Window', placeholder: 'e.g. Today 6–8 PM', key: 'pickupWindow' as const, type: 'text' },
            { id: 'city', label: 'City', placeholder: 'e.g. New York', key: 'city' as const, type: 'text' },
            { id: 'imageUrl', label: 'Image URL (optional)', placeholder: 'https://...', key: 'imageUrl' as const, type: 'url' },
          ] as const).map(f => (
            <div key={f.id}>
              <label htmlFor={f.id} className="text-xs font-medium text-[#6b7280] mb-1 block">{f.label}</label>
              <input id={f.id} type={f.type} required={f.key !== 'imageUrl'} value={String(form[f.key])} onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder} className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-[#6b7280] mb-1 block">Quantity</label>
              <input type="number" min={1} required value={form.quantity} onChange={e => set('quantity', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b7280] mb-1 block">Unit</label>
              <input type="text" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="kg"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b7280] mb-1 block">Servings</label>
              <input type="number" min={0} value={form.servings} onChange={e => set('servings', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#6b7280] mb-1 block">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6b7280] mb-1 block">Expiry Date</label>
              <input type="date" required value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#6b7280] mb-1 block">Description</label>
            <textarea required value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="Brief description of the food..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1">{editTarget ? 'Save Changes' : 'Post Listing'}</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
