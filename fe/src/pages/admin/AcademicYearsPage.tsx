import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { AcademicYear, Semester } from '../../types';
import Card from '../../components/ui/Card';

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [showYearForm, setShowYearForm] = useState(false);
  const [showSemForm, setShowSemForm] = useState(false);
  const [editYear, setEditYear] = useState<AcademicYear | null>(null);
  const [editSem, setEditSem] = useState<Semester | null>(null);
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '' });
  const [semForm, setSemForm] = useState({ academic_year_id: 0, name: 'Ganjil' as 'Ganjil' | 'Genap', start_date: '', end_date: '' });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [yRes, sRes] = await Promise.all([
        apiClient.get('/academic-years'),
        apiClient.get('/semesters'),
      ]);
      if (yRes.data.success) setYears(yRes.data.data);
      if (sRes.data.success) setSemesters(sRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleYearSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      if (editYear) {
        const res = await apiClient.put(`/academic-years/${editYear.id}`, yearForm);
        if (res.data.success) setYears(years.map(y => y.id === editYear.id ? res.data.data : y));
      } else {
        const res = await apiClient.post('/academic-years', yearForm);
        if (res.data.success) setYears([...years, res.data.data]);
      }
      setShowYearForm(false); setEditYear(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menyimpan');
    }
  };

  const handleActivateYear = async (id: number) => {
    try {
      await apiClient.put(`/academic-years/${id}/activate`);
      setYears(years.map(y => ({ ...y, is_active: y.id === id })));
    } catch { alert('Gagal mengaktifkan'); }
  };

  const handleDeleteYear = async (id: number) => {
    if (!confirm('Yakin?')) return;
    try {
      await apiClient.delete(`/academic-years/${id}`);
      setYears(years.filter(y => y.id !== id));
    } catch { alert('Gagal menghapus'); }
  };

  const handleSemSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      if (editSem) {
        const res = await apiClient.put(`/semesters/${editSem.id}`, semForm);
        if (res.data.success) setSemesters(semesters.map(s => s.id === editSem.id ? res.data.data : s));
      } else {
        const res = await apiClient.post('/semesters', semForm);
        if (res.data.success) setSemesters([...semesters, res.data.data]);
      }
      setShowSemForm(false); setEditSem(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal menyimpan');
    }
  };

  const handleActivateSem = async (id: number) => {
    try {
      await apiClient.put(`/semesters/${id}/activate`);
      setSemesters(semesters.map(s => ({ ...s, is_active: s.id === id })));
    } catch { alert('Gagal mengaktifkan'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tahun Ajaran & Semester</h1>
          <p className="text-text-secondary mt-1">Atur tahun ajaran dan semester aktif</p>
        </div>
      </div>

      {error && <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Tahun Ajaran</h2>
            <button onClick={() => { setEditYear(null); setYearForm({ name: '', start_date: '', end_date: '' }); setShowYearForm(true); }} className="text-xs text-primary font-medium hover:underline">+ Tambah</button>
          </div>
          {showYearForm && (
            <form onSubmit={handleYearSubmit} className="mb-4 p-4 rounded-2xl bg-surface-secondary space-y-3">
              <input value={yearForm.name} onChange={e => setYearForm({ ...yearForm, name: e.target.value })} className="input-field" placeholder="Nama (2025/2026)" required />
              <input type="date" value={yearForm.start_date} onChange={e => setYearForm({ ...yearForm, start_date: e.target.value })} className="input-field" required />
              <input type="date" value={yearForm.end_date} onChange={e => setYearForm({ ...yearForm, end_date: e.target.value })} className="input-field" required />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-xs">{editYear ? 'Simpan' : 'Tambah'}</button>
                <button type="button" onClick={() => { setShowYearForm(false); setEditYear(null); }} className="btn-secondary text-xs">Batal</button>
              </div>
            </form>
          )}
          <div className="space-y-2">
            {years.map((y) => (
              <div key={y.id} className="flex items-center justify-between p-3 rounded-2xl bg-surface-secondary">
                <div>
                  <p className="text-sm font-semibold">{y.name}</p>
                  <p className="text-xs text-text-tertiary">{new Date(y.start_date).toLocaleDateString('id-ID')} - {new Date(y.end_date).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {y.is_active && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-600 font-medium">Aktif</span>}
                  {!y.is_active && <button onClick={() => handleActivateYear(y.id)} className="text-[10px] text-primary hover:underline">Aktifkan</button>}
                  <button onClick={() => { setEditYear(y); setYearForm({ name: y.name, start_date: y.start_date.slice(0, 10), end_date: y.end_date.slice(0, 10) }); setShowYearForm(true); }} className="text-xs text-primary hover:underline">Edit</button>
                  <button onClick={() => handleDeleteYear(y.id)} className="text-xs text-red-500 hover:underline">Hapus</button>
                </div>
              </div>
            ))}
            {years.length === 0 && <p className="text-sm text-text-tertiary text-center py-4">Belum ada tahun ajaran</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Semester</h2>
            <button onClick={() => { setEditSem(null); setSemForm({ academic_year_id: years.find(y => y.is_active)?.id || 0, name: 'Ganjil', start_date: '', end_date: '' }); setShowSemForm(true); }} className="text-xs text-primary font-medium hover:underline">+ Tambah</button>
          </div>
          {showSemForm && (
            <form onSubmit={handleSemSubmit} className="mb-4 p-4 rounded-2xl bg-surface-secondary space-y-3">
              <select value={semForm.academic_year_id} onChange={e => setSemForm({ ...semForm, academic_year_id: parseInt(e.target.value) })} className="input-field" required>
                <option value="">Pilih Tahun Ajaran</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <select value={semForm.name} onChange={e => setSemForm({ ...semForm, name: e.target.value as 'Ganjil' | 'Genap' })} className="input-field">
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
              <input type="date" value={semForm.start_date} onChange={e => setSemForm({ ...semForm, start_date: e.target.value })} className="input-field" required />
              <input type="date" value={semForm.end_date} onChange={e => setSemForm({ ...semForm, end_date: e.target.value })} className="input-field" required />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-xs">{editSem ? 'Simpan' : 'Tambah'}</button>
                <button type="button" onClick={() => { setShowSemForm(false); setEditSem(null); }} className="btn-secondary text-xs">Batal</button>
              </div>
            </form>
          )}
          <div className="space-y-2">
            {semesters.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-surface-secondary">
                <div>
                  <p className="text-sm font-semibold">{s.name} {s.academic_year_name ? `(${s.academic_year_name})` : ''}</p>
                  <p className="text-xs text-text-tertiary">{new Date(s.start_date).toLocaleDateString('id-ID')} - {new Date(s.end_date).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.is_active && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-600 font-medium">Aktif</span>}
                  {!s.is_active && <button onClick={() => handleActivateSem(s.id)} className="text-[10px] text-primary hover:underline">Aktifkan</button>}
                  <button onClick={() => { setEditSem(s); setSemForm({ academic_year_id: s.academic_year_id, name: s.name, start_date: s.start_date.slice(0, 10), end_date: s.end_date.slice(0, 10) }); setShowSemForm(true); }} className="text-xs text-primary hover:underline">Edit</button>
                  <button onClick={async () => { if (!confirm('Yakin?')) return; await apiClient.delete(`/semesters/${s.id}`); setSemesters(semesters.filter(x => x.id !== s.id)); }} className="text-xs text-red-500 hover:underline">Hapus</button>
                </div>
              </div>
            ))}
            {semesters.length === 0 && <p className="text-sm text-text-tertiary text-center py-4">Belum ada semester</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
