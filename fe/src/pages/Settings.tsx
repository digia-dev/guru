import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { Student, User, Tabungan, Materi, AcademicYear, Semester } from '../types';
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
    key: 'materi', icon: 'fa-book', label: 'Materi', desc: 'Judul, tipe, topik, mapel, kelas',
    headers: ['Judul', 'Tipe', 'Topik', 'Mapel', 'Kelas'],
    sample: ['Barisan & Deret', 'dokumen', 'Matematika', 'Matematika', '7-1'],
    exportCols: [
      { key: 'title', label: 'Judul' }, { key: 'type', label: 'Tipe' },
      { key: 'topik', label: 'Topik' }, { key: 'mapel', label: 'Mapel' },
      { key: 'kelas', label: 'Kelas' },
    ],
  },
  {
    key: 'kalender', icon: 'fa-calendar-alt', label: 'Kalender Pendidikan', desc: 'Semua acara tahun ajaran',
    headers: ['Tanggal', 'Kegiatan', 'Tipe'],
    sample: ['2025-07-07', 'Kegiatan Awal Masuk Sekolah', 'awal-sekolah'],
    exportCols: [{ key: 'tanggal', label: 'Tanggal' }, { key: 'kegiatan', label: 'Kegiatan' }, { key: 'tipe', label: 'Tipe' }],
  },
];

const GRADIENT_MAP: Record<string, string> = {
  siswa: 'from-blue-500 to-cyan-400',
  guru: 'from-purple-500 to-pink-400',
  tabungan: 'from-amber-500 to-orange-400',
  materi: 'from-emerald-500 to-teal-400',
  kalender: 'from-indigo-500 to-violet-400',
};

function makeCalExportRows() {
  const rows: { tanggal: string; kegiatan: string; tipe: string }[] = [];
  CALENDAR_DATA.kalenderAkademik.kegiatan.forEach(k => {
    k.tanggal.forEach(tgl => rows.push({ tanggal: tgl, kegiatan: k.jenis, tipe: k.eventType }));
  });
  rows.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  return rows;
}

export default function Settings() {
  const { user } = useAuth();
  const isAdm = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const [bobotHarian, setBobotHarian] = useState(40);
  const [bobotSts, setBobotSts] = useState(30);
  const [bobotSas, setBobotSas] = useState(30);
  const [bobotSaving, setBobotSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreModal, setRestoreModal] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ['settings-students'],
    queryFn: async () => { const { data } = await apiClient.get('/students'); return (data.data || []) as Student[]; },
  });
  const { data: guruList = [] } = useQuery({
    queryKey: ['settings-guru'],
    queryFn: async () => { const { data } = await apiClient.get('/auth/users'); return (data.success ? data.data : []) as User[]; },
    enabled: isAdm,
  });
  const { data: tabunganData = [] } = useQuery({
    queryKey: ['settings-tabungan'],
    queryFn: async () => { const { data } = await apiClient.get('/tabungan'); return (data.data || []) as Tabungan[]; },
  });
  const { data: materiData = [] } = useQuery({
    queryKey: ['settings-materi'],
    queryFn: async () => { const { data } = await apiClient.get('/materi'); return (data.data || []) as Materi[]; },
  });

  const { data: gradeWeights } = useQuery({
    queryKey: ['grade-weights'],
    queryFn: async () => { const { data } = await apiClient.get('/auth/grade-weights'); setBobotHarian(data.data.bobot_harian); setBobotSts(data.data.bobot_sts); setBobotSas(data.data.bobot_sas); return data.data; },
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => { const { data } = await apiClient.get('/academic-years'); return (data.data || []) as AcademicYear[]; },
  });
  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => { const { data } = await apiClient.get('/semesters'); return (data.data || []) as Semester[]; },
  });

  const runExport = async (key: string) => {
    const item = DATA_ITEMS.find(i => i.key === key);
    if (!item) return;

    setLoadingKey(key);
    let rows: any[] = [];
    let filename = `data-${key}`;

    if (key === 'tabungan') {
      rows = tabunganData.map(t => ({ tanggal: t.tanggal, siswa: t.student_id, uang_masuk: t.uang_masuk, uang_keluar: t.uang_keluar }));
    } else if (key === 'materi') {
      rows = materiData.map(m => ({ title: m.title, type: m.type, topik: m.topik || '', mapel: m.mapel || '', kelas: m.kelas || '' }));
    } else if (key === 'kalender') {
      rows = makeCalExportRows();
      filename = 'kalender-pendidikan';
    } else if (key === 'siswa') {
      rows = students;
    } else if (key === 'guru') {
      rows = guruList;
    }

    exportXLSX(rows, filename, item.exportCols);
    setLoadingKey(null);
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
          const payload = item.importMapRow!(row, '');
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

  const saveBobot = async () => {
    setBobotSaving(true);
    try {
      await apiClient.put('/auth/grade-weights', { bobot_harian: bobotHarian, bobot_sts: bobotSts, bobot_sas: bobotSas });
      toast.success('Bobot nilai berhasil disimpan');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal menyimpan bobot');
    } finally {
      setBobotSaving(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const { data } = await apiClient.get('/auth/backup');
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup berhasil diunduh');
    } catch {
      toast.error('Gagal membuat backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.students || !parsed.attendance) { toast.error('Format backup tidak valid'); return; }
      await apiClient.post('/auth/restore', parsed);
      toast.success('Restore berhasil');
      queryClient.invalidateQueries();
    } catch {
      toast.error('Gagal restore. Pastikan file backup valid');
    } finally {
      setRestoreModal(false);
      e.target.value = '';
    }
  };

  const triggerRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => handleRestore(e);
    input.click();
  };

  const triggerImport = (key: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
    input.onchange = (e: Event) => handleImport(e, key);
    input.click();
  };

  const activeYear = academicYears.find((y) => y.is_active);
  const activeSemester = semesters.find((s) => s.is_active);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DATA_ITEMS.filter(item => isAdm || item.key !== 'guru').map(item => {
          const isExpLoading = loadingKey === item.key;
          const isImpLoading = loadingKey === `import-${item.key}`;
          const hasImport = !!item.importEndpoint;

          return (
            <div key={item.key} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-black/[0.06] bg-white text-center">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENT_MAP[item.key] || 'from-gray-500 to-gray-400'} flex items-center justify-center text-white shadow-sm`}>
                <i className={`fas ${item.icon} text-sm`}></i>
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => downloadTemplate(item)}
                  className="text-xs px-2 py-1.5 rounded-xl bg-soft-purple text-primary hover:bg-purple-100 transition-colors"
                  title="Download template Excel"
                >
                  <i className="fas fa-file-excel"></i>
                </button>
                <button
                  onClick={() => runExport(item.key)}
                  disabled={isExpLoading}
                  className="text-xs px-2 py-1.5 rounded-xl bg-soft-blue text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  title="Export Excel"
                >
                  {isExpLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                </button>
                {hasImport ? (
                  <button
                    onClick={() => triggerImport(item.key)}
                    disabled={isImpLoading}
                    className="text-xs px-2 py-1.5 rounded-xl bg-soft-green text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
                    title="Import Excel"
                  >
                    {isImpLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bobot Nilai */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-sm">
            <i className="fas fa-weight-scale text-sm"></i>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Bobot Nilai</h3>
            <p className="text-[10px] text-text-tertiary">Total harus 100%</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Harian (%)</label>
            <input type="number" min={0} max={100} value={bobotHarian} onChange={e => {
              const v = parseInt(e.target.value) || 0;
              setBobotHarian(v);
            }} className="input-field text-center text-lg font-bold" />
          </div>
          <div>
            <label className="label">STS (%)</label>
            <input type="number" min={0} max={100} value={bobotSts} onChange={e => {
              const v = parseInt(e.target.value) || 0;
              setBobotSts(v);
            }} className="input-field text-center text-lg font-bold" />
          </div>
          <div>
            <label className="label">SAS (%)</label>
            <input type="number" min={0} max={100} value={bobotSas} onChange={e => {
              const v = parseInt(e.target.value) || 0;
              setBobotSas(v);
            }} className="input-field text-center text-lg font-bold" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${bobotHarian + bobotSts + bobotSas === 100 ? 'text-green-600' : 'text-red-500'}`}>
            Total: {bobotHarian + bobotSts + bobotSas}%
            {bobotHarian + bobotSts + bobotSas !== 100 && ' (harus 100%)'}
          </span>
          <Button size="sm" onClick={saveBobot} disabled={bobotSaving || bobotHarian + bobotSts + bobotSas !== 100} loading={bobotSaving}>
            Simpan Bobot
          </Button>
        </div>
      </Card>

      {/* Tahun Ajaran */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-400 flex items-center justify-center text-white shadow-sm">
            <i className="fas fa-calendar-alt text-sm"></i>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Tahun Ajaran</h3>
            <p className="text-[10px] text-text-tertiary">Periode akademik aktif</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-secondary">
            <span className="text-sm text-text-secondary">Tahun Ajaran</span>
            <span className="text-sm font-semibold">{activeYear?.name || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-secondary">
            <span className="text-sm text-text-secondary">Semester</span>
            <span className="text-sm font-semibold">{activeSemester?.name || '-'}</span>
          </div>
          {(activeYear?.start_date || activeYear?.end_date) && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-secondary">
              <span className="text-sm text-text-secondary">Periode</span>
              <span className="text-sm font-medium">
                {activeYear?.start_date ? new Date(activeYear.start_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                {activeYear?.end_date ? ` - ${new Date(activeYear.end_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-400 flex items-center justify-center text-white shadow-sm">
            <i className="fas fa-database text-sm"></i>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Backup & Restore</h3>
            <p className="text-[10px] text-text-tertiary">Cadangkan atau pulihkan seluruh data</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button icon="fa-download" onClick={handleBackup} loading={backupLoading} disabled={backupLoading}>Backup</Button>
          <Button variant="secondary" icon="fa-upload" onClick={triggerRestore}>Restore</Button>
        </div>
      </Card>
    </div>
  );
}
