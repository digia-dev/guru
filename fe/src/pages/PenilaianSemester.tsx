import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { SemesterGrade, Subject } from '../types';
import { useAuth } from '../context/AuthContext';
import { useClasses } from '../hooks/useClasses';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';

export default function PenilaianSemester() {
  const { user } = useAuth();
  const { classes } = useClasses();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('');
  useEffect(() => { if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]); }, [classes, selectedClass]);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(() => { const m = new Date().getMonth() + 1; return m >= 7 ? 'Ganjil' : 'Genap'; });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [stsChanges, setStsChanges] = useState<Map<string, { sts: string; sas: string; student_id: string; semester: string }>>(new Map());

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  useEffect(() => {
    apiClient.get('/subjects').then(res => {
      if (res.data.success) setAllSubjects(res.data.data);
    });
  }, []);
  const teacherSubjects = user?.role === 'admin' ? allSubjects : allSubjects.filter(s => (user?.teacher_subjects || []).includes(s.code));
  useEffect(() => {
    if (teacherSubjects.length > 0 && !selectedSubject) setSelectedSubject(teacherSubjects[0].code);
  }, [user?.teacher_subjects, allSubjects]);

  const { data: semesterData = [], isFetching } = useQuery({
    queryKey: ['semester-grades', selectedClass, semester, selectedSubject],
    queryFn: async () => {
      const subjectId = allSubjects.find(s => s.code === selectedSubject)?.id;
      const params = `class=${selectedClass}&semester=${semester}${subjectId ? `&subject_id=${subjectId}` : ''}`;
      const { data } = await apiClient.get(`/grades/semester?${params}`);
      return data.data as SemesterGrade[];
    },
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const doSave = async () => {
    if (stsChanges.size === 0) return;
    setSaveStatus('saving');
    try {
      const subjectId = allSubjects.find(s => s.code === selectedSubject)?.id || null;
      const batch = Array.from(stsChanges.values()).map((c) => ({
        student_id: c.student_id, semester: c.semester, subject_id: subjectId,
        sts: c.sts ? parseFloat(c.sts) : null, sas: c.sas ? parseFloat(c.sas) : null,
      }));
      await apiClient.post('/grades/batch', batch);
      await queryClient.refetchQueries({ queryKey: ['semester-grades'] });
      setSaveStatus('saved'); setStsChanges(new Map());
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch { setSaveStatus('error'); toast.error('Gagal menyimpan'); }
  };

  const { schedule, saveNow } = useAutoSave(doSave, 5000);
  useKeyboardShortcuts({ save: () => { if (stsChanges.size > 0) saveNow(); } });

  const handleInput = (studentId: string, field: 'sts' | 'sas', value: string) => {
    setStsChanges(prev => {
      const next = new Map(prev);
      const existing = next.get(studentId);
      next.set(studentId, { student_id: studentId, semester, sts: field === 'sts' ? value : (existing?.sts ?? ''), sas: field === 'sas' ? value : (existing?.sas ?? '') });
      schedule(); return next;
    });
  };

  const getField = (item: SemesterGrade, field: 'sts' | 'sas') => {
    const change = stsChanges.get(item.student_id);
    if (change && change[field] !== '') return change[field];
    return item[field] ?? '';
  };

  function hitungNilaiRapor(item: SemesterGrade) {
    const harian = item.rata_harian || 0;
    const sts = parseFloat(String(getField(item, 'sts'))) || 0;
    const sas = parseFloat(String(getField(item, 'sas'))) || 0;
    const kehadiran = parseInt(item.rata_kehadiran) || 0;
    return Math.round((harian * 0.5) + (sts * 0.1) + (sas * 0.2) + (kehadiran * 0.2));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Nilai Semester</h1>
          <p className="text-text-secondary text-sm mt-1">Kelola STS, SAS, dan nilai rapor</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon="fa-star" onClick={() => navigate('/app/nilai')}>Nilai Harian</Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Kelas</label>
            <div className="relative">
              <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setStsChanges(new Map()); }} className="select-field">
                {classes.map((c) => <option key={c} value={c}>Kelas {c}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
            </div>
          </div>
          <div>
            <label className="label">Mata Pelajaran</label>
            {teacherSubjects.length <= 1 ? (
              <div className="input-field bg-surface-secondary text-text-primary cursor-default flex items-center">
                {teacherSubjects[0]?.name || '-'}
              </div>
            ) : (
              <div className="relative">
                <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setStsChanges(new Map()); }} className="select-field">
                  {teacherSubjects.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
              </div>
            )}
          </div>
          <div>
            <label className="label">Semester</label>
            <div className="relative">
              <select value={semester} onChange={(e) => { setSemester(e.target.value as any); setStsChanges(new Map()); }} className="select-field">
                <option value="Ganjil">Semester Ganjil 2026/2027</option>
                <option value="Genap">Semester Genap 2026/2027</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
            </div>
          </div>
        </div>
      </Card>

      {isFetching ? <TableSkeleton rows={5} /> : (
        <Card padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-surface-secondary">
                  <th className="table-header sticky left-0 bg-surface-secondary z-10 min-w-[160px]">
                    Nama Siswa
                    <span className="block text-[10px] font-normal text-text-tertiary mt-0.5">Rumus: (Harian×0.5)+(STS×0.1)+(SAS×0.2)+(Kehadiran×0.2)</span>
                  </th>
                  <th className="table-header text-center w-24">Rata Harian</th>
                  <th className="table-header text-center w-24">Kehadiran</th>
                  <th className="table-header text-center w-24">STS</th>
                  <th className="table-header text-center w-24">SAS</th>
                  <th className="table-header text-center w-24">Nilai Rapor</th>
                </tr>
              </thead>
              <tbody>
                {semesterData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-text-tertiary">
                    <i className="fas fa-chart-line text-2xl mb-2 block"></i>
                    Tidak ada data semester
                  </td></tr>
                ) : semesterData.map((item) => (
                  <tr key={item.student_id} className="hover:bg-surface-secondary transition-colors">
                    <td className="table-cell sticky left-0 bg-white z-10 font-medium">{item.name}</td>
                    <td className="table-cell text-center font-medium">{item.rata_harian ?? '-'}</td>
                    <td className="table-cell text-center font-medium">{item.rata_kehadiran && item.rata_kehadiran !== '0%' ? item.rata_kehadiran : '-'}</td>
                    <td className="table-cell text-center">
                      <input type="number" step="0.1" className="grade-input" placeholder="-" value={getField(item, 'sts')} onChange={(e) => handleInput(item.student_id, 'sts', e.target.value)} />
                    </td>
                    <td className="table-cell text-center">
                      <input type="number" step="0.1" className="grade-input" placeholder="-" value={getField(item, 'sas')} onChange={(e) => handleInput(item.student_id, 'sas', e.target.value)} />
                    </td>
                    <td className="table-cell text-center font-bold text-primary bg-soft-purple">{hitungNilaiRapor(item) || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {saveStatus !== 'idle' && (
        <div className={`text-center text-xs py-2 px-4 rounded-2xl inline-block mx-auto ${
          saveStatus === 'saving' ? 'bg-soft-purple text-primary' :
          saveStatus === 'saved' ? 'bg-soft-green text-green-600' : 'bg-red-50 text-red-500'
        }`}>
          {saveStatus === 'saving' ? <><i className="fas fa-spinner fa-spin mr-1"></i>Menyimpan...</> :
           saveStatus === 'saved' ? <><i className="fas fa-check-circle mr-1"></i>Tersimpan</> :
           <><i className="fas fa-exclamation-circle mr-1"></i>Gagal menyimpan</>}
        </div>
      )}

      {stsChanges.size > 0 && (
        <button onClick={() => saveNow()} disabled={saveStatus === 'saving'}
          className={`floating-save-btn text-white disabled:opacity-50 ${saveStatus === 'error' ? 'bg-danger' : 'bg-gradient-to-r from-violet-600 to-indigo-500'}`}>
          {saveStatus === 'saving' ? <i className="fas fa-spinner fa-spin text-xl"></i> : saveStatus === 'saved' ? <i className="fas fa-check text-xl"></i> : <i className="fas fa-save text-xl"></i>}
        </button>
      )}
    </div>
  );
}
