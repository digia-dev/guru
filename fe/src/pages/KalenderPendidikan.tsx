import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import * as XLSX from 'xlsx';

const CALENDAR_DATA = {
  "kalenderAkademik": {
    "info": { "sekolah": "SMP NEGERI 3 KOTA TANGERANG SELATAN", "tahunPelajaran": "2025/2026" },
    "kegiatan": [
      { "jenis": "Kegiatan Awal Masuk Sekolah", "eventType": "awal-sekolah", "tanggal": ["2025-07-07", "2025-07-08", "2025-07-09"] },
      { "jenis": "Libur Resmi Nasional", "eventType": "libur-nasional", "tanggal": ["2025-08-17", "2025-09-11", "2025-12-25", "2026-01-09", "2026-02-25", "2026-03-26", "2026-04-10", "2026-05-01", "2026-05-08", "2026-05-21", "2026-06-01"] },
      { "jenis": "Ulangan Tengah Semester", "eventType": "uts", "tanggal": ["2025-09-15", "2025-09-16", "2025-09-17", "2025-09-18", "2025-09-19", "2026-04-13", "2026-04-14", "2026-04-15", "2026-04-16", "2026-04-17"] },
      { "jenis": "Penilaian Akhir Semester", "eventType": "ujian-akhir", "tanggal": ["2025-12-01", "2025-12-02", "2025-12-03", "2025-12-04", "2025-12-05", "2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12", "2026-06-13"] },
      { "jenis": "Penyerahan Buku Raport", "eventType": "bagi-rapor", "tanggal": ["2025-12-13", "2026-06-20"] },
      { "jenis": "Libur Semester", "eventType": "libur-semester", "tanggal": ["2025-12-15", "2025-12-16", "2025-12-17", "2025-12-18", "2025-12-19", "2025-12-20", "2025-12-22", "2025-12-23", "2025-12-24", "2025-12-26", "2025-12-27", "2025-12-29", "2025-12-30", "2025-12-31", "2026-01-02", "2026-01-03", "2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27"] },
      { "jenis": "Libur Puasa & Idul Fitri", "eventType": "libur-puasa-fitri", "tanggal": ["2026-02-23", "2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06", "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"] },
      { "jenis": "PSA Kelas 9", "eventType": "psa-kelas-9", "tanggal": ["2026-04-20", "2026-04-21", "2026-04-22", "2026-04-23", "2026-04-24"] }
    ]
  }
};

const EVENT_DOTS: Record<string, string> = {
  'libur-nasional': 'bg-red-400', 'awal-sekolah': 'bg-green-400', 'libur-semester': 'bg-yellow-400',
  'ujian-akhir': 'bg-blue-400', 'uts': 'bg-orange-400', 'libur-puasa-fitri': 'bg-cyan-400',
  'bagi-rapor': 'bg-gray-400', 'psa-kelas-9': 'bg-amber-400',
};

const EVENT_LABELS: Record<string, { label: string; dot: string }> = {
  'libur-nasional': { label: 'Libur Nasional', dot: 'bg-red-400' },
  'awal-sekolah': { label: 'Awal Masuk', dot: 'bg-green-400' },
  'libur-semester': { label: 'Libur Semester', dot: 'bg-yellow-400' },
  'ujian-akhir': { label: 'SAS', dot: 'bg-blue-400' },
  'uts': { label: 'STS', dot: 'bg-orange-400' },
  'libur-puasa-fitri': { label: 'Libur Puasa', dot: 'bg-cyan-400' },
  'bagi-rapor': { label: 'Bagi Rapor', dot: 'bg-gray-400' },
  'psa-kelas-9': { label: 'PSA Kelas 9', dot: 'bg-amber-400' },
};

const EVENT_TYPES = ['libur-nasional', 'awal-sekolah', 'libur-semester', 'ujian-akhir', 'uts', 'libur-puasa-fitri', 'bagi-rapor', 'psa-kelas-9'];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const rows = [
    ['event_date', 'jenis', 'event_type', 'color_class'],
    ['2026-07-28', 'Libur Nasional', 'libur-nasional', 'bg-red-400'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Kalender');
  XLSX.writeFile(wb, 'template-kalender.xlsx');
}

async function exportKalender() {
  try {
    const res = await apiClient.get('/calendar-events', { params: { start_date: '2025-07-01', end_date: '2026-07-31' } });
    const data = res.data.data || [];
    const rows = data.map((e: any) => [e.event_date, e.jenis, e.event_type, e.color_class || '']);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['event_date', 'jenis', 'event_type', 'color_class'], ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Kalender');
    XLSX.writeFile(wb, `kalender-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Kalender berhasil diexport');
  } catch {
    toast.error('Gagal export kalender');
  }
}

function getAcademicYearMonths() { const months = []; for (let i = 0; i < 13; i++) months.push(new Date(2025, 6 + i, 1)); return months; }

function buildEventMap() {
  const map = new Map<string, { jenis: string; eventType: string }>();
  CALENDAR_DATA.kalenderAkademik.kegiatan.forEach((k) => { k.tanggal.forEach((tgl) => { map.set(tgl, { jenis: k.jenis, eventType: k.eventType }); }); });
  return map;
}

function CalendarMonth({ year, month, eventMap }: { year: number; month: number; eventMap: Map<string, any> }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const days = []; for (let i = 0; i < startOffset; i++) days.push(null); for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getEventsForDay = (day: number) => { const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return eventMap.get(dateStr); };

  return (
    <div className="w-full px-2">
      <h3 className="text-lg font-[650] text-center mb-5">
        {new Date(year, month).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-tertiary font-medium mb-3">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          const event = getEventsForDay(day);
          return (
            <div key={day} className={`flex flex-col items-center justify-center rounded-xl text-sm p-1.5 min-h-[52px] relative transition-colors ${isToday ? 'bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-md' : 'hover:bg-surface-secondary'}`} title={event?.jenis || ''}>
              <span className={`font-medium text-sm ${isToday ? 'text-white' : ''}`}>{day}</span>
              {event && <div className={`w-1.5 h-1.5 rounded-full mt-1 ${EVENT_DOTS[event.eventType] || 'bg-gray-300'}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function KalenderPendidikan() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const eventMap = buildEventMap();
  const months = getAcademicYearMonths();
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(file: File) {
    setImporting(true); setImportResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
      if (rows.length === 0) { toast.error('File kosong'); setImporting(false); return; }
      for (const row of rows) {
        for (const key of Object.keys(row)) {
          if (row[key] instanceof Date) row[key] = row[key].toISOString().slice(0, 10);
        }
      }
      const res = await apiClient.post('/calendar-events/import', rows);
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

  useEffect(() => {
    const today = new Date();
    const idx = months.findIndex((m) => m.getFullYear() === today.getFullYear() && m.getMonth() === today.getMonth());
    if (idx >= 0 && scrollRef.current) { const el = scrollRef.current.children[idx] as HTMLElement; if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center' }); setCurrentMonthIndex(idx); }
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const childWidth = container.children[0]?.clientWidth || container.clientWidth;
    const idx = Math.round(scrollLeft / childWidth);
    if (idx >= 0 && idx < months.length) setCurrentMonthIndex(idx);
  };

  const currentMonth = months[currentMonthIndex];
  const currentEvents: { date: string; jenis: string; eventType: string }[] = [];
  if (currentMonth) {
    eventMap.forEach((v, k) => { const d = new Date(k); if (d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth()) currentEvents.push({ date: k, ...v }); });
    currentEvents.sort((a, b) => a.date.localeCompare(b.date));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Kalender Pendidikan</h1>
          <p className="text-text-secondary text-sm mt-1">Tahun Pelajaran {CALENDAR_DATA.kalenderAkademik.info.tahunPelajaran}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={downloadTemplate} className="px-2.5 py-2 rounded-lg text-xs font-medium bg-white border border-black/[0.06] hover:bg-surface-secondary text-text-secondary transition-colors" title="Download Template"><i className="fas fa-download mr-1"></i>Template</button>
          <button onClick={exportKalender} className="px-2.5 py-2 rounded-lg text-xs font-medium bg-white border border-black/[0.06] hover:bg-surface-secondary text-text-secondary transition-colors" title="Export Excel"><i className="fas fa-file-export mr-1"></i>Export</button>
          <button onClick={() => setImportOpen(true)} className="px-2.5 py-2 rounded-lg text-xs font-medium bg-white border border-black/[0.06] hover:bg-surface-secondary text-text-secondary transition-colors" title="Import Excel"><i className="fas fa-file-import mr-1"></i>Import</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(EVENT_LABELS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/[0.06] text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${val.dot}`}></div>
            <span className="text-text-secondary">{val.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card padding={false} className="relative overflow-hidden">
        <button onClick={() => { if (scrollRef.current) scrollRef.current.scrollBy({ left: -scrollRef.current.clientWidth, behavior: 'smooth' }); }} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-all">
          <i className="fas fa-chevron-left text-text-secondary text-sm"></i>
        </button>
        <div ref={scrollRef} onScroll={handleScroll} className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory py-6 px-4">
          {months.map((m, i) => (
            <div key={i} className="snap-center shrink-0 w-full px-2">
              <CalendarMonth year={m.getFullYear()} month={m.getMonth()} eventMap={eventMap} />
            </div>
          ))}
        </div>
        <button onClick={() => { if (scrollRef.current) scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth, behavior: 'smooth' }); }} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-all">
          <i className="fas fa-chevron-right text-text-secondary text-sm"></i>
        </button>
      </Card>

      {/* Events List */}
      <Card>
        <h2 className="section-title mb-4">
          Acara {currentMonth?.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </h2>
        {currentEvents.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">
            <i className="fas fa-calendar text-2xl mb-2"></i>
            <p className="text-sm">Tidak ada acara di bulan ini</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {currentEvents.map((ev, i) => {
              const d = new Date(ev.date + 'T00:00:00');
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-secondary transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface-secondary flex flex-col items-center justify-center">
                    <span className="text-[9px] font-medium text-text-tertiary">{d.toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                    <span className="text-sm font-bold">{d.getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{ev.jenis}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${EVENT_DOTS[ev.eventType] || 'bg-gray-300'}`}></div>
                      <span className="text-xs text-text-tertiary">{EVENT_LABELS[ev.eventType]?.label || ev.eventType}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={importOpen} onClose={() => { if (!importing) { setImportOpen(false); setImportResult(null); } }} title="Import Kalender dari Excel">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Upload file Excel (.xlsx) dengan kolom: <strong>event_date</strong>, <strong>jenis</strong>, <strong>event_type</strong>, <strong>color_class</strong> (opsional). Gunakan tombol <strong>Template</strong> untuk contoh format.</p>
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
              Import selesai: {importResult.imported} baru, {importResult.updated} diupdate
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
