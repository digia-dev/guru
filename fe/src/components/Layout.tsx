import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopHeader from './TopHeader';
import TimerBar from './TimerBar';

export default function Layout() {
  const { user } = useAuth();
  const { viewingAs } = useImpersonation();
  const isAdmin = !viewingAs && user?.role === 'admin';
  const navItems = isAdmin ? 4 : 4;
  const bottomNavH = isAdmin ? 'pb-16' : 'pb-28';

  return (
    <div className="min-h-screen flex bg-surface-secondary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TimerBar />
        <TopHeader />
        <main className="flex-1 overflow-auto">
          <div className={`max-w-[1600px] mx-auto px-4 md:px-8 lg:px-8 xl:px-10 py-6 md:py-8 ${bottomNavH} lg:pb-8`}>
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
