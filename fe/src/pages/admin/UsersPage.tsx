import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImpersonation } from '../../context/ImpersonationContext';
import apiClient from '../../api/client';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Subject } from '../../types';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: 'guru' | 'admin';
  teacher_classes: string[];
  teacher_subjects: string[];
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'guru' as 'guru' | 'admin', teacher_classes: '', teacher_subjects: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/admin/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await apiClient.get('/subjects');
      if (res.data.success) setSubjects(res.data.data);
    } catch {}
  };

  useEffect(() => { fetchUsers(); fetchSubjects(); }, []);

  const openAdd = () => {
    setEditUser(null);
    setForm({ email: '', password: '', name: '', role: 'guru', teacher_classes: '', teacher_subjects: '' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (u: UserData) => {
    setEditUser(u);
    setForm({ email: u.email, password: '', name: u.name, role: u.role, teacher_classes: (u.teacher_classes || []).join(', '), teacher_subjects: (u.teacher_subjects?.[0] || '') });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name,
        role: form.role,
        teacher_classes: form.teacher_classes ? form.teacher_classes.split(',').map(s => s.trim()).filter(Boolean) : [],
        teacher_subjects: form.teacher_subjects ? [form.teacher_subjects] : [],
      };
      payload.email = form.email;
      if (!editUser) {
        payload.password = form.password;
      } else if (form.password) {
        payload.password = form.password;
      }
      if (editUser) {
        const res = await apiClient.put(`/admin/users/${editUser.id}`, payload);
        if (res.data.success) { setUsers(users.map(u => u.id === editUser.id ? res.data.data : u)); setShowForm(false); setEditUser(null); }
      } else {
        const res = await apiClient.post('/admin/users', payload);
        if (res.data.success) { setUsers([...users, res.data.data]); setShowForm(false); }
      }
    } catch (err: any) {
      setError(err.response?.data?.error ? (Array.isArray(err.response.data.error) ? err.response.data.error.map((e: any) => e.message).join(', ') : err.response.data.error) : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(`/admin/users/${deleteTarget.id}`);
      if (res.data.success) { setUsers(users.filter(u => u.id !== deleteTarget.id)); setDeleteTarget(null); }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i></div>;

  const guruCount = users.filter(u => u.role === 'guru').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Kelola Pengguna</h1>
          <p className="text-text-secondary mt-1">{users.length} pengguna ({guruCount} guru, {adminCount} admin)</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-sm hover:shadow-md active:scale-[0.97] transition-all flex items-center gap-2">
          <i className="fas fa-plus"></i>Tambah Guru
        </button>
      </div>

      {error && <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><i className="fas fa-exclamation-circle"></i>{error}<button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><i className="fas fa-times"></i></button></div>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs"></i>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau email..." className="input-field pl-8 text-sm" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field !w-auto text-sm">
          <option value="">Semua Role</option>
          <option value="guru">Guru</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary">
                <th className="table-header">Nama</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Kelas</th>
                <th className="table-header">Pelajaran</th>
                <th className="table-header">Tanggal</th>
                <th className="table-header text-right">Dashboard</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-text-tertiary"><i className="fas fa-users text-2xl mb-2 block"></i>{search ? 'Tidak ada hasil' : 'Belum ada pengguna'}</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-surface-secondary transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">{u.name?.charAt(0) || '?'}</div>
                      <span className="font-medium text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-text-secondary text-xs">{u.email}</td>
                  <td className="table-cell"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{u.role === 'admin' ? 'Admin' : 'Guru'}</span></td>
                  <td className="table-cell text-text-secondary text-xs">{(u.teacher_classes || []).join(', ') || '-'}</td>
                  <td className="table-cell text-text-secondary text-xs">{(u.teacher_subjects || []).join(', ') || '-'}</td>
                  <td className="table-cell text-text-secondary text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="table-cell text-right">
                    <DashboardButton teacherId={u.id} teacherName={u.name} />
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="w-7 h-7 rounded-lg bg-soft-purple text-primary hover:bg-purple-200 flex items-center justify-center transition-colors" title="Edit"><i className="fas fa-pen text-[10px]"></i></button>
                      <button onClick={() => setDeleteTarget(u)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors" title="Hapus"><i className="fas fa-trash-alt text-[10px]"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showForm} onClose={() => { if (!saving) { setShowForm(false); setEditUser(null); setError(''); } }} title={editUser ? 'Edit Pengguna' : 'Tambah Guru'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">{editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" required={!editUser} placeholder={editUser ? 'Biarkan kosong' : 'Min. 6 karakter'} />
            </div>
            <div>
              <label className="label">Role</label>
              <div className="relative">
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'guru' | 'admin' })} className="select-field">
                  <option value="guru">Guru</option>
                  <option value="admin">Admin</option>
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Kelas (pisahkan dengan koma)</label>
            <input value={form.teacher_classes} onChange={e => setForm({ ...form, teacher_classes: e.target.value })} className="input-field" placeholder="7-1, 7-2, 8-1" />
          </div>
          <div>
            <label className="label">Mata Pelajaran</label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => {
                const selected = form.teacher_subjects === s.code;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setForm({ ...form, teacher_subjects: selected ? '' : s.code })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${selected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'}`}
                  >
                    {selected && <i className="fas fa-check-circle mr-1.5 text-xs"></i>}
                    {s.name}
                  </button>
                );
              })}
              {subjects.length === 0 && <span className="text-xs text-text-tertiary">Belum ada mata pelajaran. Tambah di menu Pelajaran.</span>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditUser(null); setError(''); }} disabled={saving}>Batal</Button>
            <Button type="submit" disabled={saving || !form.name || !form.email} loading={saving}>{editUser ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => { if (!deleting) setDeleteTarget(null); }} title="Hapus Pengguna">
        <p className="text-sm text-text-secondary mb-1">Yakin ingin menghapus user berikut?</p>
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-secondary mt-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{deleteTarget?.name?.charAt(0) || '?'}</div>
          <div>
            <p className="text-sm font-semibold">{deleteTarget?.name}</p>
            <p className="text-xs text-text-tertiary">{deleteTarget?.email} · {deleteTarget?.role === 'admin' ? 'Admin' : 'Guru'}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting} loading={deleting}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}

function DashboardButton({ teacherId, teacherName }: { teacherId: number; teacherName: string }) {
  const { startImpersonating } = useImpersonation();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => { startImpersonating(teacherId, teacherName); navigate('/app'); }}
      className="text-[10px] bg-indigo-100 text-indigo-600 hover:bg-indigo-200 px-2 py-1 rounded-lg font-medium transition-colors"
      title="Lihat dashboard guru"
    >
      <i className="fas fa-eye mr-1"></i>Dashboard
    </button>
  );
}