import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';

const guruLinks = [
  { page: 'dashboard', icon: 'fa-grid-2', label: 'Beranda', path: '/app' },
  { page: 'absensi', icon: 'fa-user-check', label: 'Absensi', path: '/app/absensi' },
  { page: 'nilai', icon: 'fa-star', label: 'Penilaian', path: '/app/nilai' },
  { page: 'penilaian-semester', icon: 'fa-chart-line', label: 'Nilai Semester', path: '/app/penilaian-semester' },
  { page: 'analisis-nilai', icon: 'fa-chart-simple', label: 'Analisis', path: '/app/analisis-nilai' },
  { page: 'agenda', icon: 'fa-calendar-day', label: 'Agenda', path: '/app/agenda' },
  { page: 'data', icon: 'fa-users', label: 'Siswa', path: '/app/data' },
  { page: 'kalender', icon: 'fa-calendar-alt', label: 'Kalender', path: '/app/kalender' },
  { page: 'settings', icon: 'fa-gear', label: 'Pengaturan', path: '/app/settings' },
];

const adminLinks = [
  { page: 'admin-dashboard', icon: 'fa-gauge-high', label: 'Panel Admin', path: '/app/admin/dashboard' },
  { page: 'admin-users', icon: 'fa-users-gear', label: 'Pengguna', path: '/app/admin/users' },
  { page: 'admin-academic-years', icon: 'fa-calendar-plus', label: 'Tahun Ajaran', path: '/app/admin/academic-years' },
  { page: 'admin-subjects', icon: 'fa-book', label: 'Pelajaran', path: '/app/admin/subjects' },
  { page: 'admin-logs', icon: 'fa-terminal', label: 'Aktivitas', path: '/app/admin/logs' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { viewingAs } = useImpersonation();
  const location = useLocation();
  const currentPage = location.pathname === '/app' ? 'dashboard' : location.pathname.replace(/^\/app\//, '');
  const showGuruView = viewingAs !== null || user?.role !== 'admin';
  const links = showGuruView ? guruLinks : adminLinks;
  const navigate = useNavigate();

  return (
    <aside className="w-[240px] flex-shrink-0 flex-col bg-white border-r border-black/[0.06] hidden lg:flex sticky top-0 h-screen">
      <div className="px-5 pt-7 pb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <i className="fas fa-flask text-white text-lg"></i>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">AppGuru</h1>
          <p className="text-[11px] text-text-tertiary font-medium tracking-wide">{user?.role === 'admin' && !viewingAs ? 'Administrator' : 'Manajemen Guru'}</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-3 mt-4 overflow-y-auto">
        {links.map((link) => {
          const isActive = currentPage === link.page || currentPage.startsWith(link.page + '/');
          return (
            <Link
              key={link.page}
              to={link.path}
              className={clsx(
                'sidebar-link',
                isActive ? 'active' : 'inactive'
              )}
            >
              <i className={clsx('fas w-5 text-center text-base', link.icon)}></i>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-6 mt-auto">
        <button
          onClick={() => navigate('/app/profile')}
          className="flex items-center gap-3 p-3 rounded-2xl bg-surface-secondary hover:bg-surface-tertiary transition-colors w-full text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0) || 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name || 'Guru'}</p>
            <p className="text-[11px] text-text-tertiary truncate">{viewingAs ? `Melihat ${viewingAs.teacherName}` : user?.role === 'admin' ? 'Admin' : 'Guru'}</p>
          </div>
          <i className="fas fa-chevron-right text-text-tertiary text-xs"></i>
        </button>
      </div>
    </aside>
  );
}
