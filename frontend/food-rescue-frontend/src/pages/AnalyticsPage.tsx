import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { BarChart3, Users, UtensilsCrossed, HeartHandshake, TrendingUp } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { analyticsApi } from '../services/analyticsApi';
import { useApi } from '../hooks/useApi';

const CATEGORY_COLORS = ['#2d6a4f', '#40916c', '#f4845f', '#f9a07a', '#74c69d', '#b7e4c7', '#d8f3dc', '#95d5b2'];

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#6b7280]">{label}</span>
        <Icon size={18} className={color} />
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, loading } = useApi(() => analyticsApi.getPlatform(), []);
  const stats = data?.data;

  if (loading) {
    return (
      <PageWrapper>
        <div className="max-w-6xl mx-auto px-4 py-24 text-center text-sm text-[#6b7280]">Loading analytics...</div>
      </PageWrapper>
    );
  }

  if (!stats) {
    return (
      <PageWrapper>
        <div className="max-w-6xl mx-auto px-4 py-24 text-center text-sm text-[#6b7280]">No analytics available.</div>
      </PageWrapper>
    );
  }

  const monthData = (stats.byMonth || []).map(m => ({ month: m.month, listings: m.listings, servings: m.servings }));
  const categoryData = (stats.byCategory || []).map(c => ({ name: c.category, value: c.servings || c.count }));
  const donationStatusData = [
    { name: 'Completed', value: stats.donations.completed },
    { name: 'Pending', value: stats.donations.pending },
    { name: 'Approved', value: stats.donations.approved },
    { name: 'Collected', value: stats.donations.collected },
    { name: 'Delivered', value: stats.donations.delivered },
    { name: 'Cancelled', value: stats.donations.cancelled },
  ].filter(d => d.value > 0);

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2">
            <BarChart3 size={22} className="text-[#2d6a4f]" /> Platform Analytics
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">Live metrics calculated from the database.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard label="Total Users" value={stats.users.total_users} icon={Users} color="text-[#2d6a4f]" />
          <KpiCard label="Food Listings" value={stats.foods.total_listings} icon={UtensilsCrossed} color="text-[#f4845f]" />
          <KpiCard label="Donations" value={stats.donations.total_donations} icon={HeartHandshake} color="text-blue-600" />
          <KpiCard label="Completed" value={stats.donations.completed} icon={TrendingUp} color="text-[#40916c]" />
          <KpiCard label="Servings Shared" value={stats.foods.total_servings} icon={Users} color="text-purple-600" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly trend */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#1c1c1e] mb-4">Listings per Month (last 12)</h2>
            {monthData.length === 0 ? (
              <p className="text-sm text-[#6b7280] py-10 text-center">No monthly data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="listings" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#1c1c1e] mb-4">Food by Category</h2>
            {categoryData.length === 0 ? (
              <p className="text-sm text-[#6b7280] py-10 text-center">No category data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donation status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-sm font-semibold text-[#1c1c1e] mb-4">Donation Status</h2>
          {donationStatusData.length === 0 ? (
            <p className="text-sm text-[#6b7280] py-10 text-center">No donation data yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={donationStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} label>
                    {donationStatusData.map((_, i) => (
                      <Cell key={i} fill={['#2d6a4f', '#f4845f', '#40916c', '#74c69d', '#f9a07a', '#e76f51'][i % 6]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                {donationStatusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="text-[#6b7280]">{d.name}</span>
                    <span className="font-semibold text-[#1c1c1e]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top donors */}
        {stats.topDonors.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#1c1c1e] mb-4">Top Donors</h2>
            <div className="space-y-2">
              {stats.topDonors.map((d, i) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#d8f3dc] text-[#2d6a4f] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    {d.name}{d.organization ? ` · ${d.organization}` : ''}
                  </span>
                  <span className="text-[#6b7280]">{d.listings_count} listings · {d.meals_donated} meals</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
