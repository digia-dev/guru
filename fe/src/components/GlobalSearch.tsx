import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import StudentDetailModal from './StudentDetailModal';

interface SearchStudent {
  id: number;
  student_id: string;
  name: string;
  class: string;
}

interface SearchResult {
  students: SearchStudent[];
  classes: string[];
}

const menuItems = [
  { label: 'Dashboard', path: '/app/dashboard', icon: 'fa-chart-pie' },
  { label: 'Agenda', path: '/app/agenda', icon: 'fa-calendar-day' },
  { label: 'Absensi', path: '/app/absensi', icon: 'fa-user-check' },
  { label: 'Nilai', path: '/app/nilai', icon: 'fa-star' },
  { label: 'Nilai Semester', path: '/app/penilaian-semester', icon: 'fa-chart-line' },
  { label: 'Data', path: '/app/data', icon: 'fa-users' },
  { label: 'Kalender', path: '/app/kalender', icon: 'fa-calendar-alt' },
  { label: 'Pengaturan', path: '/app/settings', icon: 'fa-gear' },
  { label: 'Profil', path: '/app/profile', icon: 'fa-user' },
];

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !selectedStudent) onClose();
    };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose, selectedStudent]);

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: async () => {
      if (debounced.length < 2) return { students: [], classes: [] } as SearchResult;
      const { data } = await apiClient.get(`/search?q=${encodeURIComponent(debounced)}`);
      return data.data as SearchResult;
    },
    enabled: debounced.length >= 2,
    staleTime: 10000,
  });

  const filteredMenus = menuItems.filter(m =>
    m.label.toLowerCase().includes(debounced.toLowerCase())
  );

  const students = data?.students || [];
  const classes = data?.classes || [];
  const hasResults = students.length > 0 || classes.length > 0 || filteredMenus.length > 0;
  const showNoResult = debounced.length >= 2 && !isFetching && !hasResults;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/30 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/[0.06]">
            <i className="fas fa-search text-text-tertiary"></i>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari siswa, kelas, atau menu..."
              className="flex-1 outline-none text-base bg-transparent placeholder:text-text-tertiary"
            />
            <button onClick={onClose} className="text-xs text-text-tertiary bg-surface-secondary px-3 py-1.5 rounded-lg font-medium">
              ESC
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {debounced.length < 2 && (
              <div className="text-center py-10 text-text-tertiary text-sm">
                <i className="fas fa-search text-2xl mb-2 block"></i>
                Ketik minimal 2 karakter untuk mencari...
              </div>
            )}

            {isFetching && (
              <div className="text-center py-8 text-text-tertiary">
                <i className="fas fa-spinner fa-spin text-xl"></i>
              </div>
            )}

            {showNoResult && (
              <div className="text-center py-10 text-text-tertiary text-sm">
                <i className="fas fa-search-minus text-2xl mb-2 block"></i>
                Tidak ditemukan hasil untuk "{query}"
              </div>
            )}

            {!isFetching && hasResults && (
              <div className="space-y-3">
                {filteredMenus.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-3 mb-1">Menu</p>
                    {filteredMenus.map(m => (
                      <button
                        key={m.path}
                        onClick={() => { onClose(); navigate(m.path); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-secondary transition-colors text-left"
                      >
                        <i className={`fas ${m.icon} w-5 text-center text-indigo-500 text-sm`}></i>
                        <span className="text-sm font-medium">{m.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {students.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-3 mb-1">Siswa</p>
                    {students.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedStudent(s.id); setQuery(''); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-secondary transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-xs text-text-tertiary truncate">NIS: {s.student_id} | Kelas: {s.class}</p>
                          </div>
                        </div>
                        <i className="fas fa-chevron-right text-text-tertiary text-xs flex-shrink-0"></i>
                      </button>
                    ))}
                  </div>
                )}

                {classes.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-3 mb-1">Kelas</p>
                    {classes.map(c => (
                      <button
                        key={c}
                        onClick={() => { onClose(); navigate('/app/data'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-secondary transition-colors text-left"
                      >
                        <i className="fas fa-school w-5 text-center text-green-500 text-sm"></i>
                        <span className="text-sm font-medium">Kelas {c}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <StudentDetailModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent}
        />
      )}
    </>
  );
}
