import { MapPin } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { foodApi, type FoodItem } from '../services/foodApi';
import { useApi } from '../hooks/useApi';

// Live Map foundation (Version 1.0):
// Renders real pickup locations from the API. Full interactive mapping,
// driver tracking, and route optimization are planned for Version 3.0.
export default function MapPage() {
  const { data, loading } = useApi(() => foodApi.getAll({ status: 'AVAILABLE', limit: 100 }), []);
  const foods: FoodItem[] = data?.data?.data ?? [];
  const geolocated = foods.filter(f => f.latitude && f.longitude);

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2">
            <MapPin size={22} className="text-[#2d6a4f]" /> Pickup Locations
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">
            Live pickup points from real listings. Interactive maps arrive in Version 3.0.
          </p>
        </div>

        {/* Map foundation — static grid placeholder; no private info exposed */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="relative h-64 bg-[#d8f3dc]/40 grid place-items-center">
            <div className="text-center">
              <MapPin size={40} className="text-[#2d6a4f] mx-auto mb-2" />
              <p className="text-sm text-[#6b7280]">Interactive map coming in Version 3.0</p>
              <p className="text-xs text-[#6b7280] mt-1">{geolocated.length} geolocated pickup points loaded</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-[#6b7280] py-10 text-center">Loading locations...</div>
        ) : foods.length === 0 ? (
          <div className="text-sm text-[#6b7280] py-10 text-center">No available pickup locations right now.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {foods.map(f => (
              <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="font-medium text-sm text-[#1c1c1e]">{f.title}</div>
                <div className="text-xs text-[#6b7280] mt-1 flex items-center gap-1">
                  <MapPin size={12} /> {f.pickupLocation || 'Address on request'}, {f.city}
                </div>
                <div className="text-xs text-[#6b7280] mt-0.5">Donated by {f.donor?.organization || f.donor?.name}</div>
                {f.latitude && f.longitude && (
                  <div className="text-[11px] text-gray-400 mt-1">
                    {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
