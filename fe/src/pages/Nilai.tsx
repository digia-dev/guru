import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { Student, Grade, Subject, SemesterGrade, AcademicYear } from '../types';
import { useAuth } from '../context/AuthContext';
import { useClasses } from '../hooks/useClasses';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { hitungBabRata, hitungSikapRata, hitungOverallRata, ambilNilai } from '../utils/grades';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Nilai() {
  const { user } = useAuth();
  const { classes } = useClasses();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('');
  useEffect(() => { if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]); }, [classes, selectedClass]);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(() => new Date().getMonth() + 1 >= 7 ? 'Ganjil' : 'Genap');
  const [tahunAjaran, setTahunAjaran] = useState('');
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => { const { data } = await apiClient.get('/academic-years'); return (data.data || []) as AcademicYear[]; },
  });
  useEffect(() => { if (academicYears.length > 0 && !tahunAjaran) setTahunAjaran(String(academicYears.find(y => y.is_active)?.id || academicYears[0].id)); }, [academicYears, tahunAjaran]);
  const [bab, setBab] = useState<string>('all');
  const [gradeChanges, setGradeChanges] = useState<Map<string, any>>(new Map());

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  useEffect(() => {
    apiClient.get('/subjects').then((res: any) => {
      if (res.data.success) setAllSubjects(res.data.data);
    });
  }, []);
  const teacherSubjects = user?.role === 'admin' ? allSubjects : allSubjects.filter(s => (user?.teacher_subjects || []).includes(s.code));
  useEffect(() => {
    if (teacherSubjects.length > 0 && !selectedSubject) setSelectedSubject(teacherSubjects[0].code);
  }, [user?.teacher_subjects, allSubjects]);

  const { data: students = [] } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: async () => { const { data } = await apiClient.get(`/students?class=${selectedClass}`); return data.data as Student[]; },
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades', selectedClass, semester, tahunAjaran, selectedSubject],
    queryFn: async () => {
      const subjectId = allSubjects.find(s => s.code === selectedSubject)?.id;
      const params = `class=${selectedClass}&semester=${semester}${subjectId ? `&subject_id=${subjectId}` : ''}`;
      const { data } = await apiClient.get(`/grades?${params}`);
      return data.data as Grade[];
    },
  });

  const gradeMap = new Map(grades.map((g) => [g.student_id, g]));

  const subjectId = allSubjects.find(s => s.code === selectedSubject)?.id;
  const { data: semesterData = [] } = useQuery({
    queryKey: ['semester-grades-summary', selectedClass, semester, selectedSubject],
    queryFn: async () => {
      const params = `class=${selectedClass}&semester=${semester}${subjectId ? `&subject_id=${subjectId}` : ''}`;
      const { data } = await apiClient.get(`/grades/semester?${params}`);
      return data.data as SemesterGrade[];
    },
    enabled: !!selectedClass && !!subjectId,
  });
  const semesterMap = new Map(semesterData.map((d: any) => [d.student_id, d]));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const doSave = async () => {
    if (gradeChanges.size === 0) return;
    setSaveStatus('saving');
    try {
      const batch = Array.from(gradeChanges.values()).map((change) => {
        const studentId = change.student_id;
        const g = gradeMap.get(studentId);
        for (let b = 1; b <= 4; b++) {
          const babSaved = (g as any)?.[`bab_${b}`] || {};
          const babChanged = change[`bab_${b}`] || {};
          const babFull = { ...babSaved, ...babChanged };
          babFull.pengetahuan_rata = hitungBabRata(babFull, 'pengetahuan');
          babFull.keterampilan_rata = hitungBabRata(babFull, 'keterampilan');
          change[`bab_${b}`] = babFull;
        }
        const overall = hitungOverallRata(g, gradeChanges, studentId);
        change.pengetahuan_rata = overall.pengetahuan_rata;
        change.keterampilan_rata = overall.keterampilan_rata;
        change.sikap_rata = hitungSikapRata(
          ambilNilai(gradeMap, gradeChanges, studentId, 'sikap_jujur'),
          ambilNilai(gradeMap, gradeChanges, studentId, 'sikap_disiplin'),
          ambilNilai(gradeMap, gradeChanges, studentId, 'sikap_tgg_jawab'),
        );
        const subjectId = allSubjects.find(s => s.code === selectedSubject)?.id || null;
        return { ...change, subject_id: subjectId };
      });
      await apiClient.post('/grades/batch', batch);
      await queryClient.refetchQueries({ queryKey: ['grades'] });
      setSaveStatus('saved');
      setGradeChanges(new Map());
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch { setSaveStatus('error'); toast.error('Gagal menyimpan nilai'); }
  };

  const { schedule, saveNow } = useAutoSave(doSave, 5000);

  useKeyboardShortcuts({ save: () => { if (gradeChanges.size > 0) saveNow(); } });

  const handleInput = (studentId: string, babKey: string, field: string, value: string) => {
    setGradeChanges(prev => {
      const next = new Map(prev);
      const existing = next.get(studentId) || { student_id: studentId, semester };
      const newBab = { ...existing[babKey], [field]: value };
      const merged = { ...(gradeMap.get(studentId) as any)?.[babKey] || {}, ...newBab };
      newBab.pengetahuan_rata = hitungBabRata(merged, 'pengetahuan');
      newBab.keterampilan_rata = hitungBabRata(merged, 'keterampilan');
      next.set(studentId, { ...existing, [babKey]: newBab });
      schedule();
      return next;
    });
  };

  const handleSikapInput = (studentId: string, field: string, value: string) => {
    setGradeChanges(prev => {
      const next = new Map(prev);
      const existing = next.get(studentId) || { student_id: studentId, semester };
      next.set(studentId, { ...existing, [field]: value });
      schedule();
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon="fa-chart-line" onClick={() => navigate('/app/penilaian-semester')}>Nilai Semester</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Kelas</label>
            <div className="relative">
              <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setGradeChanges(new Map()); }} className="select-field">
                {classes.map((c) => <option key={c} value={c}>Kelas {c}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
            </div>
          </div>
          <div>
            <label className="label">Semester</label>
            <div className="relative">
              <select value={semester} onChange={(e) => { setSemester(e.target.value as any); setGradeChanges(new Map()); }} className="select-field">
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
            </div>
          </div>
          <div>
            <label className="label">Tahun Ajaran</label>
            <div className="relative">
              <select value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)} className="select-field">
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
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
                <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setGradeChanges(new Map()); }} className="select-field">
                  {teacherSubjects.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-nowrap gap-1.5 mt-4">
          {['all', '1', '2', '3', '4'].map((b) => (
            <button key={b} onClick={() => setBab(b)} className={`${bab === b ? 'chip-active' : 'chip-inactive'} !px-2 !py-1 !text-[10px]`}>
              {b === 'all' ? 'Semua BAB' : `BAB ${b}`}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 mt-3">
          {saveStatus !== 'idle' && (
            <span className={`ml-auto text-xs font-medium px-3 py-1.5 rounded-full self-center ${
              saveStatus === 'saving' ? 'bg-soft-purple text-primary' :
              saveStatus === 'saved' ? 'bg-soft-green text-green-600' : 'bg-red-50 text-red-500'
            }`}>
              {saveStatus === 'saving' ? <><i className="fas fa-spinner fa-spin mr-1"></i>Menyimpan...</> :
               saveStatus === 'saved' ? <><i className="fas fa-check-circle mr-1"></i>Tersimpan</> :
               <><i className="fas fa-exclamation-circle mr-1"></i>Gagal</>}
            </span>
          )}
        </div>
      </Card>

      {/* Grade Table */}
      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              {bab === 'all' ? (
                <tr className="bg-surface-secondary">
                  <th className="table-header sticky left-0 bg-surface-secondary z-10 min-w-[100px] sm:min-w-[160px]">Nama Siswa</th>
                  <th className="table-header text-center">Rata Pengetahuan</th>
                  <th className="table-header text-center">Rata Keterampilan</th>
                  <th className="table-header text-center">Rata Sikap</th>
                  <th className="table-header text-center">Rata Harian</th>
                </tr>
              ) : (
                <>
                  <tr className="bg-surface-secondary">
                    <th className="table-header sticky left-0 bg-surface-secondary z-10 min-w-[160px]" rowSpan={2}>Nama Siswa</th>
                    <th className="table-header text-center" colSpan={6}>Pengetahuan (BAB {bab})</th>
                    <th className="table-header text-center" colSpan={6}>Keterampilan (BAB {bab})</th>
                    <th className="table-header text-center" colSpan={4}>Sikap</th>
                  </tr>
                  <tr className="bg-surface-secondary">
                    {['P1','P2','P3','P4','P5','Rata'].map(h => <th key={h} className="table-header text-center min-w-[56px]">{h}</th>)}
                    {['K1','K2','K3','K4','K5','Rata'].map(h => <th key={h} className="table-header text-center min-w-[56px]">{h}</th>)}
                    {['Jujur','Disiplin','Tgg Jawab','Rata'].map(h => <th key={h} className="table-header text-center min-w-[56px]">{h}</th>)}
                  </tr>
                </>
              )}
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={bab === 'all' ? 5 : 17} className="text-center py-12 text-text-tertiary">
                    <i className="fas fa-users text-2xl mb-2 block"></i>
                    Tidak ada siswa di kelas ini
                  </td>
                </tr>
              ) : [...students].sort((a, b) => a.name.localeCompare(b.name)).map((student) => {
                if (bab === 'all') {
                  const overall = hitungOverallRata(gradeMap.get(student.student_id), gradeChanges, student.student_id);
                  const sRata = hitungSikapRata(
                    ambilNilai(gradeMap, gradeChanges, student.student_id, 'sikap_jujur'),
                    ambilNilai(gradeMap, gradeChanges, student.student_id, 'sikap_disiplin'),
                    ambilNilai(gradeMap, gradeChanges, student.student_id, 'sikap_tgg_jawab'),
                  );
                  const sd = semesterMap.get(student.student_id);
                  const rataHarian = sd?.rata_harian ?? null;
                  const p = overall.pengetahuan_rata, k = overall.keterampilan_rata, s = sRata;
                  return (
                    <tr key={student.student_id} className="hover:bg-surface-secondary transition-colors">
                      <td className="table-cell sticky left-0 bg-white z-10 font-medium">{student.name}</td>
                      <td className="table-cell text-center font-bold bg-surface-secondary/50">{p ?? '-'}</td>
                      <td className="table-cell text-center font-bold bg-surface-secondary/50">{k ?? '-'}</td>
                      <td className="table-cell text-center font-bold bg-surface-secondary/50">{s ?? '-'}</td>
                      <td className="table-cell text-center font-bold text-primary bg-soft-purple">{rataHarian ?? '-'}</td>
                    </tr>
                  );
                }
                const g = gradeMap.get(student.student_id);
                const babData = { ...(g as any)?.[`bab_${bab}`] || {}, ...gradeChanges.get(student.student_id)?.[`bab_${bab}`] || {} };
                const sJujur = ambilNilai(gradeMap, gradeChanges, student.student_id, 'sikap_jujur');
                const sDisiplin = ambilNilai(gradeMap, gradeChanges, student.student_id, 'sikap_disiplin');
                const sTgg = ambilNilai(gradeMap, gradeChanges, student.student_id, 'sikap_tgg_jawab');
                const sRata = hitungSikapRata(sJujur, sDisiplin, sTgg);
                return (
                  <tr key={student.student_id} className="hover:bg-surface-secondary transition-colors">
                    <td className="table-cell sticky left-0 bg-white z-10 font-medium">{student.name}</td>
                    {[1,2,3,4,5].map(i => (
                      <td key={`p${i}`} className="table-cell text-center">
                        <input type="number" inputMode="numeric" className="grade-input" min="0" max="100" value={babData[`pengetahuan_${i}`] ?? ''} onChange={(e) => handleInput(student.student_id, `bab_${bab}`, `pengetahuan_${i}`, e.target.value)} />
                      </td>
                    ))}
                    <td className="table-cell text-center font-bold bg-surface-secondary/50">{hitungBabRata(babData, 'pengetahuan') ?? '-'}</td>
                    {[1,2,3,4,5].map(i => (
                      <td key={`k${i}`} className="table-cell text-center">
                        <input type="number" inputMode="numeric" className="grade-input" min="0" max="100" value={babData[`keterampilan_${i}`] ?? ''} onChange={(e) => handleInput(student.student_id, `bab_${bab}`, `keterampilan_${i}`, e.target.value)} />
                      </td>
                    ))}
                    <td className="table-cell text-center font-bold bg-surface-secondary/50">{hitungBabRata(babData, 'keterampilan') ?? '-'}</td>
                    {[sJujur, sDisiplin, sTgg].map((val, idx) => (
                      <td key={idx} className="table-cell text-center">
                        <input type="number" inputMode="numeric" className="grade-input" min="0" max="100" value={val} onChange={(e) => handleSikapInput(student.student_id, ['sikap_jujur','sikap_disiplin','sikap_tgg_jawab'][idx], e.target.value)} />
                      </td>
                    ))}
                    <td className="table-cell text-center font-bold bg-surface-secondary/50">{sRata ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {gradeChanges.size > 0 && (
        <button onClick={() => saveNow()} disabled={saveStatus === 'saving'}
          className={`floating-save-btn text-white disabled:opacity-50 ${saveStatus === 'error' ? 'bg-danger' : 'bg-gradient-to-r from-violet-600 to-indigo-500'}`}>
          {saveStatus === 'saving' ? <i className="fas fa-spinner fa-spin text-base"></i> : saveStatus === 'saved' ? <i className="fas fa-check text-base"></i> : <i className="fas fa-save text-base"></i>}
        </button>
      )}
    </div>
  );
}
