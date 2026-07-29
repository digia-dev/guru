import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { ActivityLog } from '../../types';

const actionBadge = (action: string) => {
  const map: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-purple-100 text-purple-700',
  };
  return map[action.toUpperCase()] || 'bg-yellow-100 text-yellow-700';
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

  const formatDetails = (details: any): string => {
    if (!details) return '';
    if (typeof details === 'string') return details;
    try { return JSON.stringify(details, null, 2); } catch { return String(details); }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="page-title">Aktivitas</h1>
        <p className="text-text-secondary mt-1">Log aktivitas seluruh sistem</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filter.action} onChange={e => { setFilter({ ...filter, action: e.target.value }); setPage(1); }} className="input-field !w-auto text-xs">
          <option value="">Semua Aksi</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
        </select>
        <select value={filter.entity_type} onChange={e => { setFilter({ ...filter, entity_type: e.target.value }); setPage(1); }} className="input-field !w-auto text-xs">
          <option value="">Semua Tipe</option>
          <option value="user">User</option>
          <option value="student">Siswa</option>
          <option value="attendance">Absensi</option>
          <option value="grade">Nilai</option>
          <option value="activity">Agenda</option>
          <option value="tabungan">Tabungan</option>
          <option value="materi">Materi</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <i className="fas fa-spinner fa-spin text-2xl text-primary-500"></i>
            <span className="ml-3 text-gray-500">Memuat data...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-gray-400 py-12 text-center">Belum ada aktivitas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Waktu</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Aksi</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Tipe</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700 font-medium text-xs">{log.user_name}</span>
                      <span className="text-gray-400 ml-1 text-[10px]">&lt;{log.user_email}&gt;</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${actionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs capitalize">{log.entity_type}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                      {log.entity_id ? `#${log.entity_id}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {formatDetails(log.details) || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
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
