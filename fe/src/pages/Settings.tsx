import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Student, User, Tabungan, KasUmum } from '../types';
import { useAuth } from '../context/AuthContext';
import { exportXLSX } from '../utils/exportXLSX';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const CALENDAR_DATA = {
  kalenderAkademik: {
    info: { sekolah: "SMP NEGERI 3 KOTA TANGERANG SELATAN", tahunPelajaran: "2025/2026" },
    kegiatan: [
      { jenis: "Kegiatan Awal Masuk Sekolah", eventType: "awal-sekolah", tanggal: ["2025-07-07", "2025-07-08", "2025-07-09"] },
      { jenis: "Libur Resmi Nasional", eventType: "libur-nasional", tanggal: ["2025-08-17", "2025-09-11", "2025-12-25", "2026-01-09", "2026-02-25", "2026-03-26", "2026-04-10", "2026-05-01", "2026-05-08", "2026-05-21", "2026-06-01"] },
      { jenis: "Ulangan Tengah Semester", eventType: "uts", tanggal: ["2025-09-15", "2025-09-16", "2025-09-17", "2025-09-18", "2025-09-19", "2026-04-13", "2026-04-14", "2026-04-15", "2026-04-16", "2026-04-17"] },
      { jenis: "Penilaian Akhir Semester", eventType: "ujian-akhir", tanggal: ["2025-12-01", "2025-12-02", "2025-12-03", "2025-12-04", "2025-12-05", "2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12", "2026-06-13"] },
      { jenis: "Penyerahan Buku Raport", eventType: "bagi-rapor", tanggal: ["2025-12-13", "2026-06-20"] },
      { jenis: "Libur Semester", eventType: "libur-semester", tanggal: ["2025-12-15", "2025-12-16", "2025-12-17", "2025-12-18", "2025-12-19", "2025-12-20", "2025-12-22", "2025-12-23", "2025-12-24", "2025-12-26", "2025-12-27", "2025-12-29", "2025-12-30", "2025-12-31", "2026-01-02", "2026-01-03", "2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27"] },
      { jenis: "Libur Puasa & Idul Fitri", eventType: "libur-puasa-fitri", tanggal: ["2026-02-23", "2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06", "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"] },
      { jenis: "PSA Kelas 9", eventType: "psa-kelas-9", tanggal: ["2026-04-20", "2026-04-21", "2026-04-22", "2026-04-23", "2026-04-24"] },
    ],
  },
};

const DATA_ITEMS = [
  {
    key: 'siswa', icon: 'fa-users', label: 'Data Siswa', desc: 'NIS, nama, kelas, alamat, orang tua',
    headers: ['NIS', 'Nama', 'Kelas', 'Alamat', 'Tgl Lahir', 'Ayah', 'Pek. Ayah', 'Ibu', 'Pek. Ibu', 'No HP', 'Catatan'],
    sample: ['1234567890', 'Budi Santoso', '7-1', 'Jl. Merdeka No. 1', '2012-05-15', 'Rudi Santoso', 'Wiraswasta', 'Siti Aminah', 'IRT', '081234567890', 'Anak aktif'],
    exportCols: [
      { key: 'student_id', label: 'NIS' }, { key: 'name', label: 'Nama' }, { key: 'class', label: 'Kelas' },
      { key: 'address', label: 'Alamat' }, { key: 'dob', label: 'Tgl Lahir' },
      { key: 'father_name', label: 'Ayah' }, { key: 'father_job', label: 'Pek. Ayah' },
      { key: 'mother_name', label: 'Ibu' }, { key: 'mother_job', label: 'Pek. Ibu' },
      { key: 'phone', label: 'No HP' }, { key: 'notes', label: 'Catatan' },
    ],
    importEndpoint: '/students',
    importMapRow: (r: any, kelas: string) => ({ student_id: r['NIS'], name: r['Nama'], class: kelas, address: r['Alamat'] || '', dob: r['Tgl Lahir'] || '', father_name: r['Ayah'] || '', father_job: r['Pek. Ayah'] || '', mother_name: r['Ibu'] || '', mother_job: r['Pek. Ibu'] || '', phone: r['No HP'] || '', notes: r['Catatan'] || '' }),
    importCacheKey: ['students'],
  },
  {
    key: 'guru', icon: 'fa-chalkboard-user', label: 'Data Guru', desc: 'Nama, email, role, kelas ajar',
    headers: ['Nama', 'Email', 'Kelas'],
    sample: ['Siti Rahmawati', 'siti@sekolah.com', '7-1,7-2'],
    exportCols: [
      { key: 'name', label: 'Nama' }, { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' }, { key: 'teacher_classes', label: 'Kelas' },
    ],
    importEndpoint: '/auth/register',
    importMapRow: (r: any) => ({ name: r['Nama'], email: r['Email'], password: 'guru123', role: 'guru', teacher_classes: (r['Kelas'] || '').split(',').map((s: string) => s.trim()).filter(Boolean) }),
    importCacheKey: [],
  },
  {
    key: 'materi', icon: 'fa-book', label: 'Materi', desc: 'Judul, URL, tipe (link/video/dokumen)',
    headers: ['Judul', 'URL', 'Tipe'],
    sample: ['Materi Pecahan', 'https://contoh.com/pecahan', 'link'],
    exportCols: [{ key: 'title', label: 'Judul' }, { key: 'url', label: 'URL' }, { key: 'type', label: 'Tipe' }],
    importEndpoint: '/materi',
    importMapRow: (r: any) => ({ title: r['Judul'], url: r['URL'], type: r['Tipe'] || 'link' }),
    importCacheKey: ['materi'],
  },
  {
    key: 'tabungan', icon: 'fa-wallet', label: 'Tabungan', desc: 'Riwayat setor/tarik per tanggal',
    headers: ['ID Siswa', 'Tanggal', 'Uang Masuk', 'Uang Keluar'],
    sample: ['1234567890', '2026-01-15', '5000', '0'],
    exportCols: [
      { key: 'tanggal', label: 'Tanggal' }, { key: 'siswa', label: 'Siswa' },
      { key: 'uang_masuk', label: 'Uang Masuk' }, { key: 'uang_keluar', label: 'Uang Keluar' },
    ],
    importEndpoint: '/tabungan',
    importMapRow: (r: any) => ({ student_id: r['ID Siswa'], tanggal: r['Tanggal'], uang_masuk: parseInt(r['Uang Masuk']) || 0, uang_keluar: parseInt(r['Uang Keluar']) || 0 }),
    importCacheKey: ['tabungan-summary'],
  },
  {
    key: 'kas', icon: 'fa-building-columns', label: 'Kas Umum', desc: 'Penarikan dana kas kelas',
    headers: ['Tanggal', 'Jumlah', 'Keterangan'],
    sample: ['2026-01-15', '50000', 'Pembelian ATK'],
    exportCols: [{ key: 'tanggal', label: 'Tanggal' }, { key: 'jumlah', label: 'Jumlah' }, { key: 'keterangan', label: 'Keterangan' }],
    importEndpoint: '/kas-umum',
    importMapRow: (r: any) => ({ tanggal: r['Tanggal'], jumlah: parseInt(r['Jumlah']) || 0, keterangan: r['Keterangan'] || '' }),
    importCacheKey: ['kas-umum'],
  },
  {
    key: 'kalender', icon: 'fa-calendar-alt', label: 'Kalender Pendidikan', desc: 'Semua acara tahun ajaran',
    headers: ['Tanggal', 'Kegiatan', 'Tipe'],
    sample: ['2025-07-07', 'Kegiatan Awal Masuk Sekolah', 'awal-sekolah'],
    exportCols: [{ key: 'tanggal', label: 'Tanggal' }, { key: 'kegiatan', label: 'Kegiatan' }, { key: 'tipe', label: 'Tipe' }],
  },
];

function makeCalExportRows() {
  const rows: { tanggal: string; kegiatan: string; tipe: string }[] = [];
  CALENDAR_DATA.kalenderAkademik.kegiatan.forEach(k => {
    k.tanggal.forEach(tgl => rows.push({ tanggal: tgl, kegiatan: k.jenis, tipe: k.eventType }));
  });
  rows.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  return rows;
}

function ExportImportTab() {
  const { user } = useAuth();
  const isAdm = user?.role === 'admin';
  const queryClient = useQueryClient();
  const classes = user?.teacher_classes || [];
  const [selectedClass, setSelectedClass] = useState(classes[0] || '');
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ['settings-students', selectedClass],
    queryFn: async () => { const { data } = await apiClient.get(`/students?class=${encodeURIComponent(selectedClass)}`); return data.data as Student[]; },
    enabled: !!selectedClass,
  });
  const { data: guruList = [] } = useQuery({
    queryKey: ['settings-guru'],
    queryFn: async () => { const { data } = await apiClient.get('/auth/users'); return (data.success ? data.data : []) as User[]; },
    enabled: isAdm,
  });
  const { data: materiList = [] } = useQuery({
    queryKey: ['settings-materi'],
    queryFn: async () => { const { data } = await apiClient.get('/materi'); return data.data as any[]; },
  });

  const runExport = async (key: string) => {
    const item = DATA_ITEMS.find(i => i.key === key);
    if (!item) return;

    if (key === 'tabungan') {
      if (!exportStart || !exportEnd) { toast.error('Pilih rentang tanggal'); return; }
      setLoadingKey(key);
      try {
        const { data } = await apiClient.get(`/tabungan?start_date=${exportStart}&end_date=${exportEnd}`);
        const rows = (data.data as Tabungan[]).map(t => ({
          tanggal: t.tanggal, siswa: t.student_id,
          uang_masuk: t.uang_masuk, uang_keluar: t.uang_keluar,
        }));
        exportXLSX(rows, `tabungan-${exportStart}-${exportEnd}`, item.exportCols);
      } finally { setLoadingKey(null); }
      return;
    }

    if (key === 'kas') {
      setLoadingKey(key);
      try {
        const { data } = await apiClient.get('/kas-umum');
        exportXLSX(data.data as KasUmum[], 'kas-umum', item.exportCols);
      } finally { setLoadingKey(null); }
      return;
    }

    const dataMap: Record<string, any[]> = { siswa: students, guru: guruList, materi: materiList, kalender: makeCalExportRows() };
    const data = dataMap[key] || [];
    exportXLSX(data, `${key === 'kalender' ? 'kalender-pendidikan' : key === 'siswa' ? `data-${key}-${selectedClass}` : `data-${key}`}`, item.exportCols);
  };

  const downloadTemplate = (item: typeof DATA_ITEMS[number]) => {
    if (!item.headers) return;
    const rows = [item.headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {} as Record<string, string>)];
    const sampleRow: Record<string, string> = {};
    item.headers.forEach((h, i) => { sampleRow[h] = (item.sample as string[])[i] || ''; });
    rows.push(sampleRow);
    exportXLSX(rows, `template-${item.key}`, item.headers.map(h => ({ key: h, label: h })));
  };

  const handleImport = async (e: Event, key: string) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0]; if (!file) return;

    const item = DATA_ITEMS.find(i => i.key === key);
    if (!item || !item.importEndpoint) { toast.error('Fitur impor belum tersedia'); return; }

    setLoadingKey(`import-${key}`);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rows.length === 0) { toast.error('File kosong'); return; }

      let count = 0; let errors = 0;
      for (const row of rows) {
        try {
          const payload = item.importMapRow!(row, selectedClass);
          await apiClient.post(item.importEndpoint, payload);
          count++;
        } catch { errors++; }
      }

      if (item.importCacheKey && item.importCacheKey.length > 0) {
        queryClient.invalidateQueries({ queryKey: item.importCacheKey });
      }

      if (errors > 0) toast.success(`${count} data diimpor, ${errors} gagal`);
      else toast.success(`${count} data berhasil diimpor`);
    } catch {
      toast.error('Gagal membaca file. Pastikan format .xlsx benar');
    } finally {
      setLoadingKey(null);
    }
  };

  const triggerImport = (key: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
    input.onchange = (e: Event) => handleImport(e, key);
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-secondary rounded-2xl">
        <div className="relative">
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="select-field pr-8 min-w-[120px] text-sm">
            {classes.length === 0 && <option value="">Pilih Kelas</option>}
            {classes.map(c => <option key={c} value={c}>Kelas {c}</option>)}
          </select>
          <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
        </div>
        <span className="text-xs text-text-tertiary">Rentang tabungan:</span>
        <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} className="input-field w-32 text-xs" />
        <span className="text-text-tertiary">—</span>
        <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} className="input-field w-32 text-xs" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DATA_ITEMS.filter(item => isAdm || item.key !== 'guru').map(item => {
          const isExpLoading = loadingKey === item.key;
          const isImpLoading = loadingKey === `import-${item.key}`;
          const hasImport = !!item.importEndpoint;

          return (
            <div key={item.key} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-black/[0.06] bg-white text-center">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                { siswa: 'from-blue-500 to-cyan-400', guru: 'from-purple-500 to-pink-400', materi: 'from-emerald-500 to-teal-400', tabungan: 'from-amber-500 to-orange-400', kas: 'from-rose-500 to-red-400', kalender: 'from-indigo-500 to-violet-400' }[item.key]
              } flex items-center justify-center text-white shadow-sm`}>
                <i className={`fas ${item.icon} text-sm`}></i>
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => runExport(item.key)}
                  disabled={isExpLoading}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-xl bg-soft-blue text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  {isExpLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                  Ekspor
                </button>
                {hasImport ? (
                  <button
                    onClick={() => triggerImport(item.key)}
                    disabled={isImpLoading}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-xl bg-soft-green text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {isImpLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
                    Impor
                  </button>
                ) : (
                  <button
                    onClick={() => downloadTemplate(item)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-xl bg-soft-purple text-primary hover:bg-purple-100 transition-colors flex items-center gap-1"
                    title="Download template"
                  >
                    <i className="fas fa-file-excel"></i>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg shadow-purple-500/20">
            {user?.name?.charAt(0) || 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold">{user?.name || 'Guru'}</h3>
            <p className="text-sm text-text-tertiary">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-soft-purple text-primary">
                {user?.role === 'admin' ? 'Administrator' : 'Guru Kelas'}
              </span>
              {Array.isArray(user?.teacher_classes) && user.teacher_classes.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-soft-blue text-blue-600">
                  Kelas {user.teacher_classes.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-sm mb-4">Informasi Akun</h3>
        <div className="divide-y divide-black/[0.04]">
          {[
            { label: 'Nama', value: user?.name, icon: 'fa-user' },
            { label: 'Email', value: user?.email, icon: 'fa-envelope' },
            { label: 'Role', value: user?.role === 'admin' ? 'Administrator' : 'Guru', icon: 'fa-shield-halved' },
            { label: 'Kelas', value: Array.isArray(user?.teacher_classes) ? user.teacher_classes.join(', ') : '-', icon: 'fa-school' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-surface-secondary flex items-center justify-center flex-shrink-0">
                <i className={`fas ${item.icon} text-text-tertiary text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-tertiary">{item.label}</p>
                <p className="text-sm font-medium truncate">{item.value || '-'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-sm mb-3">Aksi</h3>
        <Button variant="danger" icon="fa-right-from-bracket" onClick={handleLogout} className="w-full sm:w-auto">
          Keluar
        </Button>
      </Card>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<'ekspor-impor' | 'profil'>('ekspor-impor');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Pengaturan</h1>
        <p className="text-text-secondary text-sm mt-1">Ekspor & impor data, kelola profil</p>
      </div>

      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-black/[0.06] overflow-x-auto">
        {[
          { key: 'ekspor-impor', label: 'Ekspor / Impor', icon: 'fa-download' },
          { key: 'profil', label: 'Profil', icon: 'fa-user' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              tab === t.key
                ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md'
                : 'text-text-secondary hover:bg-black/5'
            }`}
          >
            <i className={`fas ${t.icon}`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ekspor-impor' && <ExportImportTab />}
      {tab === 'profil' && <ProfileTab />}
    </div>
  );
}
