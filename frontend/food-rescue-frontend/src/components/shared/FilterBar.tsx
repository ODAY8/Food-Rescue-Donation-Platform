import { Search } from 'lucide-react';

// Must match the backend FoodCategory enum
const CATEGORIES = ['Produce', 'Dairy', 'Bakery', 'Meat', 'Prepared', 'Beverages', 'Pantry', 'Other'];
const EXPIRY_OPTIONS = [
  { label: 'Any time', value: '' },
  { label: 'Expiring soon (< 8h)', value: '8' },
  { label: 'Today (< 24h)', value: '24' },
  { label: 'This week', value: '168' },
];

export interface Filters {
  search: string;
  category: string;
  expiry: string;
  city: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[180px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search food..."
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
          aria-label="Search food listings"
        />
      </div>

      <select
        value={filters.category}
        onChange={e => set('category', e.target.value)}
        className="text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select
        value={filters.expiry}
        onChange={e => set('expiry', e.target.value)}
        className="text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white"
        aria-label="Filter by expiry window"
      >
        {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <input
        type="text"
        placeholder="City..."
        value={filters.city}
        onChange={e => set('city', e.target.value)}
        className="text-sm rounded-xl border border-gray-200 px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
        aria-label="Filter by city"
      />

      {(filters.search || filters.category || filters.expiry || filters.city) && (
        <button
          onClick={() => onChange({ search: '', category: '', expiry: '', city: '' })}
          className="text-xs text-[#6b7280] hover:text-red-500 transition-colors underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
