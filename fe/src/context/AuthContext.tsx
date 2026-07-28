import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import apiClient, { setTokens, clearTokens, getStoredRefreshToken, setOnLogout } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiClient.get('/auth/me');
      if (me.data.success) setUser(me.data.data);
    } catch { }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = getStoredRefreshToken();
      if (token) await apiClient.post('/auth/logout', { refreshToken: token });
    } catch { }
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    setOnLogout(() => { setUser(null); clearTokens(); });
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredRefreshToken();
      if (!token) { setIsLoading(false); return; }
      try {
        const { data } = await apiClient.post('/auth/refresh', { refreshToken: token });
        if (data.success) {
          setTokens(data.data.accessToken, data.data.refreshToken);
          const me = await apiClient.get('/auth/me');
          setUser(me.data.data);
        }
      } catch {
        clearTokens();
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    if (!data.success) throw new Error(data.error);
    setTokens(data.data.accessToken, data.data.refreshToken);
    setUser(data.data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const { data } = await apiClient.post('/auth/register', { email, password, name });
    if (!data.success) throw new Error(data.error);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) return <Navigate to="/app" state={{ from: location }} replace />;
  return <>{children}</>;
}
