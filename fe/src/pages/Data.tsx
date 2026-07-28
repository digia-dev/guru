import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { Student, Tabungan, KasUmum } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAutoSave } from '../hooks/useAutoSave';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import * as XLSX from 'xlsx';

function DataSiswaTab({ selectedClass, adminMode, teachers }: { selectedClass: string; adminMode: boolean; teachers: { id: number; name: string }[] }) {
  const queryClient = useQueryClient();
  const [changes, setChanges] = useState<Map<number, Partial<Student>>>(new Map());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { data: students = [] } = useQuery({ queryKey: ['students', selectedClass], queryFn: async () => { const { data } = await apiClient.get(`/students?class=${encodeURIComponent(selectedClass)}`); return data.data as Student[]; } });

  const doSave = async () => {
    if (changes.size === 0) return; setSaveStatus('saving');
    try { await Promise.all(Array.from(changes.entries()).map(([id, vals]) => apiClient.put(`/students/${id}`, vals))); queryClient.invalidateQueries({ queryKey: ['students'] }); setSaveStatus('saved'); setChanges(new Map()); setTimeout(() => setSaveStatus('idle'), 2000); }
    catch { setSaveStatus('error'); toast.error('Gagal menyimpan'); }
  };
  const { schedule, saveNow } = useAutoSave(doSave, 5000);

  const createMutation = useMutation({
    mutationFn: async (student: Partial<Student>) => apiClient.post('/students', student),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); toast.success('Siswa ditambahkan'); },
    onError: (err: any) => { const e = err?.response?.data?.error; toast.error(Array.isArray(e) ? e.map((x: any) => x.message || String(x)).join(', ') : (e || 'Gagal menambah siswa')); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/students/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); toast.success('Siswa dihapus'); setConfirmDelete(null); },
    onError: () => { toast.error('Gagal menghapus siswa'); setConfirmDelete(null); },
  });

  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ student_id: '', name: '' });
  const [selectedTeacher, setSelectedTeacher] = useState(adminMode && teachers.length > 0 ? teachers[0].id : 0);
  const handleChange = (id: number, field: string, value: string) => { setChanges(prev => { const next = new Map(prev); const prevVal = next.get(id) || {}; next.set(id, { ...prevVal, [field]: value }); if (next.size > 0) schedule(); return next; }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {saveStatus !== 'idle' && <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-soft-purple text-primary' : saveStatus === 'saved' ? 'bg-soft-green text-green-600' : 'bg-red-50 text-red-500'}`}>{saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'saved' ? 'Tersimpan' : 'Gagal'}</span>}
      </div>

      <Card>
        <h3 className="font-semibold text-sm mb-3">Tambah Siswa Baru</h3>
        <div className="flex gap-3 flex-wrap">
          {adminMode && (
            <div className="relative w-full sm:w-auto">
              <select value={selectedTeacher} onChange={e => setSelectedTeacher(parseInt(e.target.value))} className="select-field">
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
            </div>
          )}
          <input type="text" placeholder="NIS" value={newStudent.student_id} onChange={e => setNewStudent(s => ({ ...s, student_id: e.target.value }))} className="input-field flex-1" />
          <input type="text" placeholder="Nama Lengkap" value={newStudent.name} onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))} className="input-field flex-1" />
          <Button onClick={() => { if (newStudent.student_id && newStudent.name && selectedClass) { const payload: any = { ...newStudent, class: selectedClass }; if (adminMode && selectedTeacher) payload.teacher_id = selectedTeacher; createMutation.mutate(payload); setNewStudent({ student_id: '', name: '' }); } }} disabled={!newStudent.student_id || !newStudent.name || !selectedClass}>Tambah</Button>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          {changes.size > 0 && <div className="flex items-center gap-2 px-5 py-3 text-xs text-amber-600 bg-amber-50 border-b border-black/[0.06]"><i className="fas fa-circle text-[6px]"></i>{changes.size} siswa diubah</div>}
          <table className="min-w-full">
            <thead>
              <tr className="bg-surface-secondary">
                <th className="table-header sticky left-0 bg-surface-secondary z-10 min-w-[80px]">NIS</th>
                <th className="table-header sticky left-[80px] bg-surface-secondary z-10 min-w-[140px]">Nama</th>
                <th className="table-header min-w-[120px]">Alamat</th>
                <th className="table-header min-w-[100px]">Tgl Lahir</th>
                <th className="table-header min-w-[100px]">Ayah</th>
                <th className="table-header min-w-[100px]">Pek. Ayah</th>
                <th className="table-header min-w-[100px]">Ibu</th>
                <th className="table-header min-w-[100px]">Pek. Ibu</th>
                <th className="table-header min-w-[90px]">No HP</th>
                <th className="table-header min-w-[120px]">Catatan</th>
                <th className="table-header w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const ch = changes.get(s.id) || {};
                const isChanged = changes.has(s.id);
                return (
                  <tr key={s.id} className={`hover:bg-surface-secondary transition-colors ${isChanged ? 'bg-amber-50/30' : ''}`}>
                    <td className="table-cell sticky left-0 bg-white z-10 font-mono text-xs">{s.student_id}</td>
                    <td className="table-cell sticky left-[80px] bg-white z-10 font-medium">
                      <div className="flex items-center gap-1">{isChanged && <i className="fas fa-circle text-[6px] text-amber-400"></i>}<input className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1 min-w-[100px]" value={ch.name ?? s.name} onChange={(e) => handleChange(s.id, 'name', e.target.value)} /></div>
                    </td>
                    <td className="table-cell"><input className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1 min-w-[100px]" value={ch.address ?? s.address ?? ''} onChange={(e) => handleChange(s.id, 'address', e.target.value)} /></td>
                    <td className="table-cell"><input type="date" className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1 w-[120px]" value={ch.dob ?? s.dob ?? ''} onChange={(e) => handleChange(s.id, 'dob', e.target.value)} /></td>
                    <td className="table-cell"><input className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1 min-w-[80px]" value={ch.father_name ?? s.father_name ?? ''} onChange={(e) => handleChange(s.id, 'father_name', e.target.value)} /></td>
                    <td className="table-cell"><input className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1 min-w-[80px]" value={ch.father_job ?? s.father_job ?? ''} onChange={(e) => handleChange(s.id, 'father_job', e.target.value)} /></td>
                    <td className="table-cell"><input className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1 min-w-[80px]" value={ch.mother_name ?? s.mother_name ?? ''} onChange={(e) => handleChange(s.id, 'mother_name', e.target.value)} /></td>
                    <td className="table-cell"><input className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1 min-w-[80px]" value={ch.mother_job ?? s.mother_job ?? ''} onChange={(e) => handleChange(s.id, 'mother_job', e.target.value)} /></td>
                    <td className="table-cell"><input className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1 min-w-[80px]" value={ch.phone ?? s.phone ?? ''} onChange={(e) => handleChange(s.id, 'phone', e.target.value)} /></td>
                    <td className="table-cell"><input className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1 min-w-[100px]" value={ch.notes ?? s.notes ?? ''} onChange={(e) => handleChange(s.id, 'notes', e.target.value)} /></td>
                    <td className="table-cell text-center"><button onClick={() => setConfirmDelete(s)} className="text-danger/60 hover:text-danger transition-colors text-sm"><i className="fas fa-trash-alt"></i></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {students.length === 0 && <div className="text-center py-12 text-text-tertiary"><i className="fas fa-users text-2xl mb-2 block"></i>Tidak ada siswa</div>}
        </div>
      </Card>

      {changes.size > 0 && (
        <button onClick={() => saveNow()} disabled={saveStatus === 'saving'} className={`floating-save-btn text-white disabled:opacity-50 ${saveStatus === 'error' ? 'bg-danger' : 'bg-gradient-to-r from-violet-600 to-indigo-500'}`}>
          {saveStatus === 'saving' ? <i className="fas fa-spinner fa-spin text-base"></i> : saveStatus === 'saved' ? <i className="fas fa-check text-base"></i> : <i className="fas fa-save text-base"></i>}
        </button>
      )}

      <Modal open={!!confirmDelete} onClose={() => { if (!deleteMutation.isPending) setConfirmDelete(null); }} title="Hapus Siswa">
        <p className="text-sm text-text-secondary mb-1">Yakin ingin menghapus siswa berikut?</p>
        <p className="font-semibold">{confirmDelete?.name} ({confirmDelete?.student_id})</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)} disabled={deleteMutation.isPending}>Batal</Button>
          <Button variant="danger" onClick={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete.id); }} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}</Button>
        </div>
      </Modal>
    </div>
  );
}

function TabunganTab({ selectedClass }: { selectedClass: string }) {
  const queryClient = useQueryClient(); const todayStr = new Date().toLocaleDateString('en-CA');
  const [txOpen, setTxOpen] = useState(false); const [histOpen, setHistOpen] = useState(false); const [kasOpen, setKasOpen] = useState(false); const [kasHistOpen, setKasHistOpen] = useState(false);
  const [txType, setTxType] = useState<'setor' | 'tarik' | 'edit'>('setor'); const [txDocId, setTxDocId] = useState<number | null>(null);
  const [txStudentId, setTxStudentId] = useState(''); const [txDate, setTxDate] = useState(todayStr); const [txAmount, setTxAmount] = useState('');
  const [histStudentId, setHistStudentId] = useState(''); const [histStudentName, setHistStudentName] = useState('');
  const [kasDocId, setKasDocId] = useState<number | null>(null); const [kasDate, setKasDate] = useState(todayStr); const [kasAmount, setKasAmount] = useState(''); const [kasKeterangan, setKasKeterangan] = useState('');

  const { data: summary } = useQuery({ queryKey: ['tabungan-summary'], queryFn: async () => { const { data } = await apiClient.get('/tabungan/summary'); return data.data as { total_saldo: number; total_setoran_kas_umum: number; per_student: { student_id: string; saldo: string }[] }; } });
  const { data: students = [] } = useQuery({ queryKey: ['students', selectedClass], queryFn: async () => { const { data } = await apiClient.get(`/students?class=${encodeURIComponent(selectedClass)}`); return data.data as Student[]; }, enabled: !!selectedClass });
  const { data: studentHistory = [] } = useQuery({ queryKey: ['tabungan-history', histStudentId], queryFn: async () => { const { data } = await apiClient.get(`/tabungan?student_id=${encodeURIComponent(histStudentId)}`); return data.data as Tabungan[]; }, enabled: !!histStudentId });
  const { data: kasUmumList = [] } = useQuery({ queryKey: ['kas-umum'], queryFn: async () => { const { data } = await apiClient.get('/kas-umum'); return data.data as KasUmum[]; } });

  const saldoMap = new Map(summary?.per_student?.map(s => [s.student_id, parseFloat(s.saldo)]) || []);
  const totalSaldo = summary?.total_saldo || 0; const totalSetoran = summary?.total_setoran_kas_umum || 0;

  const saveTxMutation = useMutation({ mutationFn: async () => { const body: Record<string, any> = { student_id: txStudentId, tanggal: txDate, uang_masuk: 0, uang_keluar: 0 }; if (txType === 'setor') body.uang_masuk = parseFloat(txAmount) || 0; else body.uang_keluar = parseFloat(txAmount) || 0; if (txType === 'edit' && txDocId) await apiClient.put(`/tabungan/${txDocId}`, body); else await apiClient.post('/tabungan', body); }, onSuccess: () => { toast.success('Transaksi berhasil disimpan!'); setTxOpen(false); queryClient.invalidateQueries({ queryKey: ['tabungan-summary'] }); queryClient.invalidateQueries({ queryKey: ['tabungan-history'] }); }, onError: () => toast.error('Gagal menyimpan transaksi') });
  const deleteTxMutation = useMutation({ mutationFn: async (id: number) => { await apiClient.delete(`/tabungan/${id}`); }, onSuccess: () => { toast.success('Transaksi dihapus!'); queryClient.invalidateQueries({ queryKey: ['tabungan-summary'] }); queryClient.invalidateQueries({ queryKey: ['tabungan-history'] }); }, onError: () => toast.error('Gagal menghapus transaksi') });
  const saveKasMutation = useMutation({ mutationFn: async () => { const body = { tanggal: kasDate, jumlah: parseFloat(kasAmount) || 0, keterangan: kasKeterangan }; if (kasDocId) await apiClient.put(`/kas-umum/${kasDocId}`, body); else await apiClient.post('/kas-umum', body); }, onSuccess: () => { toast.success(kasDocId ? 'Penarikan diperbarui!' : 'Penarikan berhasil disimpan!'); setKasOpen(false); queryClient.invalidateQueries({ queryKey: ['kas-umum'] }); queryClient.invalidateQueries({ queryKey: ['tabungan-summary'] }); }, onError: () => toast.error('Gagal menyimpan penarikan') });
  const deleteKasMutation = useMutation({ mutationFn: async (id: number) => { await apiClient.delete(`/kas-umum/${id}`); }, onSuccess: () => { toast.success('Penarikan dihapus!'); queryClient.invalidateQueries({ queryKey: ['kas-umum'] }); queryClient.invalidateQueries({ queryKey: ['tabungan-summary'] }); }, onError: () => toast.error('Gagal menghapus penarikan') });

  const openTxModal = (type: 'setor' | 'tarik' | 'edit', docId?: number, existingData?: Partial<Tabungan>, prefillStudentId?: string) => { setTxType(type); setTxDocId(docId || null); setTxStudentId(prefillStudentId || existingData?.student_id || ''); setTxDate(existingData?.tanggal || todayStr); setTxAmount(type === 'edit' && existingData ? String(existingData.uang_masuk! > 0 ? existingData.uang_masuk : existingData.uang_keluar) : ''); setTxOpen(true); };
  const openStudentHistory = (studentId: string, studentName: string) => { setHistStudentId(studentId); setHistStudentName(studentName); setHistOpen(true); };

  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="bg-white rounded-xl border border-black/[0.06] p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-soft-blue flex items-center justify-center flex-shrink-0"><i className="fas fa-wallet text-blue-500 text-xs"></i></div>
          <div className="min-w-0"><p className="text-[10px] text-text-tertiary font-medium truncate">Total Tabungan Siswa</p><p className="text-sm font-bold text-blue-600 truncate">Rp {totalSaldo.toLocaleString('id-ID')}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-black/[0.06] p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-soft-green flex items-center justify-center flex-shrink-0"><i className="fas fa-building-columns text-green-500 text-xs"></i></div>
          <div className="min-w-0"><p className="text-[10px] text-text-tertiary font-medium truncate">Total Setor Kas Umum</p><p className="text-sm font-bold text-green-600 truncate">Rp {totalSetoran.toLocaleString('id-ID')}</p></div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button size="sm" icon="fa-plus" onClick={() => openTxModal('setor')}>Setor</Button>
        <Button variant="secondary" size="sm" icon="fa-minus" onClick={() => openTxModal('tarik')}>Tarik</Button>
        <Button variant="ghost" size="sm" icon="fa-list" onClick={() => setKasHistOpen(true)}>Riwayat Kas</Button>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr className="bg-surface-secondary"><th className="table-header">Nama Siswa</th><th className="table-header text-center">Total Tabungan</th><th className="table-header text-center">Riwayat</th></tr></thead>
            <tbody>
              {sortedStudents.length === 0 && <tr><td colSpan={3} className="text-center py-12 text-text-tertiary"><i className="fas fa-wallet text-2xl mb-2 block"></i>Tidak ada siswa</td></tr>}
              {sortedStudents.map(s => (
                <tr key={s.id} className="hover:bg-surface-secondary transition-colors">
                  <td className="table-cell font-medium">{s.name}</td>
                  <td className="table-cell text-center font-bold text-green-600">Rp {(saldoMap.get(s.student_id) || 0).toLocaleString('id-ID')}</td>
                  <td className="table-cell text-center"><button onClick={() => openStudentHistory(s.student_id, s.name)} className="text-primary hover:text-primary-dark"><i className="fas fa-history"></i></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={txOpen} onClose={() => setTxOpen(false)} title={txType === 'setor' ? 'Tambah Setoran' : txType === 'tarik' ? 'Tarik Saldo' : 'Edit Transaksi'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Siswa</label>
            <div className="relative">
              <select disabled={txType === 'edit'} value={txStudentId} onChange={e => setTxStudentId(e.target.value)} className="select-field"><option value="">Pilih Siswa...</option>{sortedStudents.map(s => <option key={s.student_id} value={s.student_id}>{s.name}</option>)}</select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
            </div>
          </div>
          <div><label className="label">Tanggal</label><input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="input-field" /></div>
          <div><label className="label">{txType === 'setor' ? 'Jumlah Setoran' : 'Jumlah Penarikan'}</label><input type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="Rp" className="input-field" /></div>
          <Button onClick={() => saveTxMutation.mutate()} disabled={saveTxMutation.isPending || !txStudentId || !txDate || !txAmount} loading={saveTxMutation.isPending} className="w-full">Simpan Transaksi</Button>
        </div>
      </Modal>

      <Modal open={histOpen} onClose={() => setHistOpen(false)} title={`Riwayat - ${histStudentName}`} size="sm">
        <div className="flex justify-center gap-2 mb-4">
          <Button size="sm" icon="fa-plus" onClick={() => { setHistOpen(false); setTimeout(() => openTxModal('setor', undefined, undefined, histStudentId), 200); }}>Uang Masuk</Button>
          <Button variant="secondary" size="sm" icon="fa-minus" onClick={() => { setHistOpen(false); setTimeout(() => openTxModal('tarik', undefined, undefined, histStudentId), 200); }}>Uang Keluar</Button>
        </div>
        <div className="space-y-2">
          {studentHistory.length === 0 && <p className="text-center text-text-tertiary py-4">Tidak ada riwayat transaksi</p>}
          {studentHistory.map(tx => {
            const masuk = tx.uang_masuk > 0;
            return (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl bg-surface-secondary">
                <div><p className="text-xs text-text-tertiary">{new Date(tx.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p><p className={`text-sm font-semibold ${masuk ? 'text-green-600' : 'text-red-500'}`}>{masuk ? '+' : '-'}Rp {(masuk ? tx.uang_masuk : tx.uang_keluar).toLocaleString('id-ID')}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => { setHistOpen(false); setTimeout(() => openTxModal('edit', tx.id, tx), 200); }} className="text-text-tertiary hover:text-primary"><i className="fas fa-edit"></i></button>
                  <button onClick={() => { if (confirm('Hapus transaksi ini?')) deleteTxMutation.mutate(tx.id); }} className="text-text-tertiary hover:text-danger"><i className="fas fa-trash"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal open={kasHistOpen} onClose={() => setKasHistOpen(false)} title="Riwayat Setor Kas" size="sm">
        <div className="space-y-2">
          {kasUmumList.length === 0 && <p className="text-center text-text-tertiary py-4">Tidak ada riwayat</p>}
          {kasUmumList.map(k => (
            <div key={k.id} className="flex items-center justify-between p-3 rounded-2xl bg-surface-secondary">
              <div><p className="text-xs text-text-tertiary">{new Date(k.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p><p className="text-sm font-semibold text-red-500">-Rp {k.jumlah.toLocaleString('id-ID')}</p><p className="text-xs text-text-tertiary">{k.keterangan || '-'}</p></div>
              <div className="flex gap-2">
                <button onClick={() => { setKasHistOpen(false); setKasDocId(k.id); setKasDate(k.tanggal); setKasAmount(String(k.jumlah)); setKasKeterangan(k.keterangan || ''); setKasOpen(true); }} className="text-text-tertiary hover:text-primary"><i className="fas fa-edit"></i></button>
                <button onClick={() => { if (confirm('Hapus penarikan ini?')) deleteKasMutation.mutate(k.id); }} className="text-text-tertiary hover:text-danger"><i className="fas fa-trash"></i></button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={kasOpen} onClose={() => setKasOpen(false)} title={kasDocId ? 'Edit Penarikan' : 'Tarik dari Kas Umum'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Tanggal</label><input type="date" value={kasDate} onChange={e => setKasDate(e.target.value)} className="input-field" /></div>
          <div><label className="label">Jumlah</label><input type="number" value={kasAmount} onChange={e => setKasAmount(e.target.value)} placeholder="Rp" className="input-field" /></div>
          <div><label className="label">Keterangan</label><textarea value={kasKeterangan} onChange={e => setKasKeterangan(e.target.value)} className="input-field" rows={3} placeholder="Misal: Pembelian ATK, Dana Kegiatan" /></div>
          <Button onClick={() => saveKasMutation.mutate()} disabled={saveKasMutation.isPending || !kasDate || !kasAmount} loading={saveKasMutation.isPending} className="w-full">Simpan Penarikan</Button>
        </div>
      </Modal>
    </div>
  );
}

function MateriTab() {
  const [title, setTitle] = useState(''); const [url, setUrl] = useState(''); const [type, setType] = useState('link');
  const queryClient = useQueryClient();
  const { data: materiList = [] } = useQuery({ queryKey: ['materi'], queryFn: async () => { const { data } = await apiClient.get('/materi'); return data.data as any[]; } });
  const addMutation = useMutation({ mutationFn: async () => apiClient.post('/materi', { title, url, type }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materi'] }); toast.success('Materi ditambahkan!'); setTitle(''); setUrl(''); }, onError: () => toast.error('Gagal menambah materi') });
  const deleteMutation = useMutation({ mutationFn: async (id: number) => apiClient.delete(`/materi/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materi'] }); toast.success('Materi dihapus!'); } });
  return (
    <div className="space-y-4">
      <Card><h3 className="font-semibold text-sm mb-3">Tambah Materi</h3>
        <div className="space-y-3"><input type="text" placeholder="Judul" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" /><input type="text" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} className="input-field" />
          <div className="relative"><select value={type} onChange={e => setType(e.target.value)} className="select-field"><option value="link">Link</option><option value="video">Video</option><option value="dokumen">Dokumen</option></select><i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i></div>
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !title || !url} loading={addMutation.isPending} className="w-full">Simpan Tautan</Button>
        </div>
      </Card>
      <Card padding={false}><div className="px-5 py-4 border-b border-black/[0.06]"><h3 className="font-semibold text-sm">Daftar Materi</h3></div>
        {materiList.length === 0 ? <div className="text-center py-12 text-text-tertiary"><i className="fas fa-book text-2xl mb-2 block"></i>Belum ada materi</div> :
          <div className="divide-y divide-black/[0.04]">{materiList.map((m: any) => (<div key={m.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-secondary transition-colors"><div className="flex items-center gap-3"><i className={`fas ${m.type === 'video' ? 'fa-video' : m.type === 'dokumen' ? 'fa-file-alt' : 'fa-link'} text-primary`}></i><div><a href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">{m.title}</a><p className="text-xs text-text-tertiary">{m.uploaded_at ? new Date(m.uploaded_at).toLocaleDateString('id-ID') : ''}</p></div></div><button onClick={() => deleteMutation.mutate(m.id)} className="text-text-tertiary hover:text-danger"><i className="fas fa-trash"></i></button></div>))}</div>}
      </Card>
    </div>
  );
}

function KelasTab() {
  const [kelasList, setKelasList] = useState<{ name: string; student_count: number }[]>([]); const [newName, setNewName] = useState(''); const [editName, setEditName] = useState(''); const [editOrig, setEditOrig] = useState('');
  const queryClient = useQueryClient();
  const fetchKelas = () => { apiClient.get('/classes').then(({ data }: any) => { if (data.success) setKelasList(data.data); }); };
  useEffect(() => { fetchKelas(); }, []);
  const addClass = async () => { if (!newName) return; try { await apiClient.post('/classes', { name: newName }); toast.success('Kelas ditambahkan'); setNewName(''); fetchKelas(); queryClient.invalidateQueries({ queryKey: ['classes'] }); } catch (err: any) { toast.error(err?.response?.data?.error || 'Gagal'); } };
  const renameClass = async () => { if (!editName || !editOrig) return; try { await apiClient.put(`/classes/${encodeURIComponent(editOrig)}/${encodeURIComponent(editName)}`); toast.success('Kelas diubah'); setEditName(''); setEditOrig(''); fetchKelas(); queryClient.invalidateQueries({ queryKey: ['classes'] }); } catch (err: any) { toast.error(err?.response?.data?.error || 'Gagal'); } };
  const deleteClass = async (name: string) => { if (!window.confirm(`Hapus kelas ${name}?`)) return; try { await apiClient.delete(`/classes/${encodeURIComponent(name)}`); toast.success('Kelas dihapus'); fetchKelas(); queryClient.invalidateQueries({ queryKey: ['classes'] }); } catch (err: any) { toast.error(err?.response?.data?.error || 'Gagal'); } };
  return (
    <div className="space-y-4">
      <Card><h3 className="font-semibold text-sm mb-3">Tambah Kelas</h3><div className="flex gap-3"><input type="text" placeholder="Nama kelas (contoh: 7-1)" value={newName} onChange={e => setNewName(e.target.value)} className="input-field flex-1" /><Button onClick={addClass} disabled={!newName}>Tambah</Button></div></Card>
      <Card padding={false} className="overflow-hidden">
        <table className="min-w-full"><thead><tr className="bg-surface-secondary"><th className="table-header">Kelas</th><th className="table-header text-center">Jumlah Siswa</th><th className="table-header text-center">Aksi</th></tr></thead>
          <tbody>{kelasList.map(k => (<tr key={k.name} className="hover:bg-surface-secondary transition-colors"><td className="table-cell font-medium">{editOrig === k.name ? <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field w-24" autoFocus /> : k.name}</td><td className="table-cell text-center">{k.student_count}</td><td className="table-cell text-center">{editOrig === k.name ? <div className="flex gap-2 justify-center"><button onClick={renameClass} className="text-green-600 text-sm font-medium"><i className="fas fa-check mr-1"></i></button><button onClick={() => { setEditOrig(''); setEditName(''); }} className="text-text-tertiary text-sm"><i className="fas fa-times"></i></button></div> : <div className="flex gap-2 justify-center"><button onClick={() => { setEditOrig(k.name); setEditName(k.name); }} className="text-text-tertiary hover:text-primary"><i className="fas fa-edit"></i></button><button onClick={() => deleteClass(k.name)} className="text-text-tertiary hover:text-danger"><i className="fas fa-trash"></i></button></div>}</td></tr>))}</tbody>
        </table>
        {kelasList.length === 0 && <div className="text-center py-12 text-text-tertiary"><i className="fas fa-school text-2xl mb-2 block"></i>Belum ada kelas</div>}
      </Card>
    </div>
  );
}

function downloadTemplate(type: string) {
  const wb = XLSX.utils.book_new();
  let ws: XLSX.WorkSheet;
  if (type === 'siswa') {
    const data = [
      ['student_id', 'name', 'class', 'address', 'dob', 'father_name', 'father_job', 'mother_name', 'mother_job', 'phone', 'notes'],
      ['1001', 'Contoh Siswa', 'X IPA', 'Jl. Merdeka No.1', '2010-01-15', 'Ahmad', 'Petani', 'Siti', 'IRT', '08123456789', 'Catatan'],
    ];
    ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
  } else if (type === 'absensi') {
    const data = [
      ['student_id', 'event_date', 'keterangan', 'class'],
      ['1001', '2026-07-28', 'H', 'X IPA'],
      ['1002', '2026-07-28', 'S', 'X IPA'],
    ];
    ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
  } else if (type === 'nilai') {
    const data = [
      ['student_id', 'semester', 'pengetahuan_rata', 'keterampilan_rata', 'sikap_rata', 'sts', 'sas'],
      ['1001', 'Ganjil', '85', '80', 'B', '75', '78'],
      ['1002', 'Ganjil', '90', '85', 'A', '80', '82'],
    ];
    ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Nilai');
  }
  XLSX.writeFile(wb, `template-${type}.xlsx`);
}

async function exportData(type: string, selectedClass: string) {
  try {
    let data: any[] = [];
    if (type === 'siswa') {
      const res = await apiClient.get('/students');
      if (res.data.success) data = res.data.data;
      const rows = data.map((s: any) => [s.student_id, s.name, s.class, s.address || '', s.dob || '', s.father_name || '', s.father_job || '', s.mother_name || '', s.mother_job || '', s.phone || '', s.notes || '']);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['student_id', 'name', 'class', 'address', 'dob', 'father_name', 'father_job', 'mother_name', 'mother_job', 'phone', 'notes'], ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
      XLSX.writeFile(wb, `data-siswa-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else if (type === 'absensi') {
      const res = await apiClient.get('/attendance', { params: { class: selectedClass } });
      if (res.data.success) data = res.data.data;
      const rows = data.map((a: any) => [a.student_id, a.event_date, a.keterangan, a.class]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['student_id', 'event_date', 'keterangan', 'class'], ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
      XLSX.writeFile(wb, `data-absensi-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else if (type === 'nilai') {
      const res = await apiClient.get('/grades', { params: { class: selectedClass } });
      if (res.data.success) data = res.data.data;
      const rows = data.map((g: any) => [g.student_id, g.semester, g.pengetahuan_rata ?? '', g.keterampilan_rata ?? '', g.sikap_rata ?? '', g.sts ?? '', g.sas ?? '']);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['student_id', 'semester', 'pengetahuan_rata', 'keterampilan_rata', 'sikap_rata', 'sts', 'sas'], ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Nilai');
      XLSX.writeFile(wb, `data-nilai-${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
    toast.success('Data berhasil diexport');
  } catch {
    toast.error('Gagal export data');
  }
}

export default function Data() {
  const { user } = useAuth();
  const isAdm = user?.role === 'admin';
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [tab, setTab] = useState<'siswa' | 'tabungan' | 'materi' | 'guru' | 'kelas'>('siswa');
  const [teachers, setTeachers] = useState<{ id: number; name: string }[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient.get('/classes').then(({ data }: any) => {
      if (data.success) {
        const names = data.data.map((c: any) => c.name).sort();
        setAllClasses(names);
        if (!selectedClass && names.length > 0) setSelectedClass(names[0]);
      }
    }).catch((err: any) => console.error('Classes fetch error:', err));
  }, []);

  useEffect(() => {
    if (isAdm) {
      apiClient.get('/admin/users').then(({ data }: any) => {
        if (data.success) setTeachers(data.data.filter((u: any) => u.role === 'guru').map((u: any) => ({ id: u.id, name: u.name })));
      }).catch((err: any) => console.error('Teachers fetch error:', err));
    }
  }, [isAdm]);

  async function handleImport(file: File) {
    setImporting(true); setImportResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
      if (rows.length === 0) { toast.error('File kosong'); setImporting(false); return; }

      const cols = Object.keys(rows[0]);
      let endpoint = '';
      if (cols.includes('keterangan')) endpoint = '/import/attendance';
      else if (cols.includes('semester')) endpoint = '/import/grades';
      else endpoint = '/import/students';

      const res = await apiClient.post(endpoint, rows);
      if (res.data.success) {
        setImportResult(res.data.data);
        toast.success(`Import berhasil: ${res.data.data.imported} baru, ${res.data.data.updated} diupdate`);
      } else {
        toast.error('Gagal import');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      toast.error(typeof msg === 'string' ? msg : (err.message || 'Gagal import file'));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  type DataTab = 'siswa' | 'tabungan' | 'materi' | 'kelas';
  const tabs: { key: DataTab; label: string; icon: string }[] = [
    { key: 'siswa', label: 'Data Siswa', icon: 'fa-users' },
    { key: 'tabungan', label: 'Tabungan', icon: 'fa-wallet' },
    { key: 'materi', label: 'Materi', icon: 'fa-book' },
    { key: 'kelas', label: 'Kelas', icon: 'fa-school' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Data</h1>
          <p className="text-text-secondary text-sm mt-1">Kelola data siswa, tabungan, materi, dan kelas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={selectedClass || ''} onChange={e => setSelectedClass(e.target.value)} className="select-field pr-8 min-w-[120px]">
              {allClasses.length === 0 && <option value="">Pilih Kelas</option>}
              {allClasses.map(c => <option key={c} value={c}>Kelas {c}</option>)}
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
          </div>
          {tab !== 'tabungan' && tab !== 'materi' && tab !== 'kelas' && tab !== 'guru' && (
            <div className="flex gap-1">
              <button onClick={() => downloadTemplate(tab === 'siswa' ? 'siswa' : tab === 'guru' ? 'siswa' : tab)} className="px-2.5 py-2 rounded-lg text-xs font-medium bg-white border border-black/[0.06] hover:bg-surface-secondary text-text-secondary transition-colors" title="Download Template"><i className="fas fa-download mr-1"></i>Template</button>
              <button onClick={() => exportData(tab === 'siswa' ? 'siswa' : tab === 'guru' ? 'siswa' : tab, selectedClass)} className="px-2.5 py-2 rounded-lg text-xs font-medium bg-white border border-black/[0.06] hover:bg-surface-secondary text-text-secondary transition-colors" title="Export Excel"><i className="fas fa-file-export mr-1"></i>Export</button>
              <button onClick={() => setImportOpen(true)} className="px-2.5 py-2 rounded-lg text-xs font-medium bg-white border border-black/[0.06] hover:bg-surface-secondary text-text-secondary transition-colors" title="Import Excel"><i className="fas fa-file-import mr-1"></i>Import</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-black/[0.06] overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${tab === t.key ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md' : 'text-text-secondary hover:bg-black/5'}`}>
            <i className={`fas ${t.icon}`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'siswa' && <DataSiswaTab key={selectedClass} selectedClass={selectedClass} adminMode={isAdm} teachers={teachers} />}
      {tab === 'tabungan' && <TabunganTab key={selectedClass} selectedClass={selectedClass} />}
      {tab === 'materi' && <MateriTab />}
      {tab === 'kelas' && <KelasTab />}

      <Modal open={importOpen} onClose={() => { if (!importing) { setImportOpen(false); setImportResult(null); } }} title="Import Data dari Excel">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Upload file Excel (.xlsx) dengan format yang sesuai. Gunakan tombol <strong>Template</strong> untuk mendownload contoh format.</p>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
            <i className="fas fa-cloud-upload-alt text-3xl text-text-tertiary mb-2 block"></i>
            <p className="text-sm font-medium text-text-secondary">Klik untuk pilih file</p>
            <p className="text-xs text-text-tertiary mt-1">.xlsx atau .xls</p>
          </div>
          {importing && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <i className="fas fa-spinner fa-spin"></i> Mengimport data...
            </div>
          )}
          {importResult && (
            <div className="bg-soft-green rounded-2xl p-4 text-sm text-green-700">
              <i className="fas fa-check-circle mr-2"></i>
              Import selesai: {importResult.imported} data baru, {importResult.updated} data diupdate
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setImportOpen(false); setImportResult(null); }} disabled={importing}>Tutup</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
