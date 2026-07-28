import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAsTeacher, getAsTeacher } from '../api/client';
import { useAuth } from './AuthContext';

interface ImpersonationContextType {
  viewingAs: { teacherId: number; teacherName: string } | null;
  remainingSeconds: number;
  startImpersonating: (teacherId: number, teacherName: string) => void;
  stopImpersonating: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

const DURATION_SECONDS = 10 * 60;

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [viewingAs, setViewingAs] = useState<{ teacherId: number; teacherName: string } | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(DURATION_SECONDS);
  const endTimeRef = useRef<number>(0);
  const intervalRef = useRef<number>(0);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const stopImpersonating = useCallback(() => {
    setViewingAs(null);
    setRemainingSeconds(DURATION_SECONDS);
    setAsTeacher(null);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = 0; }
    refreshUser();
  }, [refreshUser]);

  const startImpersonating = useCallback((teacherId: number, teacherName: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setViewingAs({ teacherId, teacherName });
    setRemainingSeconds(DURATION_SECONDS);
    setAsTeacher(teacherId);
    endTimeRef.current = Date.now() + DURATION_SECONDS * 1000;
    intervalRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = 0;
        stopImpersonating();
        navigate('/app/admin/dashboard');
      }
    }, 1000);
    refreshUser();
  }, [stopImpersonating, navigate, refreshUser]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <ImpersonationContext.Provider value={{ viewingAs, remainingSeconds, startImpersonating, stopImpersonating }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) throw new Error('useImpersonation must be used within ImpersonationProvider');
  return ctx;
}
