import { motion } from 'framer-motion';
import { Clock, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { FoodItem } from '../../services/foodApi';
import Badge from '../ui/Badge';

interface FoodCardProps {
  food: FoodItem;
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}

function urgencyColor(iso: string): 'red' | 'orange' | 'green' {
  const h = (new Date(iso).getTime() - Date.now()) / 3600000;
  if (h < 8) return 'red';
  if (h < 24) return 'orange';
  return 'green';
}

const categoryColors: Record<string, 'green' | 'orange' | 'blue' | 'gray'> = {
  Bakery: 'orange', Produce: 'green', Dairy: 'blue',
  Prepared: 'orange', Pantry: 'gray', Beverages: 'blue',
};

const urgencyClass = { red: 'text-red-500', orange: 'text-orange-500', green: 'text-[#2d6a4f]' };

export default function FoodCard({ food }: FoodCardProps) {
  const isClaimed = food.status !== 'AVAILABLE';
  const urg = urgencyColor(food.expiryDate);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col"
    >
      <Link to={`/listing/${food.id}`} className="block relative">
        {food.imageUrl ? (
          <img src={food.imageUrl} alt={food.title}
            className={`w-full h-48 object-cover transition-transform duration-300 hover:scale-105 ${isClaimed ? 'opacity-60 grayscale' : ''}`} />
        ) : (
          <div className={`w-full h-48 bg-[#d8f3dc] flex items-center justify-center text-[#2d6a4f] text-4xl font-bold ${isClaimed ? 'opacity-60' : ''}`}>
            {food.title[0]}
          </div>
        )}
        {isClaimed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
              {food.status === 'EXPIRED' ? 'Expired' : 'Claimed'}
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge label={food.category} color={categoryColors[food.category] ?? 'gray'} />
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <Link to={`/listing/${food.id}`}>
          <h3 className="font-semibold text-[#1c1c1e] hover:text-[#2d6a4f] transition-colors line-clamp-1">{food.title}</h3>
        </Link>
        <p className="text-xs text-[#6b7280] line-clamp-2">{food.description}</p>

        <div className="flex items-center gap-3 text-xs text-[#6b7280] mt-auto pt-2">
          <span className="flex items-center gap-1"><Users size={12} /> {food.servings} servings</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {food.city}</span>
          <span className={`flex items-center gap-1 ml-auto font-medium ${urgencyClass[urg]}`}>
            <Clock size={12} /> {timeUntil(food.expiryDate)}
          </span>
        </div>

        <div className="text-xs text-[#6b7280] flex items-center gap-1.5 pt-1 border-t border-gray-50">
          <div className="w-5 h-5 rounded-full bg-[#d8f3dc] text-[#2d6a4f] text-[10px] font-bold flex items-center justify-center">
            {food.donor.name[0]}
          </div>
          {food.donor.name}{food.donor.organization ? ` · ${food.donor.organization}` : ''}
        </div>
      </div>
    </motion.div>
  );
}
