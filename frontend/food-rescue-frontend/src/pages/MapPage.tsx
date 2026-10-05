import { MapPin } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import GoogleMap from '../components/GoogleMap';
import ErrorBoundary from '../components/ErrorBoundary';
import { foodApi, type FoodItem } from '../services/foodApi';
import { useApi } from '../hooks/useApi';

// Live Map (Version 2.0):
// Renders a real Google Map with donation markers from the API, plus the
// existing pickup-location list below. Driver tracking and route
// optimization remain planned for a future version.
export default function MapPage() {
  const { data, loading } = useApi(() => foodApi.getAll({ status: 'AVAILABLE', limit: 100 }), []);
  const foods: FoodItem[] = data?.data?.data ?? [];
  const geolocated = foods.filter((f): f is FoodItem & { latitude: number; longitude: number } =>
    typeof f.latitude === 'number' && typeof f.longitude === 'number'
  );

  // Map-ready donation markers (clean structure; can later come from any backend source)
  const markers = geolocated.map(f => ({
    id: f.id,
    title: f.pickupLocation,
    latitude: f.latitude,
    longitude: f.longitude,
    foodName: f.title,
    quantity: `${f.quantity} ${f.unit}`,
    expiryDate: f.expiryDate,
    donorName: f.donor?.organization || f.donor?.name,
    status: f.status,
  }));

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1c1c1e] flex items-center gap-2">
            <MapPin size={22} className="text-[#2d6a4f]" /> Live Map
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">
            Real pickup points from live listings. Click a marker for donation details.
          </p>
        </div>

        {/* Live Google Map */}
        <div className="mb-8">
          <ErrorBoundary>
            <GoogleMap markers={markers} height="480px" />
          </ErrorBoundary>
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
