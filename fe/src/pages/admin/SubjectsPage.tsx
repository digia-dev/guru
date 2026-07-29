import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Subject } from '../../types';
import Card from '../../components/ui/Card';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    try {
      const res = await apiClient.get('/subjects');
      if (res.data.success) setSubjects(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      if (editSubject) {
        const res = await apiClient.put(`/subjects/${editSubject.id}`, form);
        if (res.data.success) setSubjects(subjects.map(s => s.id === editSubject.id ? res.data.data : s));
      } else {
        const res = await apiClient.post('/subjects', form);
        if (res.data.success) setSubjects([...subjects, res.data.data]);
      }
      setShowForm(false); setEditSubject(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin?')) return;
    try {
      await apiClient.delete(`/subjects/${id}`);
      setSubjects(subjects.filter(s => s.id !== id));
    } catch { alert('Gagal menghapus'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Mata Pelajaran</h1>
          <p className="text-text-secondary mt-1">Atur daftar mata pelajaran</p>
        </div>
        <button onClick={() => { setEditSubject(null); setForm({ name: '', code: '', description: '' }); setShowForm(true); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-sm hover:shadow-md active:scale-[0.97] transition-all">
          <i className="fas fa-plus mr-1.5"></i>Tambah
        </button>
      </div>

      {error && <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Pelajaran</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Matematika" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kode</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input-field" placeholder="MTK" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-sm hover:shadow-md active:scale-[0.97] transition-all">{editSubject ? 'Simpan' : 'Tambah'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditSubject(null); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-black/[0.06] hover:bg-surface-secondary text-text-secondary transition-all">Batal</button>
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
                <th className="text-left py-3 px-4 font-semibold">Kode</th>
                <th className="text-left py-3 px-4 font-semibold">Deskripsi</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-right py-3 px-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-b border-black/[0.03] hover:bg-surface-secondary transition-colors">
                  <td className="py-3 px-4 font-medium">{s.name}</td>
                  <td className="py-3 px-4 text-text-secondary">{s.code}</td>
                  <td className="py-3 px-4 text-text-secondary">{s.description || '-'}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${s.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => { setEditSubject(s); setForm({ name: s.name, code: s.code, description: s.description || '' }); setShowForm(true); }} className="text-primary hover:underline text-xs mr-3">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline text-xs">Hapus</button>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-text-tertiary">Belum ada mata pelajaran</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
