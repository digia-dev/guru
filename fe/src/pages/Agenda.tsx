import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { LearningActivity, Subject } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useClasses } from '../hooks/useClasses';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const CLASS_PALETTE = [
  { bg: 'bg-rose-100 text-rose-700 border-l-rose-400', dot: 'bg-rose-400' },
  { bg: 'bg-blue-100 text-blue-700 border-l-blue-400', dot: 'bg-blue-400' },
  { bg: 'bg-emerald-100 text-emerald-700 border-l-emerald-400', dot: 'bg-emerald-400' },
  { bg: 'bg-amber-100 text-amber-700 border-l-amber-400', dot: 'bg-amber-400' },
  { bg: 'bg-purple-100 text-purple-700 border-l-purple-400', dot: 'bg-purple-400' },
  { bg: 'bg-pink-100 text-pink-700 border-l-pink-400', dot: 'bg-pink-400' },
  { bg: 'bg-cyan-100 text-cyan-700 border-l-cyan-400', dot: 'bg-cyan-400' },
  { bg: 'bg-orange-100 text-orange-700 border-l-orange-400', dot: 'bg-orange-400' },
];

function classColor(className: string) {
  let hash = 0; for (let i = 0; i < className.length; i++) hash = ((hash << 5) - hash) + className.charCodeAt(i);
  return CLASS_PALETTE[Math.abs(hash) % CLASS_PALETTE.length];
}

function getWeekRange(date: Date) {
  const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0, 0, 0, 0);
  const end = new Date(d); end.setDate(d.getDate() + 6);
  return { start: d.toLocaleDateString('en-CA'), end: end.toLocaleDateString('en-CA'), startDate: d, endDate: end };
}

function AgendaModal({ isOpen, onClose, activity, currentDate, teacherClasses, teacherSubjects, allSubjects }: { isOpen: boolean; onClose: () => void; activity?: LearningActivity; currentDate: Date; teacherClasses: string[]; teacherSubjects: Subject[]; allSubjects: Subject[] }) {
  const [date, setDate] = useState(activity?.event_date || currentDate.toLocaleDateString('en-CA'));
  const [kelas, setKelas] = useState(activity?.class || teacherClasses[0]);
  const [subjectCode, setSubjectCode] = useState(() => {
    if (activity?.subject_id) { const s = allSubjects.find(x => x.id === activity.subject_id); return s?.code || (teacherSubjects[0]?.code || ''); }
    return teacherSubjects[0]?.code || '';
  });
  const [catatan, setCatatan] = useState(activity?.catatan || '');
  const [timeSlots, setTimeSlots] = useState<{ start: string; end: string }[]>(activity ? [{ start: activity.waktu_mulai, end: activity.waktu_selesai }] : [{ start: '07:00', end: '08:00' }]);
  const [aiIdeas, setAiIdeas] = useState(''); const [aiLoading, setAiLoading] = useState(false);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => Promise.all(timeSlots.map((slot) => {
      const subjectId = allSubjects.find(s => s.code === subjectCode)?.id || null;
      const payload = { event_date: date, class: kelas, waktu_mulai: slot.start, waktu_selesai: slot.end, catatan, subject_id: subjectId };
      return activity?.id ? apiClient.put(`/activities/${activity.id}`, payload) : apiClient.post('/activities', payload);
    })),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activities'] }); toast.success(activity ? 'Jadwal diperbarui!' : 'Jadwal ditambahkan!'); onClose(); },
    onError: () => toast.error('Gagal menyimpan jadwal'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (activity?.id) await apiClient.delete(`/activities/${activity.id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activities'] }); toast.success('Jadwal dihapus!'); onClose(); },
    onError: () => toast.error('Gagal menghapus jadwal'),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <h3 className="text-lg font-semibold">{activity ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5"><i className="fas fa-times text-text-tertiary"></i></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">Tanggal</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Kelas</label>
            <div className="relative">
              <select value={kelas} onChange={(e) => setKelas(e.target.value)} className="select-field">
                {teacherClasses.map((c) => <option key={c} value={c}>Kelas {c}</option>)}
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
                <select value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} className="select-field">
                  {teacherSubjects.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
              </div>
            )}
          </div>
          <div>
            <label className="label">Waktu</label>
            <div className="space-y-2">
              {timeSlots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="time" value={slot.start} onChange={(e) => { const t = [...timeSlots]; t[i].start = e.target.value; setTimeSlots(t); }} className="input-field" />
                  <span className="text-text-tertiary">—</span>
                  <input type="time" value={slot.end} onChange={(e) => { const t = [...timeSlots]; t[i].end = e.target.value; setTimeSlots(t); }} className="input-field" />
                  {timeSlots.length > 1 && <button onClick={() => setTimeSlots(timeSlots.filter((_, j) => j !== i))} className="text-danger"><i className="fas fa-times-circle"></i></button>}
                </div>
              ))}
              {timeSlots.length < 3 && (
                <button onClick={() => setTimeSlots([...timeSlots, { start: '07:00', end: '08:00' }])} className="text-sm text-primary font-medium hover:underline">
                  <i className="fas fa-plus-circle mr-1"></i>Tambah Jam Lain
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="label">Catatan Kegiatan</label>
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} className="input-field" rows={3} placeholder="Deskripsi kegiatan pembelajaran..." />
          </div>
          <div>
            <button onClick={async () => { setAiLoading(true); setAiIdeas(''); try { const { data } = await apiClient.post('/ai/activity-ideas', { class: kelas, date }); setAiIdeas(data.data); } catch { toast.error('Gagal mendapatkan ide dari AI'); } setAiLoading(false); }} disabled={aiLoading} className="w-full btn-secondary flex items-center justify-center gap-2">
              {aiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles text-primary"></i>}
              {aiLoading ? 'Meminta AI...' : 'Ide Kegiatan (AI)'}
            </button>
            {aiIdeas && (
              <div className="mt-3 p-4 rounded-2xl bg-soft-purple text-sm text-primary whitespace-pre-wrap">
                <i className="fas fa-lightbulb mr-1 text-amber-500"></i>{aiIdeas}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            {activity && <Button variant="danger" onClick={() => { if (confirm('Hapus jadwal ini?')) deleteMutation.mutate(); }} icon="fa-trash">Hapus</Button>}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} loading={saveMutation.isPending} className="flex-1">Simpan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Agenda() {
  const { user } = useAuth();
  const { classes: teacherClasses } = useClasses();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LearningActivity | undefined>();
  const weekRange = getWeekRange(currentDate);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  useEffect(() => {
    apiClient.get('/subjects').then((res: any) => {
      if (res.data.success) setAllSubjects(res.data.data);
    });
  }, []);
  useEffect(() => {
    const codes = user?.teacher_subjects || [];
    setTeacherSubjects(allSubjects.filter((s: Subject) => codes.includes(s.code)));
  }, [user?.teacher_subjects, allSubjects]);

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', weekRange.start, weekRange.end],
    queryFn: async () => { const { data } = await apiClient.get(`/activities?start_date=${weekRange.start}&end_date=${weekRange.end}`); return data.data as LearningActivity[]; },
  });

  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) { const d = new Date(weekRange.startDate); d.setDate(weekRange.startDate.getDate() + i); weekDates.push(d); }

  const todayStr = new Date().toDateString();
  const formatDate = (d: Date) => d.toLocaleDateString('en-CA');
  const getEventsForDay = (dateStr: string) => activities.filter((a) => a.event_date === dateStr).sort((a, b) => a.waktu_mulai.localeCompare(b.waktu_mulai));
  const handlePrevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const handleNextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const handleToday = () => setCurrentDate(new Date());
  const openAddModal = () => { setEditingActivity(undefined); setModalOpen(true); };
  const openEditModal = (activity: LearningActivity) => { setEditingActivity(activity); setModalOpen(true); };

  const queryClient = useQueryClient();
  const duplicateMutation = useMutation({
    mutationFn: async () => { await apiClient.post('/activities/duplicate', { start_date: weekRange.start, end_date: weekRange.end }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activities'] }); toast.success('Agenda diduplikasi!'); handleNextWeek(); },
    onError: () => toast.error('Gagal menduplikasi'),
  });

  useKeyboardShortcuts({ new: openAddModal });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="text-text-secondary text-sm mt-1">Kelola jadwal pembelajaran mingguan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon="fa-calendar-alt" onClick={() => navigate('/app/kalender')}>Kalender</Button>
          <Button variant="secondary" size="sm" icon="fa-copy" onClick={() => duplicateMutation.mutate()}>Duplikasi</Button>
          <Button icon="fa-plus" size="sm" onClick={openAddModal}>Tambah</Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handlePrevWeek} className="w-10 h-10 rounded-2xl hover:bg-surface-secondary flex items-center justify-center transition-colors">
              <i className="fas fa-chevron-left text-text-secondary"></i>
            </button>
            <h2 className="font-[650] text-lg min-w-[200px] text-center">
              {weekRange.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              {' — '}
              {weekRange.endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h2>
            <button onClick={handleNextWeek} className="w-10 h-10 rounded-2xl hover:bg-surface-secondary flex items-center justify-center transition-colors">
              <i className="fas fa-chevron-right text-text-secondary"></i>
            </button>
          </div>
          <button onClick={handleToday} className="btn-secondary text-sm px-4 py-2">Hari ini</button>
        </div>
      </Card>

      {/* Weekly Calendar */}
      <Card padding={false} className="overflow-hidden">
        <div className="overflow-auto" ref={scrollRef}>
          <div className="flex" style={{ minWidth: 700 }}>
            {/* Time column */}
            <div className="flex-shrink-0 w-16 sticky left-0 z-30 bg-white">
              <div className="h-12" />
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="flex items-start justify-end pr-3 pt-1 text-[11px] text-text-tertiary h-[60px] border-b border-black/[0.04]">{i + 7}:00</div>
              ))}
            </div>
            {/* Days */}
            <div className="flex-grow">
              <div className="grid grid-cols-7 sticky top-0 z-20 bg-white border-b border-black/[0.06]">
                {weekDates.map((d) => {
                  const isToday = d.toDateString() === todayStr;
                  return (
                    <div key={d.toISOString()} className={`text-center py-3 border-l border-black/[0.04] ${isToday ? 'bg-soft-purple' : ''}`}>
                      <div className="text-[11px] font-medium text-text-tertiary">{d.toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                      <div className={`text-xl font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-text-primary'}`}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-7 relative" style={{ height: 12 * 60 }}>
                {weekDates.map((d) => {
                  const dateStr = formatDate(d);
                  const dayEvents = getEventsForDay(dateStr);
                  return (
                    <div key={dateStr} className="relative border-l border-black/[0.04]">
                      {dayEvents.map((event) => {
                        const [sh, sm] = event.waktu_mulai.split(':').map(Number);
                        const [eh, em] = event.waktu_selesai.split(':').map(Number);
                        const top = (sh - 7) * 60 + sm;
                        const height = Math.max(((eh - 7) * 60 + em) - top - 1, 20);
                        const colors = classColor(event.class);
                        return (
                          <div key={event.id} onClick={() => openEditModal(event)} className={`absolute left-1 right-1 rounded-xl border-l-[3px] ${colors.bg} px-2.5 py-1.5 text-xs overflow-hidden cursor-pointer z-10 shadow-sm hover:shadow-md transition-shadow`} style={{ top: `${top}px`, height: `${height}px` }}>
                            <span className="font-semibold">{event.class}</span>
                            <p className="truncate opacity-75">{event.catatan || ''}</p>
                            <span className="text-[10px] opacity-60">{event.waktu_mulai.slice(0, 5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 12 }, (_, i) => <div key={i} className="border-b border-black/[0.04]" style={{ height: 60 }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <AgendaModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} activity={editingActivity} currentDate={currentDate} teacherClasses={teacherClasses} teacherSubjects={teacherSubjects} allSubjects={allSubjects} />
    </div>
  );
}
