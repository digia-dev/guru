import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useImpersonation } from '../../context/ImpersonationContext';
import apiClient from '../../api/client';
import { AdminDashboardData } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dashboardRes, usersRes] = await Promise.all([
          apiClient.get('/admin/dashboard'),
          apiClient.get('/admin/users'),
        ]);
        if (dashboardRes.data.success) setData(dashboardRes.data.data);
        if (usersRes.data.success) {
          const dashboardTeachers = dashboardRes.data.data?.teachers || [];
          const studentCountMap: Record<number, number> = {};
          for (const t of dashboardTeachers) studentCountMap[t.id] = t.student_count ?? 0;
          setTeachers(
            usersRes.data.data
              .filter((u: any) => u.role === 'guru')
              .map((u: any) => ({ id: u.id, name: u.name, email: u.email, student_count: studentCountMap[u.id] ?? 0 }))
          );
        } else if (dashboardRes.data.data?.teachers) {
          setTeachers(dashboardRes.data.data.teachers);
        }
      } catch (err: any) {
        setFetchError(err.response?.data?.error || err.message || 'Gagal memuat data');
        console.error('Admin dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-12 w-1/2 rounded-xl mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const guruCount = data?.total_gurus ?? data?.teachers?.length ?? 0;

  const statCards = [
    { label: 'Pengguna', value: data?.total_users?.toString() || '0', icon: 'fa-user-cog', gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Guru', value: guruCount.toString(), icon: 'fa-chalkboard-user', gradient: 'from-blue-400 to-cyan-500' },
    { label: 'Siswa', value: data?.total_students?.toString() || '0', icon: 'fa-users', gradient: 'from-emerald-400 to-green-500' },
    { label: 'Kelas', value: data?.total_classes?.toString() || '0', icon: 'fa-school', gradient: 'from-orange-400 to-amber-500' },
    { label: 'Hadir', value: data?.hadir_hari_ini?.toString() || '0', icon: 'fa-check-circle', gradient: 'from-blue-400 to-cyan-500' },
    { label: 'Tabungan', value: `Rp ${(data?.total_tabungan || 0).toLocaleString('id-ID')}`, icon: 'fa-piggy-bank', gradient: 'from-pink-400 to-rose-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-2">
        <h1 className="page-title">Panel Admin</h1>
        <p className="text-text-secondary mt-1">Selamat datang, {user?.name || 'Admin'}! Kelola seluruh data aplikasi.</p>
      </div>

      {fetchError && <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm">{fetchError} — <button onClick={() => window.location.reload()} className="underline font-medium">Muat ulang</button></div>}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-black/[0.06] p-3 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
              <i className={`fas ${card.icon} text-white text-xs`}></i>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-text-tertiary font-medium truncate">{card.label}</p>
              <p className="text-sm font-bold truncate">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Guru Terdaftar</h2>
              <p className="text-xs text-text-tertiary mt-0.5">{guruCount} guru</p>
            </div>
            <button onClick={() => navigate('/app/admin/users')} className="text-xs text-primary font-medium hover:underline">Kelola <i className="fas fa-arrow-right ml-1"></i></button>
          </div>
          <div className="space-y-1.5">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-secondary">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {teacher.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{teacher.name}</p>
                    <p className="text-[10px] text-text-tertiary truncate">{teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="hidden sm:inline text-[10px] font-medium text-text-secondary whitespace-nowrap">{teacher.student_count ?? 0} Siswa</span>
                  <button onClick={() => navigate(`/app/admin/users`)} className="w-7 h-7 rounded-lg bg-soft-purple text-primary hover:bg-purple-200 flex items-center justify-center transition-colors"><i className="fas fa-pen text-[10px]"></i></button>
                  <button onClick={() => setDeleteTarget(teacher)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"><i className="fas fa-trash-alt text-[10px]"></i></button>
                  <DashboardButton teacherId={teacher.id} teacherName={teacher.name} />
                </div>
              </div>
            ))}
            {teachers.length === 0 && (
              <p className="text-sm text-text-tertiary text-center py-4">Belum ada guru terdaftar</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Aktivitas Terbaru</h2>
              <p className="text-xs text-text-tertiary mt-0.5">20 aktivitas terakhir</p>
            </div>
            <button onClick={() => navigate('/app/admin/logs')} className="text-xs text-primary font-medium hover:underline">Lihat semua <i className="fas fa-arrow-right ml-1"></i></button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {data?.recent_logs?.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-secondary text-xs">
                <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-[10px] font-bold">
                  {log.user_name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{log.user_name}</p>
                  <p className="text-text-tertiary mt-0.5">
                    {log.action} {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
            {(!data?.recent_logs || data.recent_logs.length === 0) && (
              <p className="text-sm text-text-tertiary text-center py-4">Belum ada aktivitas</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button onClick={() => navigate('/app/admin/users')} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all text-left">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow flex-shrink-0">
            <i className="fas fa-users-gear text-white text-sm"></i>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold">Kelola Pengguna</p>
            <p className="text-[10px] text-text-tertiary truncate">Atur akun guru</p>
          </div>
        </button>
        <button onClick={() => navigate('/app/admin/academic-years')} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all text-left">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow flex-shrink-0">
            <i className="fas fa-calendar-plus text-white text-sm"></i>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold">Tahun Ajaran</p>
            <p className="text-[10px] text-text-tertiary truncate">Atur semester</p>
          </div>
        </button>
        <button onClick={() => navigate('/app/admin/subjects')} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all text-left">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow flex-shrink-0">
            <i className="fas fa-book text-white text-sm"></i>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold">Mata Pelajaran</p>
            <p className="text-[10px] text-text-tertiary truncate">Atur daftar pelajaran</p>
          </div>
        </button>
      </div>

      <Modal open={!!deleteTarget} onClose={() => { if (!deleting) setDeleteTarget(null); }} title="Hapus Guru">
        <p className="text-sm text-text-secondary mb-1">Yakin ingin menghapus guru berikut?</p>
        <p className="font-semibold">{deleteTarget?.name}</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</Button>
          <Button variant="danger" onClick={async () => { if (!deleteTarget) return; setDeleting(true); try { await apiClient.delete(`/admin/users/${deleteTarget.id}`); setTeachers(prev => prev.filter(t => t.id !== deleteTarget.id)); setData(prev => prev ? { ...prev, total_gurus: prev.total_gurus - 1 } : prev); setDeleteTarget(null); toast.success('Guru dihapus'); } catch { toast.error('Gagal menghapus guru'); } finally { setDeleting(false); } }} disabled={deleting}>{deleting ? 'Menghapus...' : 'Hapus'}</Button>
        </div>
      </Modal>
    </div>
  );
}

interface TeacherItem {
  id: number;
  name: string;
  email: string;
  student_count: number;
}

function DashboardButton({ teacherId, teacherName }: { teacherId: number; teacherName: string }) {
  const { startImpersonating } = useImpersonation();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => { startImpersonating(teacherId, teacherName); navigate('/app'); }}
      className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 flex items-center justify-center transition-colors"
      title="Dashboard"
    >
      <i className="fas fa-eye text-[10px]"></i>
    </button>
  );
}
