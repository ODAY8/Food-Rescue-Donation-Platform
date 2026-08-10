import { useState } from 'react';
import { LayoutDashboard, Users, UtensilsCrossed, HeartHandshake, Search, Trash2, ShieldCheck } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { useApi } from '../hooks/useApi';
import { adminApi, type AdminUser, type AdminFood } from '../services/adminApi';
import { Link } from 'react-router-dom';

type Tab = 'overview' | 'users' | 'foods' | 'donations';

const userRoleColor = (r: string): 'green' | 'orange' | 'blue' | 'red' | 'gray' =>
  r === 'DONOR' ? 'green' : r === 'NGO' ? 'orange' : 'blue';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');

  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');

  const { data: dashboard, loading: dashLoading } = useApi(() => adminApi.getDashboard(), []);
  const { data: usersRes, loading: usersLoading, refetch: refetchUsers } = useApi(
    () => adminApi.getUsers({ search: userSearch || undefined, role: userRole || undefined }),
    [userSearch, userRole]
  );
  const { data: foodsRes, loading: foodsLoading, refetch: refetchFoods } = useApi(
    () => adminApi.getFoods({}),
    []
  );
  const { data: donationsRes, loading: donationsLoading } = useApi(
    () => adminApi.getDonations({}),
    []
  );

  if (!user) return null;
  const dash = dashboard?.data;
  const users = usersRes?.data ?? [];
  const foods = foodsRes?.data?.data ?? [];
  const donations = donationsRes?.data?.data ?? [];

  const handleDeleteUser = async (u: AdminUser) => {
    if (!confirm(`Delete user ${u.name}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(u.id);
      toast('User deleted', 'success');
      refetchUsers();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const handleModerateFood = async (f: AdminFood, status: string) => {
    try {
      await adminApi.moderateFood(f.id, status);
      toast(`Food marked ${status.toLowerCase()}`, 'success');
      refetchFoods();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const handleDeleteFood = async (f: AdminFood) => {
    if (!confirm(`Delete listing "${f.title}"?`)) return;
    try {
      await adminApi.deleteFood(f.id);
      toast('Listing deleted', 'success');
      refetchFoods();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'foods', label: 'Foods', icon: UtensilsCrossed },
    { id: 'donations', label: 'Donations', icon: HeartHandshake },
  ];

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2">
              <ShieldCheck size={22} className="text-[#2d6a4f]" /> Admin Dashboard
            </h1>
            <p className="text-[#6b7280] text-sm mt-1">Welcome back, {user.name}</p>
          </div>
          <Link to="/analytics" className="text-sm font-medium text-[#2d6a4f] hover:underline">View Analytics →</Link>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${tab === t.id ? 'bg-white shadow text-[#1c1c1e]' : 'text-[#6b7280]'}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          dashLoading ? (
            <div className="text-sm text-[#6b7280] py-12 text-center">Loading...</div>
          ) : dash && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Users', value: dash.users?.total_users ?? 0 },
                  { label: 'Food Listings', value: dash.foods?.total_listings ?? 0 },
                  { label: 'Donations', value: dash.donations?.total_donations ?? 0 },
                  { label: 'Completed', value: dash.donations?.completed ?? 0 },
                  { label: 'Expired Food', value: dash.foods?.expired ?? 0 },
                ].map(k => (
                  <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="text-xs font-medium text-[#6b7280] mb-1">{k.label}</div>
                    <div className="text-3xl font-bold text-[#2d6a4f]">{k.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-[#1c1c1e] mb-4">Donation Status</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    ['Pending', dash.donations?.pending], ['Approved', dash.donations?.approved],
                    ['Collected', dash.donations?.collected], ['Delivered', dash.donations?.delivered],
                    ['Completed', dash.donations?.completed], ['Cancelled', dash.donations?.cancelled],
                  ].map(([label, value]) => (
                    <div key={label as string} className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-[#1c1c1e]">{value as number}</div>
                      <div className="text-xs text-[#6b7280]">{label as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users by name, email, organization..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                />
              </div>
              <select value={userRole} onChange={e => setUserRole(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none">
                <option value="">All roles</option>
                <option value="DONOR">Donor</option>
                <option value="NGO">NGO</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {usersLoading ? (
              <div className="text-sm text-[#6b7280] py-10 text-center">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-[#6b7280] py-10 text-center">No users found.</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-[#6b7280] border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Listings</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-[#1c1c1e]">{u.name}</td>
                        <td className="px-4 py-3 text-[#6b7280]">{u.email}</td>
                        <td className="px-4 py-3"><Badge label={u.role} color={userRoleColor(u.role)} /></td>
                        <td className="px-4 py-3 text-[#6b7280]">{u.organization || '—'}</td>
                        <td className="px-4 py-3 text-[#6b7280]">{u._count?.foods ?? 0}</td>
                        <td className="px-4 py-3 text-[#6b7280]">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => handleDeleteUser(u)} aria-label="Delete user"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'foods' && (
          foodsLoading ? (
            <div className="text-sm text-[#6b7280] py-10 text-center">Loading...</div>
          ) : foods.length === 0 ? (
            <div className="text-sm text-[#6b7280] py-10 text-center">No food listings.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-[#6b7280] border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Donor</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {foods.map(f => (
                    <tr key={f.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-[#1c1c1e]">{f.title}</td>
                      <td className="px-4 py-3 text-[#6b7280]">{f.donor?.name || '—'}</td>
                      <td className="px-4 py-3 text-[#6b7280]">{f.category}</td>
                      <td className="px-4 py-3 text-[#6b7280]">{f.quantity} {f.unit}</td>
                      <td className="px-4 py-3">
                        <Badge label={f.status} color={f.status === 'AVAILABLE' ? 'green' : f.status === 'CLAIMED' ? 'orange' : 'red'} />
                      </td>
                      <td className="px-4 py-3 text-[#6b7280]">{new Date(f.expiryDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <select
                          value={f.status}
                          onChange={e => handleModerateFood(f, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white">
                          <option value="AVAILABLE">Set Available</option>
                          <option value="CLAIMED">Set Claimed</option>
                          <option value="EXPIRED">Set Expired</option>
                        </select>
                        <button onClick={() => handleDeleteFood(f)} aria-label="Delete food"
                          className="ml-2 p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'donations' && (
          donationsLoading ? (
            <div className="text-sm text-[#6b7280] py-10 text-center">Loading...</div>
          ) : donations.length === 0 ? (
            <div className="text-sm text-[#6b7280] py-10 text-center">No donations yet.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-[#6b7280] border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Food</th>
                    <th className="px-4 py-3">Donor</th>
                    <th className="px-4 py-3">NGO</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map(d => (
                    <tr key={d.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-[#1c1c1e]">{d.food?.title}</td>
                      <td className="px-4 py-3 text-[#6b7280]">{d.donor?.name || '—'}</td>
                      <td className="px-4 py-3 text-[#6b7280]">{d.ngo?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge label={d.status} color="blue" /></td>
                      <td className="px-4 py-3 text-[#6b7280]">{new Date(d.requestedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </PageWrapper>
  );
}
