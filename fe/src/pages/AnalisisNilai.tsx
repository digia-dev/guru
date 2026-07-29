import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Subject } from '../types';
import { useAuth } from '../context/AuthContext';
import { useClasses } from '../hooks/useClasses';
import Card from '../components/ui/Card';

const KKM_COLORS = ['bg-emerald-100 text-emerald-700 border-emerald-300', 'bg-blue-100 text-blue-700 border-blue-300', 'bg-amber-100 text-amber-700 border-amber-300', 'bg-rose-100 text-rose-700 border-rose-300', 'bg-purple-100 text-purple-700 border-purple-300'];

export default function AnalisisNilai() {
  const { user } = useAuth();
  const { classes } = useClasses();
  const [selectedClass, setSelectedClass] = useState('');
  useEffect(() => { if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]); }, [classes, selectedClass]);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(() => new Date().getMonth() + 1 >= 7 ? 'Ganjil' : 'Genap');
  const [selectedSubject, setSelectedSubject] = useState('');

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

  const subjectId = allSubjects.find(s => s.code === selectedSubject)?.id;
  const kkm = allSubjects.find(s => s.code === selectedSubject)?.description ? 75 : 75;

  const { data: result, isFetching } = useQuery({
    queryKey: ['analytics', selectedClass, semester, subjectId],
    queryFn: async () => {
      if (!selectedClass || !subjectId) return null;
      const { data } = await apiClient.get(`/analytics?class=${encodeURIComponent(selectedClass)}&semester=${semester}&subject_id=${subjectId}`);
      return data.data as {
        kkm: number; total_students: number; below_kkm: number;
        class_averages: { pengetahuan_rata: number | null; keterampilan_rata: number | null; sikap_rata: number | null; sts: number | null; sas: number | null };
        ranking: Array<{ rank: number; student_id: string; name: string; pengetahuan_rata: number | null; keterampilan_rata: number | null; sikap_rata: number | null; sts: number | null; sas: number | null; average: number }>;
      };
    },
    enabled: !!selectedClass && !!subjectId,
  });

  const barMax = result ? Math.max(...result.ranking.map(r => r.average), result.kkm + 10, 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Kelas</label>
          <div className="relative">
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="select-field">
              {classes.map(c => <option key={c} value={c}>Kelas {c}</option>)}
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
          </div>
        </div>
        <div>
          <label className="label">Semester</label>
          <div className="relative">
            <select value={semester} onChange={e => setSemester(e.target.value as any)} className="select-field">
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
          </div>
        </div>
        <div>
          <label className="label">Mata Pelajaran</label>
          <div className="relative">
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="select-field">
              {teacherSubjects.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
          </div>
        </div>
      </div>

      {isFetching && (
        <div className="flex items-center justify-center py-12">
          <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
        </div>
      )}

      {result && !isFetching && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="!p-4">
              <p className="text-xs text-text-tertiary font-medium">Total Siswa</p>
              <p className="text-2xl font-bold mt-1">{result.total_students}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs text-text-tertiary font-medium">KKM</p>
              <p className="text-2xl font-bold mt-1 text-primary">{result.kkm}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs text-text-tertiary font-medium">Di Bawah KKM</p>
              <p className={`text-2xl font-bold mt-1 ${result.below_kkm > 0 ? 'text-danger' : 'text-success'}`}>{result.below_kkm}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs text-text-tertiary font-medium">Rata-rata Kelas</p>
              <p className="text-2xl font-bold mt-1">{result.class_averages.pengetahuan_rata !== null ? Math.round((result.class_averages.pengetahuan_rata! + (result.class_averages.keterampilan_rata ?? 0)) / 2) : '-'}</p>
            </Card>
          </div>

          {/* Class Averages */}
          <Card>
            <h3 className="font-semibold mb-4">Rata-rata Kelas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Pengetahuan', value: result.class_averages.pengetahuan_rata, color: 'bg-blue-500' },
                { label: 'Keterampilan', value: result.class_averages.keterampilan_rata, color: 'bg-emerald-500' },
                { label: 'Sikap', value: result.class_averages.sikap_rata, color: 'bg-amber-500' },
                { label: 'STS', value: result.class_averages.sts, color: 'bg-purple-500' },
                { label: 'SAS', value: result.class_averages.sas, color: 'bg-rose-500' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="text-xs text-text-tertiary mb-1">{item.label}</div>
                  <div className="text-lg font-bold">{item.value !== null ? item.value : '-'}</div>
                  <div className="progress-bar mt-1.5">
                    <div className={`progress-bar-fill ${item.color}`} style={{ width: `${((item.value ?? 0) / 100) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Ranking Chart */}
          <Card>
            <h3 className="font-semibold mb-4">Ranking Siswa</h3>
            <div className="space-y-1">
              {result.ranking.map((r, i) => {
                const pct = (r.average / barMax) * 100;
                const below = r.average < result.kkm;
                return (
                  <div key={r.student_id} className="flex items-center gap-3 py-1.5">
                    <span className={`w-6 text-center text-xs font-bold ${i < 3 ? 'text-primary' : 'text-text-tertiary'}`}>
                      {i === 0 ? <i className="fas fa-trophy text-amber-500"></i> : i === 1 ? <i className="fas fa-medal text-gray-400"></i> : i === 2 ? <i className="fas fa-medal text-orange-400"></i> : r.rank}
                    </span>
                    <span className="text-sm flex-1 truncate">{r.name}</span>
                    <div className="flex-1 max-w-[200px]">
                      <div className="progress-bar">
                        <div className={`progress-bar-fill ${below ? 'bg-danger' : 'bg-primary'} transition-all`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold w-10 text-right ${below ? 'text-danger' : ''}`}>{r.average}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Ranking Table */}
          <Card padding={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-surface-secondary">
                    <th className="table-header w-12 text-center">#</th>
                    <th className="table-header min-w-[140px]">Nama</th>
                    <th className="table-header text-center">Pengetahuan</th>
                    <th className="table-header text-center">Keterampilan</th>
                    <th className="table-header text-center">Sikap</th>
                    <th className="table-header text-center">STS</th>
                    <th className="table-header text-center">SAS</th>
                    <th className="table-header text-center">Rata-rata</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ranking.map(r => (
                    <tr key={r.student_id} className={`hover:bg-surface-secondary transition-colors ${r.average < result.kkm ? 'bg-red-50/50' : ''}`}>
                      <td className="table-cell text-center font-bold">{r.rank}</td>
                      <td className="table-cell font-medium">{r.name}</td>
                      <td className="table-cell text-center">{r.pengetahuan_rata ?? '-'}</td>
                      <td className="table-cell text-center">{r.keterampilan_rata ?? '-'}</td>
                      <td className="table-cell text-center">{r.sikap_rata ?? '-'}</td>
                      <td className="table-cell text-center">{r.sts ?? '-'}</td>
                      <td className="table-cell text-center">{r.sas ?? '-'}</td>
                      <td className={`table-cell text-center font-bold ${r.average < result.kkm ? 'text-danger' : ''}`}>{r.average}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
