import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImpersonation } from '../../context/ImpersonationContext';
import apiClient from '../../api/client';
import Card from '../../components/ui/Card';
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
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'guru' as 'guru' | 'admin', teacher_classes: '', teacher_subjects: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    try {
      const res = await apiClient.delete(`/admin/users/${id}`);
      if (res.data.success) setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menghapus');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Kelola Pengguna</h1>
          <p className="text-text-secondary mt-1">Tambah, edit, dan hapus akun guru</p>
        </div>
        <button onClick={() => { setEditUser(null); setForm({ email: '', password: '', name: '', role: 'guru', teacher_classes: '', teacher_subjects: '' }); setShowForm(true); }} className="btn-primary">
          <i className="fas fa-plus mr-2"></i>Tambah Guru
        </button>
      </div>

      {error && <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" required />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'guru' | 'admin' })} className="input-field">
                  <option value="guru">Guru</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Kelas (pisahkan dengan koma)</label>
                <input value={form.teacher_classes} onChange={e => setForm({ ...form, teacher_classes: e.target.value })} className="input-field" placeholder="7A, 7B, 8A" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Mata Pelajaran (pilih satu)</label>
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
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</> : (editUser ? 'Simpan' : 'Tambah')}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditUser(null); setError(''); }} className="btn-secondary" disabled={saving}>Batal</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-left py-3 px-4 font-semibold">Nama</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Role</th>
                <th className="text-left py-3 px-4 font-semibold">Kelas</th>
                <th className="text-left py-3 px-4 font-semibold">Pelajaran</th>
                <th className="text-left py-3 px-4 font-semibold">Tanggal Daftar</th>
                <th className="text-right py-3 px-4 font-semibold">Dashboard</th>
                <th className="text-right py-3 px-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-black/[0.03] hover:bg-surface-secondary transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">{u.name?.charAt(0) || '?'}</div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-text-secondary">{u.email}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{u.role === 'admin' ? 'Admin' : 'Guru'}</span></td>
                  <td className="py-3 px-4 text-text-secondary">{(u.teacher_classes || []).join(', ') || '-'}</td>
                  <td className="py-3 px-4 text-text-secondary">{(u.teacher_subjects || []).join(', ') || '-'}</td>
                  <td className="py-3 px-4 text-text-secondary">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 px-4 text-right">
                    <DashboardButton teacherId={u.id} teacherName={u.name} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => { setEditUser(u); setForm({ email: u.email, password: '', name: u.name, role: u.role, teacher_classes: (u.teacher_classes || []).join(', '), teacher_subjects: (u.teacher_subjects?.[0] || '') }); setShowForm(true); }} className="text-primary hover:underline text-xs mr-3">Edit</button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline text-xs">Hapus</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-text-tertiary">Belum ada pengguna</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
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
