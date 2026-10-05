import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardFor } from '../../utils/roles';
import { useNotifications } from '../../hooks/useNotifications';
import Button from '../ui/Button';
import LanguageSwitcher from './LanguageSwitcher';
import BrandLogo from '../brand/BrandLogo';

const NAV_LINKS = [
  { label: 'nav.browse', to: '/browse' },
  { label: 'nav.map', to: '/map' },
  { label: 'nav.about', to: '/about' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setOpen(false), [location]);

  const dashboardPath = dashboardFor(user?.role);

  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between" aria-label="Main navigation">
        <BrandLogo size="md" />

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <LanguageSwitcher />
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} className={`text-sm font-medium transition-colors hover:text-[#2d6a4f] ${location.pathname === l.to ? 'text-[#2d6a4f]' : 'text-[#6b7280]'}`}>
              {t(l.label)}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/notifications" aria-label="Notifications" className="relative text-[#6b7280] hover:text-[#2d6a4f] transition-colors">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#f4845f] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to={dashboardPath} className="text-sm font-medium text-[#6b7280] hover:text-[#2d6a4f] transition-colors">{t('nav.dashboard')}</Link>
              <div className="w-8 h-8 rounded-full bg-[#d8f3dc] text-[#2d6a4f] text-xs font-bold flex items-center justify-center">
                {(user.name || '?').charAt(0).toUpperCase()}
              </div>
              <button onClick={() => logout().then(() => navigate('/'))} className="text-sm text-[#6b7280] hover:text-red-500 transition-colors">{t('nav.signOut')}</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>{t('nav.signIn')}</Button>
              <Button size="sm" onClick={() => navigate('/auth?mode=signup')}>{t('nav.getStarted')}</Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              <LanguageSwitcher />
              {NAV_LINKS.map(l => (
                <Link key={l.to} to={l.to} className="text-sm font-medium text-[#1c1c1e]">{t(l.label)}</Link>
              ))}
              {user ? (
                <>
                  <Link to={dashboardPath} className="text-sm font-medium text-[#1c1c1e]">{t('nav.dashboard')}</Link>
                  <button onClick={() => logout().then(() => navigate('/'))} className="text-sm text-red-500 text-left">{t('nav.signOut')}</button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>{t('nav.signIn')}</Button>
                  <Button size="sm" onClick={() => navigate('/auth?mode=signup')}>{t('nav.getStarted')}</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
