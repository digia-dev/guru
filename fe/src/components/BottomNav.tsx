import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
import clsx from 'clsx';

const guruItems = [
  { page: 'dashboard', icon: 'fa-home', label: 'Beranda', path: '/app' },
  { page: 'absensi', icon: 'fa-user-check', label: 'Absensi', path: '/app/absensi' },
  { page: 'agenda', icon: 'fa-calendar-day', label: 'Agenda', path: '/app/agenda' },
  { page: 'nilai', icon: 'fa-star', label: 'Nilai', path: '/app/nilai' },
];

const adminItems = [
  { page: 'admin-dashboard', icon: 'fa-gauge-high', label: 'Dashboard', path: '/app/admin/dashboard' },
  { page: 'admin-users', icon: 'fa-users-gear', label: 'Pengguna', path: '/app/admin/users' },
  { page: 'admin-academic-years', icon: 'fa-calendar-plus', label: 'Tahun Ajaran', path: '/app/admin/academic-years' },
  { page: 'admin-subjects', icon: 'fa-book', label: 'Pelajaran', path: '/app/admin/subjects' },
];

const guruActions = [
  { icon: 'fa-user-check', label: 'Tambah Absensi', path: '/app/absensi' },
  { icon: 'fa-calendar-plus', label: 'Tambah Agenda', path: '/app/agenda' },
  { icon: 'fa-star', label: 'Input Nilai', path: '/app/nilai' },
  { icon: 'fa-user-plus', label: 'Tambah Siswa', path: '/app/data' },
];

const adminActions = [
  { icon: 'fa-user-plus', label: 'Tambah Guru', path: '/app/admin/users' },
  { icon: 'fa-calendar-plus', label: 'Tahun Ajaran', path: '/app/admin/academic-years' },
  { icon: 'fa-book', label: 'Mata Pelajaran', path: '/app/admin/subjects' },
  { icon: 'fa-terminal', label: 'Aktivitas', path: '/app/admin/logs' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const { viewingAs } = useImpersonation();
  const navigate = useNavigate();
  const location = useLocation();
  const [actionOpen, setActionOpen] = useState(false);

  const isAdmin = !viewingAs && user?.role === 'admin';
  const items = isAdmin ? adminItems : guruItems;
  const actions = isAdmin ? adminActions : guruActions;

  const currentPage = location.pathname === '/app' ? 'dashboard' : location.pathname.replace('/app/', '');

  return (
    <>
      <div className={clsx(
        'fixed inset-0 z-40 lg:hidden transition-all duration-300 ease-out',
        actionOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
      )} onClick={() => setActionOpen(false)}>
        <div className={clsx(
          'absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-out',
          actionOpen ? 'opacity-100' : 'opacity-0'
        )} />
        <div className={clsx(
          'absolute bottom-20 left-4 right-4 bg-white rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 ease-out',
          actionOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        )}>
          <div className="p-2">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => { navigate(action.path); setActionOpen(false); }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-surface-secondary transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-soft-purple flex items-center justify-center">
                  <i className={`fas ${action.icon} text-primary`}></i>
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-black/[0.06] z-30 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2 relative">
          {items.slice(0, 2).map((item) => (
            <button
              key={item.page}
              onClick={() => navigate(item.path)}
              className={clsx('bottom-nav-item gap-0.5', currentPage === item.page && 'active')}
            >
              <i className={clsx('fas text-xl', item.icon)}></i>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </button>
          ))}

          <div className="relative -mt-6">
            <button
              onClick={() => setActionOpen(!actionOpen)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center active:scale-95 transition-transform"
            >
              <i className={clsx('fas text-xl transition-transform duration-200', actionOpen ? 'fa-times' : 'fa-plus')}></i>
            </button>
          </div>

          {items.slice(2).map((item) => (
            <button
              key={item.page}
              onClick={() => navigate(item.path)}
              className={clsx('bottom-nav-item gap-0.5', currentPage === item.page && 'active')}
            >
              <i className={clsx('fas text-xl', item.icon)}></i>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
