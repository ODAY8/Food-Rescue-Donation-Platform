import { Link } from 'react-router-dom';
import { Leaf, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1b4332] text-white mt-24">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg mb-3">
            <Leaf size={20} className="text-[#52b788]" />
            FoodRescue
          </div>
          <p className="text-sm text-[#52b788] leading-relaxed">Connecting surplus food with people who need it most. Zero waste, maximum impact.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-[#52b788]">Platform</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link to="/browse" className="hover:text-white transition-colors">Browse Listings</Link></li>
            <li><Link to="/donor" className="hover:text-white transition-colors">Donor Dashboard</Link></li>
            <li><Link to="/recipient" className="hover:text-white transition-colors">NGO Dashboard</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Our Impact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-[#52b788]">Get Involved</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link to="/auth?mode=signup" className="hover:text-white transition-colors">Register as Donor</Link></li>
            <li><Link to="/auth?mode=signup" className="hover:text-white transition-colors">Register as NGO</Link></li>
            <li><Link to="/auth?mode=signup" className="hover:text-white transition-colors">Volunteer</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#2d6a4f] py-4 text-center text-xs text-[#52b788] flex items-center justify-center gap-1">
        Made with <Heart size={12} className="text-[#f4845f]" fill="#f4845f" /> to fight food waste · FoodRescue {new Date().getFullYear()}
      </div>
    </footer>
  );
}
