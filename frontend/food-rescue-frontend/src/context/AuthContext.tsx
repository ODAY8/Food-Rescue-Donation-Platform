import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, tokenStorage, type AuthUser } from '../services/authApi';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  register: (data: { name: string; email: string; password: string; role: string; organization?: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // true on mount while we rehydrate

  // Rehydrate user from stored token on app load
  useEffect(() => {
    const rehydrate = async () => {
      const token = tokenStorage.get();
      if (!token) { setLoading(false); return; }
      try {
        const res = await authApi.getProfile();
        setUser({
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role as AuthUser['role'],
          platformRole: res.data.platform_role as AuthUser['platformRole'],
          organization: res.data.organization,
          phone: res.data.phone,
          address: res.data.address,
        });
      } catch {
        // Token invalid or expired — clear it
        tokenStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    rehydrate();
  }, []);

  const register = async (data: Parameters<AuthContextType['register']>[0]) => {
    const res = await authApi.register(data);
    tokenStorage.set(res.token);
    setUser(res.data);
  };

  const login = async (data: Parameters<AuthContextType['login']>[0]) => {
    const res = await authApi.login(data);
    tokenStorage.set(res.token);
    setUser(res.data);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    tokenStorage.clear();
    setUser(null);
  };

  const refreshUser = async () => {
    if (!tokenStorage.get()) return;
    const res = await authApi.getProfile();
    setUser({
      id: res.data.id,
      name: res.data.name,
      email: res.data.email,
      role: res.data.role as AuthUser['role'],
      platformRole: res.data.platform_role as AuthUser['platformRole'],
      organization: res.data.organization,
      phone: res.data.phone,
      address: res.data.address,
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
