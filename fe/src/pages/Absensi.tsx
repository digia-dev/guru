import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { Student, AttendanceBatchRecord, Subject } from '../types';
import { useAuth } from '../context/AuthContext';
import { useClasses } from '../hooks/useClasses';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ATTENDANCE_STATUS = ['H', 'S', 'I', 'A'] as const;

export default function Absensi() {
  const { user } = useAuth();
  const { classes } = useClasses();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState('');
  useEffect(() => { if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]); }, [classes, selectedClass]);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(() => new Date().getMonth() + 1 >= 7 ? 'Ganjil' : 'Genap');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [selectedSubject, setSelectedSubject] = useState('');
  const [changes, setChanges] = useState<Map<string, { keterangan: 'H' | 'S' | 'I' | 'A' | null; name: string }>>(new Map());

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
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

  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', selectedClass, selectedDate, selectedSubject],
    queryFn: async () => {
      const subjectId = allSubjects.find(s => s.code === selectedSubject)?.id;
      const params = `class=${selectedClass}&event_date=${selectedDate}${subjectId ? `&subject_id=${subjectId}` : ''}`;
      const { data } = await apiClient.get(`/attendance?${params}`);
      return data.data as any[];
    },
  });

  const { data: semesterAtt } = useQuery({
    queryKey: ['semester-attendance', selectedClass, semester],
    queryFn: async () => {
      const { data } = await apiClient.get(`/attendance/semester-summary?class=${encodeURIComponent(selectedClass)}&semester=${semester}`);
      return data.data as Array<{ student_id: string; hadir_pct: number }>;
    },
    enabled: !!selectedClass,
  });
  const semAttMap = new Map(semesterAtt?.map((a: any) => [a.student_id, a.hadir_pct]) || []);

  const attendanceMap = new Map(existingAttendance?.map((a: any) => [a.student_id, a.keterangan]) || []);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const doSave = async () => {
    if (changes.size === 0) return;
    setSaveStatus('saving');
    try {
      const records: AttendanceBatchRecord[] = [];
      changes.forEach((change, studentId) => {
        records.push({ student_id: studentId, name: change.name, keterangan: change.keterangan });
      });
      if (records.length === 0) { setSaveStatus('idle'); return; }
      const subjectId = allSubjects.find(s => s.code === selectedSubject)?.id || null;
      await apiClient.post('/attendance/batch', { class: selectedClass, event_date: selectedDate, subject_id: subjectId, records });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['semester-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSaveStatus('saved');
      setChanges(new Map());
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      const msg = err?.response?.data?.error || err?.message || 'Gagal menyimpan absensi';
      toast.error(Array.isArray(msg) ? msg.map((e: any) => e.message || e).join(', ') : String(msg));
    }
  };

  const { schedule, saveNow } = useAutoSave(doSave, 5000);

  const getStatus = (studentId: string): string | null => {
    if (changes.has(studentId)) return changes.get(studentId)!.keterangan;
    return attendanceMap.get(studentId) || null;
  };

  const triggerChange = (updater: (prev: Map<string, { keterangan: 'H' | 'S' | 'I' | 'A' | null; name: string }>) => Map<string, { keterangan: 'H' | 'S' | 'I' | 'A' | null; name: string }>) => {
    setChanges(prev => { const next = updater(prev); if (next.size > 0) schedule(); return next; });
  };

  const setStatus = (studentId: string, status: 'H' | 'S' | 'I' | 'A', studentName: string) => {
    triggerChange(prev => {
      const next = new Map(prev);
      const current = next.get(studentId);
      if (current?.keterangan === status) next.delete(studentId);
      else next.set(studentId, { keterangan: status, name: studentName });
      return next;
    });
  };

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      if (!newStudentId || !newStudentName || !selectedClass) throw new Error('Lengkapi data');
      await apiClient.post('/students', { student_id: newStudentId, name: newStudentName, class: selectedClass });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['students'] }); toast.success('Siswa ditambahkan!'); setNewStudentId(''); setNewStudentName(''); setShowAddStudent(false); },
    onError: (err: any) => { const e = err?.response?.data?.error; toast.error(Array.isArray(e) ? e.map((x: any) => x.message).join(', ') : (e || 'Gagal menambah')); },
  });

  const bulkHadir = () => {
    triggerChange(prev => { const next = new Map(prev); students.forEach((s) => { if (!getStatus(s.student_id)) next.set(s.student_id, { keterangan: 'H', name: s.name }); }); return next; });
    toast.success('Siswa tanpa status ditandai hadir');
  };

  const resetAll = () => {
    triggerChange(prev => { const next = new Map(prev); students.forEach((s) => next.set(s.student_id, { keterangan: null, name: s.name })); return next; });
    toast.success('Semua status dihapus');
  };

  useKeyboardShortcuts({
    save: () => { if (changes.size > 0) saveNow(); },
  });

  const counts = { H: 0, S: 0, I: 0, A: 0 };
  students.forEach((s) => { const st = getStatus(s.student_id); if (st && st in counts) counts[st as keyof typeof counts]++; });
  const total = students.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div>
          <label className="label">Kelas</label>
          <div className="relative">
            <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setChanges(new Map()); }} className="select-field appearance-none">
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
              <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setChanges(new Map()); }} className="select-field">
                {teacherSubjects.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
            </div>
          )}
        </div>
        <div>
          <label className="label">Semester</label>
          <div className="relative">
            <select value={semester} onChange={(e) => { setSemester(e.target.value as any); setChanges(new Map()); }} className="select-field">
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
          </div>
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setChanges(new Map()); }} className="input-field" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Hadir', value: counts.H, color: 'bg-soft-green text-green-600', bar: 'bg-success' },
          { label: 'Sakit', value: counts.S, color: 'bg-soft-orange text-orange-500', bar: 'bg-warning' },
          { label: 'Izin', value: counts.I, color: 'bg-soft-blue text-blue-500', bar: 'bg-info' },
          { label: 'Alfa', value: counts.A, color: 'bg-red-50 text-red-500', bar: 'bg-danger' },
          { label: 'Total', value: total, color: 'bg-soft-purple text-primary', bar: 'bg-primary' },
        ].map((item) => (
          <div key={item.label} className="text-center bg-white rounded-xl border border-black/[0.06] p-2.5">
            <div className={`text-base font-bold ${item.color.split(' ')[1]}`}>{item.value}</div>
            <div className="text-[10px] font-medium text-text-tertiary mt-0.5">{item.label}</div>
            <div className="progress-bar mt-1.5">
              <div className={`progress-bar-fill ${item.bar}`} style={{ width: total > 0 ? `${(item.value / total) * 100}%` : '0%' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button icon="fa-check-double" onClick={bulkHadir} size="sm">Semua Hadir</Button>
        <Button variant="ghost" icon="fa-undo" onClick={resetAll} size="sm">Reset</Button>
        {saveStatus !== 'idle' && (
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
            saveStatus === 'saving' ? 'bg-soft-purple text-primary' :
            saveStatus === 'saved' ? 'bg-soft-green text-green-600' : 'bg-red-50 text-red-500'
          }`}>
            {saveStatus === 'saving' ? <><i className="fas fa-spinner fa-spin mr-1"></i>Menyimpan...</> :
             saveStatus === 'saved' ? <><i className="fas fa-check-circle mr-1"></i>Tersimpan otomatis</> :
             <><i className="fas fa-exclamation-circle mr-1"></i>Gagal menyimpan</>}
          </span>
        )}
      </div>

      {/* Student List */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <h2 className="font-semibold">Daftar Siswa</h2>
          <span className="text-xs text-text-tertiary">{students.length} siswa</span>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {[...students].sort((a, b) => a.name.localeCompare(b.name)).map((student, idx) => {
            const status = getStatus(student.student_id);
            return (
              <div key={student.student_id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-secondary transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-text-tertiary w-6 flex-shrink-0">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-[11px] text-text-tertiary">{student.student_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center hidden sm:block">
                    <div className="text-[10px] text-text-tertiary">Kehadiran Semester</div>
                    <div className={`text-xs font-bold ${(semAttMap.get(student.student_id) ?? 0) >= 75 ? 'text-success' : 'text-danger'}`}>
                      {semAttMap.get(student.student_id) != null ? `${semAttMap.get(student.student_id)}%` : '-'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ATTENDANCE_STATUS.map((s) => (
                      <button
                        key={s}
                        className={`attendance-btn ${status === s ? 'active' : ''} cursor-pointer active:scale-90`}
                        data-status={s}
                        onClick={() => setStatus(student.student_id, s, student.name)}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {students.length === 0 && (
            <div className="text-center py-12 text-text-tertiary">
              <i className="fas fa-users text-3xl mb-3"></i>
              <p className="text-sm">Tidak ada siswa di kelas ini</p>
            </div>
          )}
        </div>
      </Card>

      {/* Floating Save */}
      {changes.size > 0 && (
        <button
          onClick={() => saveNow()}
          disabled={saveStatus === 'saving'}
          className={`floating-save-btn text-white disabled:opacity-50 shadow-apple-lg ${saveStatus === 'error' ? 'bg-danger' : 'bg-gradient-to-r from-violet-600 to-indigo-500'}`}
        >
          {saveStatus === 'saving' ? <i className="fas fa-spinner fa-spin text-base"></i> :
           saveStatus === 'saved' ? <i className="fas fa-check text-base"></i> :
           <i className="fas fa-save text-base"></i>}
        </button>
      )}
    </div>
  );
}
