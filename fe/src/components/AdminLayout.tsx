import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopHeader from './TopHeader';

export default function AdminLayout() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen flex bg-surface-secondary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-8 xl:px-10 py-6 md:py-8 pb-16 lg:pb-8">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
