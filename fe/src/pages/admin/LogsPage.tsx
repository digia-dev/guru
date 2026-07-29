import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { ActivityLog } from '../../types';

function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function readableMessage(log: ActivityLog): string {
  const a = log.action;
  const t = log.entity_type;
  const d = log.details;
  const eid = log.entity_id;

  if (a === 'LOGIN') return `Login: ${d?.email || '-'}`;
  if (a === 'LOGOUT') return `Logout`;
  if (a === 'REGISTER') return `Akun baru: ${d?.name || ''} (${d?.email || ''})`;
  if (a === 'CREATE') {
    if (t === 'student') return `Menambahkan siswa ${d?.name || ''} (${d?.student_id || ''})`;
    if (t === 'grade') return `Menambahkan nilai ${d?.student_name || d?.student_id || ''} semester ${d?.semester || ''}`;
    if (t === 'attendance') return `Mencatat absensi ${d?.student_name || ''} - ${d?.keterangan || ''}`;
    if (t === 'tabungan') return `Transaksi tabungan ${d?.student_name || d?.student_id || ''}: ${d?.uang_masuk > 0 ? 'Setor Rp' + d?.uang_masuk?.toLocaleString('id-ID') : 'Tarik Rp' + d?.uang_keluar?.toLocaleString('id-ID')}`;
    if (t === 'materi') return `Membuat materi: ${d?.title || ''}`;
    if (t === 'agenda') return `Membuat agenda: ${d?.catatan?.substring(0, 50) || ''}`;
    if (t === 'user') return `Menambahkan pengguna: ${d?.name || ''}`;
    if (t === 'subject') return `Menambahkan pelajaran: ${d?.name || ''}`;
    if (t === 'academic_year') return `Menambahkan tahun ajaran: ${d?.name || ''}`;
    if (t === 'semester') return `Menambahkan semester: ${d?.name || ''}`;
    if (t === 'notifikasi') return `Mengirim notifikasi: ${d?.title || ''}`;
    if (t === 'kas_umum') return `Penarikan kas umum: Rp${d?.jumlah?.toLocaleString('id-ID') || ''} (${d?.keterangan || ''})`;
    return `Membuat ${t}: #${eid || ''}`;
  }
  if (a === 'UPDATE') {
    if (t === 'student') return `Mengubah data siswa ${d?.name || d?.student_id || ''}`;
    if (t === 'grade') return `Mengubah nilai ${d?.student_name || d?.student_id || ''}`;
    if (t === 'attendance') return `Mengubah absensi ${d?.student_name || ''} ${d?.keterangan || ''}`;
    if (t === 'tabungan') return `Mengedit transaksi tabungan #${eid || ''}`;
    if (t === 'materi') return `Mengedit materi: ${d?.title || ''}`;
    if (t === 'agenda') return `Mengubah agenda #${eid || ''}`;
    if (t === 'user') return `Mengubah data pengguna: ${d?.name || d?.email || ''}`;
    if (t === 'subject') return `Mengubah pelajaran #${eid || ''}`;
    if (t === 'academic_year') return `Mengubah tahun ajaran #${eid || ''}`;
    if (t === 'semester') return `Mengubah semester #${eid || ''}`;
    return `Mengubah ${t}: #${eid || ''}`;
  }
  if (a === 'DELETE') {
    if (t === 'student') return `Menghapus siswa ${d?.name || d?.student_id || ''}`;
    if (t === 'grade') return `Menghapus nilai ${d?.student_name || d?.student_id || ''}`;
    if (t === 'attendance') return `Menghapus absensi #${eid || ''}`;
    if (t === 'tabungan') return `Menghapus transaksi tabungan #${eid || ''}`;
    if (t === 'materi') return `Menghapus materi: ${d?.title || ''}`;
    if (t === 'agenda') return `Menghapus agenda #${eid || ''}`;
    if (t === 'user') return `Menghapus pengguna: ${d?.name || d?.email || ''}`;
    if (t === 'subject') return `Menghapus pelajaran: ${d?.name || ''}`;
    if (t === 'academic_year') return `Menghapus tahun ajaran: ${d?.name || ''}`;
    if (t === 'semester') return `Menghapus semester: ${d?.name || ''}`;
    return `Menghapus ${t}: #${eid || ''}`;
  }
  if (a === 'SEARCH') return `Mencari "${d?.query || ''}" di ${t}`;
  if (a === 'VIEW') return `Melihat ${t}: ${d?.name || ''}`;
  if (a === 'EXPORT') return `Mengexport ${t}${d?.class ? ' kelas ' + d.class : ''}`;
  if (a === 'IMPORT') return `Mengimport ${t}: ${d?.count || ''} data`;

  if (typeof d === 'string') return `${a} ${t}: ${d.substring(0, 80)}`;
  if (d && typeof d === 'object') {
    try { return `${a} ${t}: ${JSON.stringify(d).substring(0, 80)}`; } catch { return `${a} ${t}`; }
  }
  return `${a} ${t}`;
}

const actionBadge = (action: string) => {
  const map: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-purple-100 text-purple-700',
    LOGOUT: 'bg-gray-100 text-gray-500',
    REGISTER: 'bg-teal-100 text-teal-700',
    SEARCH: 'bg-amber-100 text-amber-700',
    VIEW: 'bg-cyan-100 text-cyan-700',
    EXPORT: 'bg-indigo-100 text-indigo-700',
    IMPORT: 'bg-orange-100 text-orange-700',
    READ: 'bg-sky-100 text-sky-700',
  };
  return map[action] || 'bg-yellow-100 text-yellow-700';
};

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ action: '', entity_type: '', user_id: '' });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '50' });
      if (filter.action) params.set('action', filter.action);
      if (filter.entity_type) params.set('entity_type', filter.entity_type);
      if (filter.user_id) params.set('user_id', filter.user_id);
      const res = await apiClient.get(`/logs?${params}`);
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, filter]);

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="page-title">Aktivitas Sistem</h1>
        <p className="text-text-secondary mt-1">Log aktivitas seluruh sistem — login, CRUD, pencarian, dan lainnya</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filter.action} onChange={e => { setFilter({ ...filter, action: e.target.value }); setPage(1); }} className="input-field !w-auto text-xs">
          <option value="">Semua Aksi</option>
          <option value="LOGIN">LOGIN / LOGOUT</option>
          <option value="CREATE">CREATE (Tambah)</option>
          <option value="UPDATE">UPDATE (Ubah)</option>
          <option value="DELETE">DELETE (Hapus)</option>
          <option value="REGISTER">REGISTER (Daftar)</option>
          <option value="SEARCH">SEARCH (Cari)</option>
          <option value="VIEW">VIEW (Lihat)</option>
          <option value="EXPORT">EXPORT</option>
          <option value="IMPORT">IMPORT</option>
          <option value="READ">READ (Baca)</option>
        </select>
        <select value={filter.entity_type} onChange={e => { setFilter({ ...filter, entity_type: e.target.value }); setPage(1); }} className="input-field !w-auto text-xs">
          <option value="">Semua Tipe</option>
          <option value="auth">Auth / Login</option>
          <option value="user">Pengguna</option>
          <option value="student">Siswa</option>
          <option value="attendance">Absensi</option>
          <option value="grade">Nilai</option>
          <option value="activity">Agenda</option>
          <option value="tabungan">Tabungan</option>
          <option value="kas_umum">Kas Umum</option>
          <option value="materi">Materi</option>
          <option value="subject">Pelajaran</option>
          <option value="academic_year">Tahun Ajaran</option>
          <option value="semester">Semester</option>
          <option value="notifikasi">Notifikasi</option>
          <option value="search">Pencarian</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
            <span className="ml-3 text-text-secondary">Memuat data...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-history text-3xl text-text-tertiary mb-3"></i>
            <p className="text-text-tertiary">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className={`fas text-xs ${
                      log.action === 'LOGIN' ? 'fa-right-to-bracket' :
                      log.action === 'LOGOUT' ? 'fa-right-from-bracket' :
                      log.action === 'CREATE' ? 'fa-plus' :
                      log.action === 'UPDATE' ? 'fa-pen' :
                      log.action === 'DELETE' ? 'fa-trash' :
                      log.action === 'SEARCH' ? 'fa-search' :
                      log.action === 'VIEW' || log.action === 'READ' ? 'fa-eye' :
                      log.action === 'EXPORT' ? 'fa-download' :
                      log.action === 'IMPORT' ? 'fa-upload' :
                      log.action === 'REGISTER' ? 'fa-user-plus' : 'fa-circle'
                    } ${
                      log.action === 'DELETE' ? 'text-danger' :
                      log.action === 'CREATE' ? 'text-green-600' :
                      log.action === 'UPDATE' ? 'text-blue-600' :
                      log.action === 'LOGIN' ? 'text-purple-600' :
                      'text-text-tertiary'
                    }`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">{readableMessage(log)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${actionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-text-tertiary">
                      <span className="font-medium text-text-secondary">{log.user_name}</span>
                      <span>{fmtTime(log.created_at)}</span>
                      {log.ip_address && <span>· {log.ip_address}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-black/[0.06] hover:bg-surface-secondary text-text-secondary transition-all disabled:opacity-30">← Sebelumnya</button>
          <span className="text-xs text-text-secondary">Halaman {page} dari {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-black/[0.06] hover:bg-surface-secondary text-text-secondary transition-all disabled:opacity-30">Selanjutnya →</button>
        </div>
      )}
    </div>
  );
}