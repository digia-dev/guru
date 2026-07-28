import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { DashboardStats, LearningActivity, CalendarEvent, AttendanceTrend } from '../types';
import { CardSkeleton } from '../components/ui/Skeleton';
import Card from '../components/ui/Card';
import { AttendanceChart } from '../components/charts';

const hours = new Date().getHours();
const greeting = hours < 10 ? 'Selamat Pagi' : hours < 15 ? 'Selamat Siang' : hours < 18 ? 'Selamat Sore' : 'Selamat Malam';

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const now = new Date();
const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

const classColors = ['bg-rose-100 text-rose-600', 'bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-purple-100 text-purple-600'];

const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface PerClassAttendance {
  name: string;
  hadir: number;
  total: number;
}

const today = now.toISOString().slice(0, 10);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => { const { data } = await apiClient.get('/dashboard/stats'); return data.data as DashboardStats; },
    refetchInterval: 60000,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', today],
    queryFn: async () => { const { data } = await apiClient.get(`/activities?start_date=${today}&end_date=${today}`); return (data.data || []) as LearningActivity[]; },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events', today],
    queryFn: async () => { const { data } = await apiClient.get(`/calendar-events?start_date=${today}&limit=5`); return (data.data || []) as CalendarEvent[]; },
  });

  const { data: trend = [] } = useQuery({
    queryKey: ['attendance-trend'],
    queryFn: async () => { const { data } = await apiClient.get('/attendance/trend'); return (data.data || []) as AttendanceTrend[]; },
  });

  const chartSeries = trend.length > 0
    ? [
        { name: 'Hadir', data: trend.map(d => d.H || 0), color: '#34C759' },
        { name: 'Sakit', data: trend.map(d => d.S || 0), color: '#FF9F0A' },
        { name: 'Izin', data: trend.map(d => d.I || 0), color: '#0A84FF' },
        { name: 'Alpha', data: trend.map(d => d.A || 0), color: '#FF453A' },
      ]
    : [];

  const chartCategories = trend.length > 0
    ? trend.map(d => { const dt = new Date(d.date); return dayLabels[dt.getDay()]; })
    : [];

  const statCards = [
    { label: 'Total Siswa', value: stats?.total_students?.toString() || '0', sub: `${stats?.active_classes || 0} Kelas`, icon: 'fa-users', gradient: 'from-violet-500 to-indigo-500' },
    { label: 'Kehadiran', value: stats?.hadir_hari_ini !== undefined ? `${Math.round((stats.hadir_hari_ini / (stats.total_students || 1)) * 100)}%` : '0%', sub: `${stats?.hadir_hari_ini || 0} hadir`, icon: 'fa-check-circle', gradient: 'from-emerald-400 to-green-500' },
    { label: 'Agenda', value: activities.length.toString(), sub: 'Hari ini', icon: 'fa-clipboard-list', gradient: 'from-orange-400 to-amber-500' },
    { label: 'Rata Nilai', value: '—', sub: 'Semua kelas', icon: 'fa-chart-line', gradient: 'from-blue-400 to-cyan-500' },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-12 w-1/2 rounded-xl mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-2">
        <h1 className="page-title">{greeting}, {user?.name || 'Guru'}! <span className="inline-block animate-float">👋</span></h1>
        <p className="text-text-secondary mt-1">Berikut ringkasan aktivitas mengajar hari ini.</p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm font-medium text-text-secondary">
            <i className="far fa-calendar mr-2"></i>{dateStr}
          </span>
          <span className="w-1 h-1 rounded-full bg-text-tertiary"></span>
          <span className="text-sm text-text-tertiary">Semester Ganjil 2026/2027</span>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white border-0 !shadow-[0_12px_40px_rgba(99,91,255,0.2)] relative overflow-hidden lg:hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <i className="fas fa-lightbulb text-yellow-300 text-sm"></i>
            </div>
            <span className="text-sm font-medium text-white/80">Kutipan Hari Ini</span>
          </div>
          <blockquote className="text-base font-medium leading-relaxed text-balance">
            "Pendidikan adalah senjata paling ampuh untuk mengubah dunia."
          </blockquote>
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">NM</div>
            <div>
              <p className="text-sm font-semibold">Nelson Mandela</p>
              <p className="text-xs text-white/60">Tokoh Dunia</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-black/[0.06] p-3 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
              <i className={`fas ${card.icon} text-white text-xs`}></i>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-text-tertiary font-medium truncate">{card.label}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-sm font-bold truncate">{card.value}</p>
                <span className="text-[9px] text-text-tertiary truncate">{card.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">Tren Kehadiran</h2>
              <p className="text-xs text-text-tertiary mt-0.5">7 Hari Terakhir</p>
            </div>
            {trend.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-xs text-text-secondary">Hadir</span>
              </div>
            )}
          </div>
          {trend.length > 0 ? (
            <AttendanceChart series={chartSeries} categories={chartCategories} />
          ) : (
            <div className="h-48 flex items-center justify-center text-text-tertiary">
              <div className="text-center">
                <i className="fas fa-chart-bar text-2xl mb-2"></i>
                <p className="text-sm">Data kehadiran belum tersedia</p>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">Agenda Hari Ini</h2>
              <p className="text-xs text-text-tertiary mt-0.5">{activities.length} kegiatan</p>
            </div>
            <button onClick={() => navigate('/app/agenda')} className="text-xs text-primary font-medium hover:underline">
              Lihat semua <i className="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
          <div className="space-y-0">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                <i className="fas fa-calendar-day text-2xl mb-2"></i>
                <p className="text-sm">Tidak ada agenda hari ini</p>
              </div>
            ) : (
              activities.map((act, i) => (
                <div key={act.id} className="relative pl-6 pb-5 last:pb-0">
                  {i < activities.length - 1 && <div className="absolute left-[7px] top-3 bottom-0 w-0.5 bg-black/[0.06]"></div>}
                  <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${classColors[i % classColors.length].split(' ')[0]}`}></div>
                  <div>
                    <span className="text-[11px] font-medium text-text-tertiary">
                      {act.waktu_mulai?.slice(0, 5) || '--:--'} - {act.waktu_selesai?.slice(0, 5) || '--:--'}
                    </span>
                    <p className="text-sm font-semibold mt-0.5">{act.catatan || 'Kegiatan'}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      <i className="fas fa-users mr-1"></i> Kelas {act.class}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <h2 className="section-title mb-4">Kehadiran per Kelas</h2>
          <p className="text-xs text-text-tertiary -mt-3 mb-4">Hari ini</p>
          <div className="text-center py-8 text-text-tertiary">
            <i className="fas fa-users text-2xl mb-2"></i>
            <p className="text-sm">Data kehadiran per kelas belum tersedia</p>
          </div>
        </Card>

        <Card className="hidden lg:block bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white border-0 !shadow-[0_12px_40px_rgba(99,91,255,0.2)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-lightbulb text-yellow-300 text-sm"></i>
                </div>
                <span className="text-sm font-medium text-white/80">Kutipan Hari Ini</span>
              </div>
              <blockquote className="text-lg font-medium leading-relaxed text-balance">
                "Pendidikan adalah senjata paling ampuh untuk mengubah dunia."
              </blockquote>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">NM</div>
              <div>
                <p className="text-sm font-semibold">Nelson Mandela</p>
                <p className="text-xs text-white/60">Tokoh Dunia</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="section-title mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: 'fa-check-circle', label: 'Absensi', desc: 'Hari Ini', path: '/app/absensi', color: 'from-emerald-400 to-green-500' },
              { icon: 'fa-star', label: 'Input Nilai', desc: 'Penilaian', path: '/app/nilai', color: 'from-blue-400 to-cyan-500' },
              { icon: 'fa-calendar-plus', label: 'Agenda', desc: 'Kegiatan', path: '/app/agenda', color: 'from-orange-400 to-amber-500' },
              { icon: 'fa-wand-magic-sparkles', label: 'Catatan Rapor', desc: 'AI Generate', path: '/app/penilaian-semester', color: 'from-pink-400 to-rose-500' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all duration-200 active:scale-[0.97] group"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm group-hover:shadow group-hover:-translate-y-0.5 transition-all duration-200`}>
                  <i className={`fas ${action.icon} text-white text-sm`}></i>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold">{action.label}</p>
                  <p className="text-[9px] text-text-tertiary">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {events.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Acara Mendatang</h2>
              <p className="text-xs text-text-tertiary mt-0.5">Kalender Pendidikan</p>
            </div>
            <button onClick={() => navigate('/app/kalender')} className="text-xs text-primary font-medium hover:underline">
              Lihat kalender <i className="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {events.map((evt) => (
              <div key={evt.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-secondary">
                <div className="w-8 h-8 rounded-lg bg-soft-blue flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-calendar-day text-blue-500 text-xs"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold">{evt.jenis}</p>
                  <p className="text-xs text-text-tertiary">{new Date(evt.event_date).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
