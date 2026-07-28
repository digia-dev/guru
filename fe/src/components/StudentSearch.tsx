import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface SearchResult {
  student_id: string;
  name: string;
  class: string;
  id: number;
}

interface StudentSearchProps {
  onSelectStudent?: (studentId: number) => void;
}

export default function StudentSearch({ onSelectStudent }: StudentSearchProps) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['student-search', debounced],
    queryFn: async () => {
      if (debounced.length < 3) return [];
      const { data } = await apiClient.get(`/students?search=${encodeURIComponent(debounced)}`);
      return (data.data as SearchResult[]).slice(0, 5);
    },
    enabled: debounced.length >= 3,
    staleTime: 15000,
  });

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Cari siswa..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => { if (query.length >= 3) setShowResults(true); }}
          className="w-full bg-gray-100 rounded-lg py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
      </div>

      {showResults && debounced.length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          {isFetching && (
            <p className="text-center text-gray-500 py-3 text-sm">Mencari...</p>
          )}
          {!isFetching && results.length === 0 && (
            <p className="text-center text-gray-500 py-3 text-sm">Siswa tidak ditemukan.</p>
          )}
          {!isFetching && results.length > 0 && results.map((s) => (
            <div
              key={s.id}
              onClick={() => { setShowResults(false); setQuery(''); onSelectStudent?.(s.id); }}
              className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">NIS: {s.student_id} | Kelas: {s.class}</p>
              </div>
              <span className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-md">Lihat Detail</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
