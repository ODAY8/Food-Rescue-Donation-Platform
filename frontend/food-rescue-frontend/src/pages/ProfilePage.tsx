import { useState } from 'react';
import { User, Save } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { authApi } from '../services/authApi';
import { ROLE_LABELS } from '../utils/roles';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    organization: user?.organization ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  });

  if (!user) return null;

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      await refreshUser();
      toast('Profile updated!', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2">
            <User size={22} className="text-[#2d6a4f]" /> My Profile
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">
            {ROLE_LABELS[user.role] ?? user.role} account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-[#6b7280] mb-1 block" htmlFor="name">Full Name</label>
            <input id="name" type="text" required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6b7280] mb-1 block" htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6b7280] mb-1 block" htmlFor="organization">Organization</label>
            <input id="organization" type="text" value={form.organization} onChange={e => set('organization', e.target.value)}
              placeholder="Restaurant / NGO / etc."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6b7280] mb-1 block" htmlFor="phone">Phone</label>
            <input id="phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+1-555-0100"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
          </div>

          <div>
            <label className="text-xs font-medium text-[#6b7280] mb-1 block" htmlFor="address">Address</label>
            <input id="address" type="text" value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Street address"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
          </div>

          <Button type="submit" loading={saving} className="w-full">
            <Save size={16} /> Save Changes
          </Button>
        </form>
      </div>
    </PageWrapper>
  );
}
