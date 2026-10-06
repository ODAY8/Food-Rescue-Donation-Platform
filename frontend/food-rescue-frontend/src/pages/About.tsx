import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Globe, Award, TrendingUp } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import StatCounter from '../components/shared/StatCounter';
import Button from '../components/ui/Button';
import { useApi } from '../hooks/useApi';
import { BASE_URL } from '../services/apiClient';

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className={className}>
      {children}
    </motion.div>
  );
}

const TEAM = [
  { name: 'Priya Nair', role: 'Co-Founder & CEO', avatar: 'PN', bio: 'Former food bank director with 12 years in hunger relief.' },
  { name: 'Carlos Mendez', role: 'Co-Founder & CTO', avatar: 'CM', bio: 'Built logistics platforms for 3 NGOs across Latin America.' },
  { name: 'Fatima Al-Hassan', role: 'Head of Partnerships', avatar: 'FA', bio: 'Connects donors and NGOs across 47 cities.' },
];

const VALUES = [
  { icon: Leaf, title: 'Zero Waste', desc: 'Every meal rescued is a step toward a sustainable food system.' },
  { icon: Globe, title: 'Community First', desc: 'We build tools that empower local communities to solve local problems.' },
  { icon: Award, title: 'Radical Transparency', desc: 'Every donation, every pickup, every meal — tracked and reported openly.' },
  { icon: TrendingUp, title: 'Measurable Impact', desc: 'We obsess over outcomes, not outputs. Real meals, real people.' },
];

export default function About() {
  const navigate = useNavigate();

  const { data: statsRes } = useApi(async () => {
    const res = await fetch(`${BASE_URL}/analytics/public`);
    return res.json();
  }, []);
  const stats = statsRes?.data;

  const statItems = [
    { end: stats?.total_servings ?? 0, label: 'Meals Shared' },
    { end: stats?.total_listings ?? 0, label: 'Food Listings' },
    { end: stats?.completed_donations ?? 0, label: 'Donations Completed' },
    { end: stats?.total_users ?? 0, label: 'Community Members' },
  ];

  return (
    <PageWrapper>
      <section className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block bg-[#40916c] text-[#d8f3dc] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">Our Story</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              We started because<br />
              <span className="text-[#f4845f]">40% of food is wasted</span><br />
              while 1 in 9 people go hungry.
            </h1>
            <p className="text-[#d8f3dc] text-lg max-w-2xl mx-auto leading-relaxed">
              FoodRescue was born in 2021 when our founders watched a restaurant throw away 80 meals while a shelter two blocks away turned people away. We built the bridge.
            </p>
          </motion.div>
        </div>
      </section>

      <RevealSection>
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center text-[#1c1c1e] mb-10">Our Impact by the Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {statItems.map(s => (
                <StatCounter key={s.label} end={s.end} label={s.label} />
              ))}
            </div>
            <p className="text-xs text-[#6b7280] text-center mt-6">Live metrics calculated from platform data.</p>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="bg-[#f0fdf4] py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-[#1c1c1e] text-center mb-10">What We Stand For</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((v, i) => (
                <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="w-10 h-10 bg-[#d8f3dc] rounded-xl flex items-center justify-center mb-4">
                    <v.icon size={20} className="text-[#2d6a4f]" />
                  </div>
                  <h3 className="font-semibold text-[#1c1c1e] mb-2">{v.title}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-[#1c1c1e] text-center mb-10">The Team</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {TEAM.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 rounded-full bg-[#d8f3dc] text-[#2d6a4f] text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {member.avatar}
                </div>
                <div className="font-semibold text-[#1c1c1e]">{member.name}</div>
                <div className="text-xs text-[#f4845f] font-medium mb-2">{member.role}</div>
                <p className="text-sm text-[#6b7280]">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="bg-gradient-to-r from-[#f4845f] to-[#f9a07a] rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Be part of the solution</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">Whether you have food to give or communities to feed — there's a place for you here.</p>
            <Button size="lg" className="bg-white text-[#c0522a] hover:bg-orange-50" onClick={() => navigate('/auth?mode=signup')}>
              Join FoodRescue Today
            </Button>
          </div>
        </section>
      </RevealSection>
    </PageWrapper>
  );
}
