import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import apiClient, { setTokens, clearTokens, setOnLogout } from '../api/client';
import { supabase } from '../lib/supabase';
import { User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ipvkqzpxstugemftmhem.supabase.co';

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const token = session.access_token;
      const res = await fetch(`${supabaseUrl}/functions/v1/auth`, {
        headers: { Authorization: `Bearer ${token}`, 'x-subpath': '/me' },
      });
      const fnData = await res.json();
      if (fnData?.success) setUser(fnData.data);
    } catch { }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    setOnLogout(() => { setUser(null); clearTokens(); });
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setTokens(session.access_token);
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/auth`, {
            headers: { Authorization: `Bearer ${session.access_token}`, 'x-subpath': '/me' },
          });
          const fnData = await res.json();
          if (fnData?.success) setUser(fnData.data);
        } catch { }
      }
      setIsLoading(false);
    };
    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setTokens(session.access_token);
        if (event === 'SIGNED_IN') {
          try {
            const res = await fetch(`${supabaseUrl}/functions/v1/auth`, {
              headers: { Authorization: `Bearer ${session.access_token}`, 'x-subpath': '/me' },
            });
            const fnData = await res.json();
            if (fnData?.success) setUser(fnData.data);
          } catch { }
        }
      } else {
        clearTokens();
        setUser(null);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data.session) {
      setTokens(data.session.access_token);
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/auth`, {
          headers: { Authorization: `Bearer ${data.session.access_token}`, 'x-subpath': '/me' },
        });
        const fnData = await res.json();
        if (fnData?.success) setUser(fnData.data);
      } catch { }
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch(`${supabaseUrl}/functions/v1/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-subpath': '/register' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!data?.success) throw new Error(data?.error || 'Registration failed');
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