import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import clsx from 'clsx';

export default function TopHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const menuLinks = isAdmin ? [
    { page: 'admin-dashboard', icon: 'fa-gauge-high', label: 'Panel Admin', path: '/app/admin/dashboard' },
    { page: 'admin-users', icon: 'fa-users-gear', label: 'Pengguna', path: '/app/admin/users' },
    { page: 'admin-academic-years', icon: 'fa-calendar-plus', label: 'Tahun Ajaran', path: '/app/admin/academic-years' },
    { page: 'admin-subjects', icon: 'fa-book', label: 'Pelajaran', path: '/app/admin/subjects' },
    { page: 'admin-logs', icon: 'fa-terminal', label: 'Aktivitas', path: '/app/admin/logs' },
    { page: 'settings', icon: 'fa-gear', label: 'Pengaturan', path: '/app/settings' },
    { page: 'profile', icon: 'fa-user', label: 'Profil', path: '/app/profile' },
  ] : [
    { page: 'analisis-nilai', icon: 'fa-chart-simple', label: 'Analisis Nilai', path: '/app/analisis-nilai' },
    { page: 'data', icon: 'fa-users', label: 'Siswa', path: '/app/data' },
    { page: 'kalender', icon: 'fa-calendar-alt', label: 'Kalender', path: '/app/kalender' },
    { page: 'penilaian-semester', icon: 'fa-chart-line', label: 'Nilai Semester', path: '/app/penilaian-semester' },
    { page: 'settings', icon: 'fa-gear', label: 'Pengaturan', path: '/app/settings' },
    { page: 'profile', icon: 'fa-user', label: 'Profil', path: '/app/profile' },
  ];

  const currentPage = location.pathname.replace('/app/', '');

  return (
    <>
      {/* Mobile header */}
      <header className="bg-white/75 backdrop-blur-xl border-b border-white/60 sticky top-0 z-20 lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="w-9 h-9 rounded-xl hover:bg-black/5 flex items-center justify-center -ml-1">
              <i className="fas fa-bars text-lg text-text-primary"></i>
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <i className="fas fa-flask text-white text-xs"></i>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">AppGuru</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="w-9 h-9 rounded-xl hover:bg-black/5 flex items-center justify-center">
              <i className="fas fa-search text-lg text-text-primary"></i>
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <div className={clsx(
        'fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-out',
        menuOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
      )}>
        <div
          className={clsx(
            'absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-out',
            menuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMenuOpen(false)}
        />
        <div className={clsx(
          'fixed top-0 left-0 bottom-0 w-72 bg-white shadow-2xl transition-transform duration-300',
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <i className="fas fa-flask text-white text-xs"></i>
              </div>
              <span className="font-bold">Menu</span>
            </div>
            <button onClick={() => setMenuOpen(false)} className="w-9 h-9 rounded-xl hover:bg-black/5 flex items-center justify-center">
              <i className="fas fa-times text-text-secondary"></i>
            </button>
          </div>
          <div className="p-4 space-y-1">
            {menuLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => { navigate(link.path); setMenuOpen(false); }}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors text-left',
                  currentPage === link.page ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/20' : 'text-text-secondary hover:bg-surface-secondary'
                )}
              >
                <i className={clsx('fas w-5 text-center', link.icon)}></i>
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <header className="glass sticky top-0 z-20 hidden lg:flex h-[72px] items-center px-8">
        <div className="flex items-center justify-center flex-1 max-w-lg mx-auto">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 bg-surface-secondary hover:bg-surface-tertiary transition-colors rounded-2xl px-4 py-2.5 w-full text-left"
          >
            <i className="fas fa-search text-text-tertiary text-sm"></i>
            <span className="text-sm text-text-tertiary">Cari siswa, kelas, atau menu...</span>
            <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-white/50 border border-black/[0.06] text-[11px] text-text-tertiary font-medium">
              <i className="fab fa-apple"></i> K
            </div>
          </button>
        </div>
        <NotificationBell />
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
