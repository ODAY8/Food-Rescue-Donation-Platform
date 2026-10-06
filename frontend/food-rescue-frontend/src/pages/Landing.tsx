import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, ShoppingBag, Heart, QrCode } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Button from '../components/ui/Button';
import StatCounter from '../components/shared/StatCounter';
import FoodCard from '../components/shared/FoodCard';
import { useApi } from '../hooks/useApi';
import { foodApi, type FoodItem } from '../services/foodApi';

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const HOW_IT_WORKS = [
  { icon: ShoppingBag, title: 'Donors Post Surplus', desc: 'Restaurants, stores, and event organizers list surplus food with pickup details in under 2 minutes.' },
  { icon: Heart, title: 'NGOs Claim Listings', desc: 'Shelters and food banks browse available food and claim what they need with one click.' },
  { icon: QrCode, title: 'Direct NGO Pickup', desc: 'Claiming NGOs collect food directly from donors at the scheduled time, verifying handover with instant QR code scan.' },
];

export default function Landing() {
  const navigate = useNavigate();

  const { data: foodsRes, loading: foodsLoading } = useApi(() => foodApi.getAll({ status: 'AVAILABLE', limit: 3 }), []);
  const { data: statsRes } = useApi(async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/analytics/public`);
    return res.json();
  }, []);

  const listings: FoodItem[] = foodsRes?.data?.data ?? [];
  const stats = statsRes?.data;

  const statItems = [
    { end: stats?.total_servings ?? 0, label: 'Meals Shared' },
    { end: stats?.total_listings ?? 0, label: 'Active Listings' },
    { end: stats?.completed_donations ?? 0, label: 'Donations Completed' },
    { end: stats?.total_users ?? 0, label: 'Community Members' },
  ];

  return (
    <PageWrapper>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#f0fdf4] via-[#fafaf7] to-[#fde8df]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                background: i % 2 === 0 ? '#52b788' : '#f4845f',
                top: `${10 + i * 12}%`,
                left: `${60 + (i % 3) * 12}%`,
              }}
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 bg-[#d8f3dc] text-[#2d6a4f] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Leaf size={13} /> Fighting food waste, one meal at a time
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-[#1c1c1e] leading-tight mb-6">
                Rescue Food.<br />
                <span className="text-[#2d6a4f]">Feed People.</span><br />
                <span className="text-[#f4845f]">Save the Planet.</span>
              </h1>
              <p className="text-lg text-[#6b7280] mb-8 leading-relaxed max-w-md">
                We connect restaurants, grocery stores, and event organizers who have surplus food directly with verified NGOs and shelters who collect and distribute it.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate('/auth?mode=signup&role=donor')}>
                  Donate Surplus Food <ArrowRight size={18} />
                </Button>
                <Button variant="ghost" size="lg" onClick={() => navigate('/browse')}>
                  Browse Available Food
                </Button>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden md:block"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700&q=80"
                alt="Fresh food ready for donation"
                className="rounded-3xl shadow-2xl w-full object-cover h-[480px]"
              />
              <motion.div
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="w-10 h-10 bg-[#d8f3dc] rounded-xl flex items-center justify-center">
                  <Leaf size={20} className="text-[#2d6a4f]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1c1c1e]">{stats?.total_servings?.toLocaleString() ?? '0'} meals</div>
                  <div className="text-xs text-[#6b7280]">shared through the platform</div>
                </div>
              </motion.div>
              <motion.div
                className="absolute -top-4 -right-4 bg-[#f4845f] text-white rounded-2xl shadow-xl p-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="text-2xl font-bold">{stats?.completed_donations ?? 0}</div>
                <div className="text-xs opacity-90">donations completed</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <RevealSection>
        <section className="bg-white border-y border-gray-100 py-12">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {statItems.map(s => (
              <StatCounter key={s.label} end={s.end} label={s.label} />
            ))}
          </div>
        </section>
      </RevealSection>

      {/* How it works */}
      <RevealSection>
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1c1c1e] mb-3">How It Works</h2>
            <p className="text-[#6b7280] max-w-md mx-auto">Three simple steps to turn surplus into sustenance.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center p-6 rounded-2xl bg-[#f0fdf4] hover:bg-[#d8f3dc] transition-colors"
              >
                <div className="w-14 h-14 bg-[#2d6a4f] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <step.icon size={26} className="text-white" />
                </div>
                <div className="text-xs font-bold text-[#f4845f] mb-2">STEP {i + 1}</div>
                <h3 className="font-semibold text-[#1c1c1e] mb-2">{step.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* Live listings preview */}
      <RevealSection>
        <section className="bg-[#fafaf7] py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#1c1c1e] mb-1">Available Right Now</h2>
                <p className="text-[#6b7280] text-sm">Fresh listings from donors near you</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/browse')}>
                View all <ArrowRight size={16} />
              </Button>
            </div>
            {foodsLoading ? (
              <div className="text-sm text-[#6b7280] py-12 text-center">Loading fresh listings...</div>
            ) : listings.length === 0 ? (
              <div className="text-sm text-[#6b7280] py-12 text-center">No available food right now — check back soon.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(food => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>
            )}
          </div>
        </section>
      </RevealSection>

      {/* CTA */}
      <RevealSection>
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="bg-gradient-to-r from-[#2d6a4f] to-[#40916c] rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to make a difference?</h2>
            <p className="text-[#d8f3dc] mb-8 max-w-md mx-auto">
              Join {stats?.total_users ?? 0} donors and NGOs already using FoodRescue to fight hunger and food waste.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="secondary" size="lg" onClick={() => navigate('/auth?mode=signup&role=donor')}>
                I have food to donate
              </Button>
              <Button size="lg" className="bg-white text-[#2d6a4f] hover:bg-[#d8f3dc]" onClick={() => navigate('/auth?mode=signup&role=ngo')}>
                I need food for my NGO
              </Button>
            </div>
          </div>
        </section>
      </RevealSection>
    </PageWrapper>
  );
}
