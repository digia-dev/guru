import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import StudentDetailModal from './StudentDetailModal';
import clsx from 'clsx';

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

const STORAGE_KEY = 'appguru_recent_search';
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function addRecent(q: string) {
  const list = getRecent().filter(x => x !== q);
  list.unshift(q);
  if (list.length > MAX_RECENT) list.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setQuery('');
      setDebounced('');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
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
      addRecent(debounced);
      setRecent(getRecent());
      const { data } = await apiClient.get(`/search?q=${encodeURIComponent(debounced)}`);
      return data.data as SearchResult;
    },
    enabled: debounced.length >= 2,
    staleTime: 10000,
  });

  const students = data?.students || [];
  const classes = data?.classes || [];
  const hasResults = students.length > 0 || classes.length > 0;
  const showNoResult = debounced.length >= 2 && !isFetching && !hasResults;

  const handleClose = () => {
    onClose();
  };

  const selectStudent = (id: number) => {
    setSelectedStudent(id);
    setQuery('');
  };

  if (selectedStudent) {
    return (
      <StudentDetailModal
        isOpen={true}
        onClose={() => { setSelectedStudent(null); onClose(); }}
        studentId={selectedStudent}
      />
    );
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 transition-all duration-300 ease-out',
        open ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
      )}
      onClick={handleClose}
    >
      <div
        className={clsx(
          'absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out',
          open ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div className="flex items-start justify-center pt-[12vh] sm:pt-[18vh] px-4 sm:px-6">
        <div className={clsx(
          'w-full max-w-xl bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300 ease-out',
          open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
        )} onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.04]">
            <i className="fas fa-search text-text-tertiary text-sm"></i>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari siswa atau kelas..."
              className="flex-1 outline-none text-base bg-transparent placeholder:text-text-tertiary"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 text-[11px] text-text-tertiary font-medium">
              <i className="fas fa-xmark text-[10px]"></i> ESC
            </kbd>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 -mr-1">
              <i className="fas fa-xmark text-text-secondary text-lg"></i>
            </button>
          </div>

          <div className="overflow-y-auto max-h-[55vh] p-2">
            {debounced.length < 2 && recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Terakhir Dicari</p>
                  <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setRecent([]); }} className="text-[11px] text-text-tertiary hover:text-danger font-medium">Hapus</button>
                </div>
                {recent.map((q, i) => (
                  <button
                    key={`${q}-${i}`}
                    onClick={() => { setQuery(q); setDebounced(q); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-secondary transition-colors text-left"
                  >
                    <i className="fas fa-clock-rotate-left text-text-tertiary text-sm w-5 text-center"></i>
                    <span className="text-sm">{q}</span>
                  </button>
                ))}
              </div>
            )}

            {debounced.length < 2 && recent.length === 0 && (
              <div className="text-center py-12 text-text-tertiary text-sm">
                <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-search text-lg"></i>
                </div>
                Ketik minimal 2 karakter untuk mencari
              </div>
            )}

            {isFetching && (
              <div className="text-center py-8 text-text-tertiary">
                <i className="fas fa-spinner fa-spin text-lg"></i>
              </div>
            )}

            {showNoResult && (
              <div className="text-center py-12 text-text-tertiary text-sm">
                <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-search-minus text-lg"></i>
                </div>
                Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;
              </div>
            )}

            {!isFetching && hasResults && (
              <div className="space-y-1">
                {students.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-3 py-2">Siswa</p>
                    {students.map(s => (
                      <button
                        key={s.id}
                        onClick={() => selectStudent(s.id)}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-surface-secondary transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-[12px] text-text-tertiary truncate">{s.student_id} · {s.class}</p>
                          </div>
                        </div>
                        <i className="fas fa-chevron-right text-text-tertiary text-xs flex-shrink-0"></i>
                      </button>
                    ))}
                  </div>
                )}

                {classes.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-3 py-2">Kelas</p>
                    {classes.map(c => (
                      <button
                        key={c}
                        onClick={() => { handleClose(); navigate('/app/data'); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-surface-secondary transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-xl bg-soft-green flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-school text-green-600 text-sm"></i>
                        </div>
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
    </div>
  );
}