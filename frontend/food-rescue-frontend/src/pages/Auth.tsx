import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Heart } from 'lucide-react';
import Button from '../components/ui/Button';
import BrandLogo from '../components/brand/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { dashboardFor } from '../utils/roles';

type Mode = 'signin' | 'signup';
type PlatformRole = 'donor' | 'ngo';

const ROLES: { role: PlatformRole; label: string; desc: string; icon: React.ElementType; active: string }[] = [
  { role: 'donor', label: 'Donor',     desc: 'Restaurant, store, or event organizer with surplus food', icon: Store, active: 'border-[#2d6a4f] bg-[#d8f3dc] text-[#2d6a4f]' },
  { role: 'ngo',   label: 'NGO / Charity', desc: 'Organization that collects and distributes food',      icon: Heart, active: 'border-[#f4845f] bg-[#fde8df] text-[#c0522a]' },
];

export default function Auth() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { register, login, user } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [role, setRole] = useState<PlatformRole>((params.get('role') as PlatformRole) || 'donor');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect already-logged-in users
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname;
      navigate(from || dashboardFor(user.role), { replace: true });
    }
  }, [user, navigate, location]);

  useEffect(() => {
    setMode(params.get('mode') === 'signup' ? 'signup' : 'signin');
    if (params.get('role')) setRole(params.get('role') as PlatformRole);
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await register({ name, email, password, role, organization: org || undefined });
        toast(`Welcome, ${name}! Your account has been created.`, 'success');
      } else {
        await login({ email, password });
        toast('Welcome back!', 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] to-[#fafaf7] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8"
      >
        <div className="mb-8 flex items-center justify-between">
          <BrandLogo size="lg" />
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m ? 'bg-white shadow text-[#1c1c1e]' : 'text-[#6b7280]'}`}>
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form key={mode}
            initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-medium text-[#6b7280] mb-1.5 block">
                {mode === 'signup' ? 'I am a...' : 'Sign in as'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r.role} type="button" onClick={() => setRole(r.role)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${role === r.role ? r.active : 'border-gray-200 text-[#6b7280] hover:border-gray-300'}`}>
                    <r.icon size={20} />
                    <span className="text-xs font-semibold">{r.label}</span>
                  </button>
                ))}
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-[#6b7280] mt-2">{ROLES.find(r => r.role === role)?.desc}</p>
              )}
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block" htmlFor="name">Full Name</label>
                  <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block" htmlFor="org">
                    Organization <span className="text-gray-400">(optional)</span>
                  </label>
                  <input id="org" type="text" value={org} onChange={e => setOrg(e.target.value)}
                    placeholder="Restaurant / NGO / etc."
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-[#6b7280] mb-1 block" htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
            </div>

            <div>
              <label className="text-xs font-medium text-[#6b7280] mb-1 block" htmlFor="password">Password</label>
              <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                minLength={mode === 'signup' ? 8 : undefined}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
