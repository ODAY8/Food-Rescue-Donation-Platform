import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PackageOpen } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import FoodCard from '../components/shared/FoodCard';
import FilterBar, { type Filters } from '../components/shared/FilterBar';
import { CardSkeleton } from '../components/ui/Skeleton';
import { foodApi, type FoodItem } from '../services/foodApi';
import { searchApi } from '../services/searchApi';

export default function Browse() {
  const [filters, setFilters] = useState<Filters>({ search: '', category: '', expiry: '', city: '' });
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const hasQuery = filters.search.trim().length > 0;
      const base: { category?: string; city?: string } = {
        category: filters.category || undefined,
        city: filters.city || undefined,
      };
      let items: FoodItem[];
      let serverTotal: number;
      if (hasQuery) {
        // V2 smart search
        const res = await searchApi.search({ q: filters.search.trim(), ...base, availability: 'true' });
        items = res.data;
        serverTotal = res.pagination.total;
      } else {
        // Normal browsing
        const res = await foodApi.getAll({ ...base, status: 'AVAILABLE' });
        items = res.data.data;
        serverTotal = res.data.pagination.total;
      }
      // Client-side expiry window filter (server doesn't support it yet)
      if (filters.expiry) {
        const maxHours = Number(filters.expiry);
        items = items.filter(f => {
          const h = (new Date(f.expiryDate).getTime() - Date.now()) / 3600000;
          return h > 0 && h <= maxHours;
        });
      }
      setFoods(items);
      setTotal(filters.expiry ? items.length : serverTotal);
    } catch {
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchFoods, 300); // 300ms debounce
    return () => clearTimeout(t);
  }, [fetchFoods]);

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1c1c1e] mb-1">Browse Surplus Food</h1>
          <p className="text-[#6b7280]">Find available donations near you and claim them for your community.</p>
        </div>

        <div className="mb-6">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : foods.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <PackageOpen size={56} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-[#1c1c1e] mb-2">No listings found</h3>
            <p className="text-sm text-[#6b7280]">Try adjusting your filters or check back soon for new donations.</p>
          </motion.div>
        ) : (
          <>
            <p className="text-sm text-[#6b7280] mb-4">{total} listing{total !== 1 ? 's' : ''} found</p>
            <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden" animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
              {foods.map(food => (
                <motion.div key={food.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <FoodCard food={food} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
