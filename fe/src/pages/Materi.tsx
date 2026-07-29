import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Materi, Soal } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ipvkqzpxstugemftmhem.supabase.co';

const JENIS_SOAL_OPTIONS = [
  { value: 'pilihan_ganda', label: 'Pilihan Ganda', icon: 'fa-list-check' },
  { value: 'essay', label: 'Essay', icon: 'fa-pen' },
  { value: 'pilgan_kompleks', label: 'Pilgan Kompleks', icon: 'fa-layer-group' },
  { value: 'menjodohkan', label: 'Menjodohkan', icon: 'fa-arrows-left-right' },
  { value: 'benar_salah', label: 'Benar / Salah', icon: 'fa-check-double' },
  { value: 'isian', label: 'Isian Singkat', icon: 'fa-pencil' },
];

const KESULITAN_OPTIONS = [
  { value: 'mudah', label: 'Mudah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'sulit', label: 'Sulit' },
];

let soalIdCounter = 0;
function newSoalId(): string { return `s_${++soalIdCounter}_${Date.now()}`; }

function createEmptySoal(tipe: string): Soal {
  const base: Soal = { id: newSoalId(), tipe: tipe as Soal['tipe'], pertanyaan: '', jawaban: '', poin: 10 };
  if (tipe === 'pilihan_ganda' || tipe === 'pilgan_kompleks') base.opsi = ['A. ', 'B. ', 'C. ', 'D. '];
  if (tipe === 'benar_salah') base.jawaban = false;
  if (tipe === 'menjodohkan') { base.pasangan_kiri = ['', '']; base.pasangan_kanan = ['', '']; base.jawaban = [{ kiri: 0, kanan: 0 }, { kiri: 1, kanan: 1 }]; }
  if (tipe === 'essay') base.pedoman_penskoran = '';
  return base;
}

function SoalPreview({ soal }: { soal: Soal[] }) {
  return (
    <div className="space-y-4">
      {soal.map((s, i) => (
        <div key={s.id || i} className="p-4 rounded-2xl bg-surface-secondary border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full bg-primary/80">{s.tipe.replace(/_/g, ' ')}</span>
            <span className="text-xs text-text-tertiary">Soal #{i + 1}</span>
            {s.poin && <span className="text-xs text-text-tertiary ml-auto">{s.poin} poin</span>}
          </div>
          <p className="text-sm font-medium mb-2">{s.pertanyaan}</p>
          {s.opsi && (
            <div className="space-y-1 ml-2">
              {s.opsi.map((o, j) => {
                const isCorrect = Array.isArray(s.jawaban)
                  ? (s.jawaban as string[]).includes(o.charAt(0))
                  : s.jawaban === o.charAt(0);
                return (
                  <p key={j} className={`text-xs ${isCorrect ? 'text-green-600 font-semibold' : 'text-text-secondary'}`}>
                    {o} {isCorrect && <i className="fas fa-check text-green-500 ml-1"></i>}
                  </p>
                );
              })}
            </div>
          )}
          {s.tipe === 'benar_salah' && (
            <p className="text-xs ml-2">Jawaban: <span className="font-semibold text-green-600">{s.jawaban ? 'Benar' : 'Salah'}</span></p>
          )}
          {s.tipe === 'essay' && s.jawaban && (
            <div className="ml-2 mt-1">
              <p className="text-xs text-text-tertiary">Kunci Jawaban:</p>
              <p className="text-xs text-green-600">{s.jawaban as string}</p>
            </div>
          )}
          {s.tipe === 'menjodohkan' && s.pasangan_kiri && s.pasangan_kanan && (
            <div className="ml-2 grid grid-cols-2 gap-2 mt-1">
              <div>
                {s.pasangan_kiri.map((p, j) => (
                  <p key={j} className="text-xs text-text-secondary">{j + 1}. {p}</p>
                ))}
              </div>
              <div>
                {(s.jawaban as { kiri: number; kanan: number }[]).map((j, idx) => (
                  <p key={idx} className="text-xs text-green-600 font-medium">{String.fromCharCode(97 + j.kanan)}. {s.pasangan_kanan![j.kanan]}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EditSoalForm({ soal, onChange }: { soal: Soal[]; onChange: (soal: Soal[]) => void }) {
  const updateSoal = (idx: number, field: string, value: unknown) => {
    const next = soal.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    onChange(next);
  };
  const updateOpsi = (soalIdx: number, opsiIdx: number, val: string) => {
    const s = soal[soalIdx];
    if (!s.opsi) return;
    const next = [...s.opsi];
    next[opsiIdx] = val;
    updateSoal(soalIdx, 'opsi', next);
  };
  const addOpsi = (soalIdx: number) => {
    const s = soal[soalIdx];
    const nextOpsi = [...(s.opsi || []), `${String.fromCharCode(97 + (s.opsi?.length || 0))}. `];
    updateSoal(soalIdx, 'opsi', nextOpsi);
  };
  const removeOpsi = (soalIdx: number, opsiIdx: number) => {
    const s = soal[soalIdx];
    if (!s.opsi || s.opsi.length <= 2) return;
    updateSoal(soalIdx, 'opsi', s.opsi.filter((_, i) => i !== opsiIdx));
  };
  const removeSoal = (idx: number) => onChange(soal.filter((_, i) => i !== idx));
  const addSoal = (tipe: string) => onChange([...soal, createEmptySoal(tipe)]);

  return (
    <div className="space-y-4">
      {soal.map((s, idx) => (
        <div key={s.id || idx} className="p-4 rounded-2xl border border-black/[0.08] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full bg-primary/80">{s.tipe.replace(/_/g, ' ')}</span>
            <button onClick={() => removeSoal(idx)} className="text-xs text-danger hover:text-red-700"><i className="fas fa-trash-alt mr-1"></i>Hapus</button>
          </div>
          <textarea value={s.pertanyaan} onChange={(e) => updateSoal(idx, 'pertanyaan', e.target.value)} className="input-field text-sm" rows={2} placeholder="Teks pertanyaan..." />
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">Poin:</span>
            <input type="number" value={s.poin || 10} onChange={(e) => updateSoal(idx, 'poin', parseInt(e.target.value) || 10)} className="input-field w-20 text-xs" />
          </div>
          {(s.tipe === 'pilihan_ganda' || s.tipe === 'pilgan_kompleks') && (
            <div className="space-y-1">
              {s.opsi?.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input type="text" value={o} onChange={(e) => updateOpsi(idx, oi, e.target.value)} className="input-field text-xs flex-1" placeholder={`Opsi ${String.fromCharCode(65 + oi)}`} />
                  {s.tipe === 'pilihan_ganda' && (
                    <input type="radio" name={`jawaban_${idx}`} checked={s.jawaban === o.charAt(0)} onChange={() => updateSoal(idx, 'jawaban', o.charAt(0))} className="w-4 h-4 accent-primary" title="Jawaban benar" />
                  )}
                  {s.tipe === 'pilgan_kompleks' && (
                    <input type="checkbox" checked={Array.isArray(s.jawaban) && (s.jawaban as string[]).includes(o.charAt(0))} onChange={() => {
                      const arr = (Array.isArray(s.jawaban) ? [...s.jawaban] : []) as string[];
                      const next = arr.includes(o.charAt(0)) ? arr.filter(v => v !== o.charAt(0)) : [...arr, o.charAt(0)];
                      updateSoal(idx, 'jawaban', next);
                    }} className="w-4 h-4 accent-primary" title="Centang jika benar" />
                  )}
                  <button onClick={() => removeOpsi(idx, oi)} className="text-text-tertiary hover:text-danger text-xs"><i className="fas fa-times"></i></button>
                </div>
              ))}
              <button onClick={() => addOpsi(idx)} className="text-xs text-primary mt-1"><i className="fas fa-plus mr-1"></i>Tambah opsi</button>
            </div>
          )}
          {s.tipe === 'benar_salah' && (
            <div className="flex gap-4 ml-2">
              <label className="flex items-center gap-1 text-xs"><input type="radio" name={`bs_${idx}`} checked={s.jawaban === true} onChange={() => updateSoal(idx, 'jawaban', true)} className="accent-primary" /> Benar</label>
              <label className="flex items-center gap-1 text-xs"><input type="radio" name={`bs_${idx}`} checked={s.jawaban === false} onChange={() => updateSoal(idx, 'jawaban', false)} className="accent-primary" /> Salah</label>
            </div>
          )}
          {s.tipe === 'essay' && (
            <div>
              <input type="text" value={s.jawaban as string || ''} onChange={(e) => updateSoal(idx, 'jawaban', e.target.value)} className="input-field text-xs" placeholder="Kunci jawaban..." />
              <textarea value={s.pedoman_penskoran || ''} onChange={(e) => updateSoal(idx, 'pedoman_penskoran', e.target.value)} className="input-field text-xs mt-1" rows={2} placeholder="Pedoman penskoran..." />
            </div>
          )}
          {s.tipe === 'isian' && (
            <input type="text" value={s.jawaban as string || ''} onChange={(e) => updateSoal(idx, 'jawaban', e.target.value)} className="input-field text-xs" placeholder="Jawaban..." />
          )}
          {s.tipe === 'menjodohkan' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-text-tertiary mb-1">Kolom Kiri</p>
                {s.pasangan_kiri?.map((p, pi) => (
                  <input key={pi} type="text" value={p} onChange={(e) => {
                    const next = [...(s.pasangan_kiri || [])];
                    next[pi] = e.target.value;
                    updateSoal(idx, 'pasangan_kiri', next);
                  }} className="input-field text-xs mb-1" placeholder={`Item ${pi + 1}`} />
                ))}
                <button onClick={() => updateSoal(idx, 'pasangan_kiri', [...(s.pasangan_kiri || []), ''])} className="text-xs text-primary"><i className="fas fa-plus mr-1"></i>Tambah</button>
              </div>
              <div>
                <p className="text-[10px] text-text-tertiary mb-1">Kolom Kanan</p>
                {s.pasangan_kanan?.map((p, pi) => (
                  <input key={pi} type="text" value={p} onChange={(e) => {
                    const next = [...(s.pasangan_kanan || [])];
                    next[pi] = e.target.value;
                    updateSoal(idx, 'pasangan_kanan', next);
                  }} className="input-field text-xs mb-1" placeholder={`Item ${pi + 1}`} />
                ))}
                <button onClick={() => updateSoal(idx, 'pasangan_kanan', [...(s.pasangan_kanan || []), ''])} className="text-xs text-primary"><i className="fas fa-plus mr-1"></i>Tambah</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-2">
        <span className="text-xs text-text-tertiary self-center">Tambah soal:</span>
        {JENIS_SOAL_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => addSoal(opt.value)} className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white border border-black/[0.08] hover:border-primary/40 text-text-secondary hover:text-primary transition-all">
            <i className={`fas ${opt.icon} mr-1`}></i>{opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailMateri({ materi, onClose, onSaved }: { materi: Materi; onClose: () => void; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editJudul, setEditJudul] = useState(materi.title);
  const [editKonten, setEditKonten] = useState(materi.konten || '');
  const [editSoal, setEditSoal] = useState<Soal[]>(materi.soal || []);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => apiClient.put(`/materi/${materi.id}`, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materi'] }); toast.success('Materi disimpan!'); setEditMode(false); onSaved(); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Gagal menyimpan'),
  });

  const handleSaveEdit = () => {
    saveMutation.mutate({ title: editJudul, konten: editKonten, soal: editSoal });
  };

  const handleExport = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${supabaseUrl}/functions/v1/materi?id=${materi.id}&export=1`, {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      window.open(URL.createObjectURL(blob), '_blank');
    } catch { toast.error('Gagal export materi'); }
  };

  return (
    <Modal open={true} onClose={onClose} title={editMode ? 'Edit Materi' : materi.title} size="lg">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {materi.topik && !editMode && (
          <div className="flex flex-wrap gap-2">
            {materi.mapel && <span className="badge badge-primary">{materi.mapel}</span>}
            {materi.kelas && <span className="badge badge-secondary">Kelas {materi.kelas}</span>}
            {materi.tingkat_kesulitan && <span className="badge badge-soft">{materi.tingkat_kesulitan}</span>}
            {materi.durasi && <span className="badge badge-soft">{materi.durasi} menit</span>}
          </div>
        )}

        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="label">Judul</label>
              <input type="text" value={editJudul} onChange={(e) => setEditJudul(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Konten Materi</label>
              <textarea value={editKonten} onChange={(e) => setEditKonten(e.target.value)} className="input-field font-mono text-xs" rows={8} />
            </div>
            <div>
              <label className="label">Soal ({editSoal.length})</label>
              <EditSoalForm soal={editSoal} onChange={setEditSoal} />
            </div>
          </div>
        ) : (
          <>
            {materi.type === 'konten' && materi.konten ? (
              <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap text-text-primary">{materi.konten}</div>
            ) : (
              <a href={materi.url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">{materi.url}</a>
            )}
            {materi.soal && materi.soal.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3">Soal ({materi.soal.length})</h4>
                <SoalPreview soal={materi.soal} />
              </div>
            )}
          </>
        )}

        <div className="flex justify-between gap-2 pt-2 border-t border-black/[0.06]">
          <div className="flex gap-2">
            {!editMode && <Button variant="secondary" size="sm" icon="fa-print" onClick={handleExport}>Cetak / Export</Button>}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>{editMode ? 'Batal' : 'Tutup'}</Button>
            {materi.type === 'konten' && (
              editMode ? (
                <Button size="sm" icon="fa-save" onClick={handleSaveEdit} loading={saveMutation.isPending} disabled={saveMutation.isPending}>Simpan</Button>
              ) : (
                <Button size="sm" icon="fa-edit" onClick={() => { setEditJudul(materi.title); setEditKonten(materi.konten || ''); setEditSoal(materi.soal || []); setEditMode(true); }}>Edit</Button>
              )
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function FormMateriBaru({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const teacherSubjects = user?.teacher_subjects || [];

  const [mode, setMode] = useState<'link' | 'generate'>('generate');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const [topik, setTopik] = useState('');
  const [mapel, setMapel] = useState(teacherSubjects[0] || '');
  const [kelas, setKelas] = useState('');
  const [tingkatKesulitan, setTingkatKesulitan] = useState('sedang');
  const [jenisSoal, setJenisSoal] = useState<string[]>(['pilihan_ganda', 'essay']);
  const [jumlahSoal, setJumlahSoal] = useState(2);
  const [durasi, setDurasi] = useState(30);
  const [kataKunci, setKataKunci] = useState('');
  const [gayaBahasa, setGayaBahasa] = useState('sesuai usia siswa SMP');

  const [generated, setGenerated] = useState<{ judul: string; konten: string; soal: Soal[] } | null>(null);
  const [generating, setGenerating] = useState(false);

  const toggleJenisSoal = (val: string) => {
    setJenisSoal((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const handleGenerate = async () => {
    if (!topik) { toast.error('Tema/topik harus diisi'); return; }
    if (jenisSoal.length === 0) { toast.error('Pilih minimal 1 jenis soal'); return; }
    setGenerating(true);
    try {
      const { data } = await apiClient.post('/ai/generate-materi', {
        topik, mapel, kelas: kelas || undefined,
        tingkat_kesulitan: tingkatKesulitan,
        jenis_soal: jenisSoal, jumlah_soal: jumlahSoal,
        durasi, kata_kunci: kataKunci || undefined,
        gaya_bahasa: gayaBahasa,
      });
      if (data.success && data.data) {
        setGenerated({
          judul: data.data.judul || `Materi: ${topik}`,
          konten: data.data.konten || '',
          soal: (data.data.soal || []).map((s: Soal) => ({ ...s, id: newSoalId() })),
        });
        toast.success('Materi berhasil digenerate!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal generate materi');
    } finally {
      setGenerating(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => apiClient.post('/materi', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materi'] });
      toast.success('Materi disimpan!');
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Gagal menyimpan'),
  });

  const handleSave = () => {
    if (mode === 'link') {
      if (!title || !url) { toast.error('Judul dan URL harus diisi'); return; }
      saveMutation.mutate({ title, url, type: 'link' });
    } else if (generated) {
      saveMutation.mutate({
        title: generated.judul,
        type: 'konten',
        konten: generated.konten,
        soal: generated.soal,
        topik, mapel, kelas: kelas || null,
        tingkat_kesulitan: tingkatKesulitan,
        durasi, generate_params: { jenis_soal: jenisSoal, jumlah_soal: jumlahSoal, kata_kunci: kataKunci, gaya_bahasa: gayaBahasa },
      });
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Buat Materi Baru" size="lg">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div className="flex gap-2 bg-surface-secondary rounded-2xl p-1">
          <button onClick={() => setMode('generate')} className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${mode === 'generate' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
            <i className="fas fa-wand-magic-sparkles mr-1.5"></i> Generate AI
          </button>
          <button onClick={() => setMode('link')} className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${mode === 'link' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
            <i className="fas fa-link mr-1.5"></i> Link/URL
          </button>
        </div>

        {mode === 'link' ? (
          <div className="space-y-3">
            <div>
              <label className="label">Judul</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Judul materi" />
            </div>
            <div>
              <label className="label">URL</label>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input-field" placeholder="https://..." />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">Tema / Topik <span className="text-danger">*</span></label>
              <textarea value={topik} onChange={(e) => setTopik(e.target.value)} className="input-field" rows={2} placeholder="Contoh: Sistem Pernapasan Manusia, Teorema Pythagoras, Proklamasi Kemerdekaan..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Mata Pelajaran</label>
                <div className="relative">
                  <select value={mapel} onChange={(e) => setMapel(e.target.value)} className="select-field">
                    <option value="">Pilih Mapel</option>
                    {teacherSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="__other__">Lainnya...</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
                </div>
                {mapel === '__other__' && (
                  <input type="text" value={mapel} onChange={(e) => setMapel(e.target.value)} className="input-field mt-1" placeholder="Nama mapel" />
                )}
              </div>
              <div>
                <label className="label">Kelas</label>
                <input type="text" value={kelas} onChange={(e) => setKelas(e.target.value)} className="input-field" placeholder="Contoh: 7-1, 8-2, 9" />
              </div>
            </div>

            <div>
              <label className="label">Jenis Soal</label>
              <div className="flex flex-wrap gap-2">
                {JENIS_SOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleJenisSoal(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      jenisSoal.includes(opt.value)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-text-secondary border-black/[0.08] hover:border-primary/40'
                    }`}
                  >
                    <i className={`fas ${opt.icon} mr-1`}></i>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Jumlah Soal per Jenis</label>
                <input type="number" min={1} max={10} value={jumlahSoal} onChange={(e) => setJumlahSoal(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} className="input-field" />
              </div>
              <div>
                <label className="label">Tingkat Kesulitan</label>
                <div className="relative">
                  <select value={tingkatKesulitan} onChange={(e) => setTingkatKesulitan(e.target.value)} className="select-field">
                    {KESULITAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
                </div>
              </div>
              <div>
                <label className="label">Durasi (menit)</label>
                <input type="number" min={5} max={180} value={durasi} onChange={(e) => setDurasi(parseInt(e.target.value) || 30)} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Kata Kunci (opsional)</label>
                <input type="text" value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} className="input-field" placeholder="Misal: bronkus, alveolus, difusi" />
              </div>
              <div>
                <label className="label">Gaya Bahasa</label>
                <div className="relative">
                  <select value={gayaBahasa} onChange={(e) => setGayaBahasa(e.target.value)} className="select-field">
                    <option value="sesuai usia siswa SMP">Sesuai usia siswa SMP</option>
                    <option value="formal akademik">Formal / Akademik</option>
                    <option value="ringan dan santai">Ringan dan santai</option>
                    <option value="bergaya bercerita">Bergaya bercerita</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
                </div>
              </div>
            </div>

            <Button onClick={handleGenerate} loading={generating} disabled={generating || !topik} className="w-full" icon="fa-wand-magic-sparkles">
              {generating ? 'Menggenerate...' : 'Generate Materi dengan AI'}
            </Button>

            {generated && (
              <div className="space-y-4 border-t border-black/[0.06] pt-4">
                <h4 className="font-semibold text-sm">Hasil Generate</h4>
                <div>
                  <label className="label">Judul</label>
                  <input type="text" value={generated.judul} onChange={(e) => setGenerated((prev) => prev ? { ...prev, judul: e.target.value } : null)} className="input-field" />
                </div>
                <div>
                  <label className="label">Konten Materi</label>
                  <textarea value={generated.konten} onChange={(e) => setGenerated((prev) => prev ? { ...prev, konten: e.target.value } : null)} className="input-field font-mono text-xs" rows={8} />
                </div>
                {generated.soal.length > 0 && (
                  <div>
                    <label className="label">Soal ({generated.soal.length})</label>
                    <EditSoalForm soal={generated.soal} onChange={(soal) => setGenerated((prev) => prev ? { ...prev, soal } : null)} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button
            onClick={handleSave}
            loading={saveMutation.isPending}
            disabled={saveMutation.isPending || (mode === 'link' ? (!title || !url) : !generated)}
            icon="fa-save"
          >
            Simpan Materi
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function MateriPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [detailMateri, setDetailMateri] = useState<Materi | null>(null);
  const [detailKey, setDetailKey] = useState(0);
  const [filterJenis, setFilterJenis] = useState<string>('semua');

  const { data: materiList = [], isLoading } = useQuery({
    queryKey: ['materi'],
    queryFn: async () => { const { data } = await apiClient.get('/materi'); return (data.data || []) as Materi[]; },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/materi/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['materi'] }); toast.success('Materi dihapus'); },
    onError: () => toast.error('Gagal menghapus'),
  });

  const filtered = filterJenis === 'semua' ? materiList : materiList.filter((m) => m.type === filterJenis);

  const groupedMateri = filtered.reduce((acc, m) => {
    const key = m.type === 'konten' ? 'Hasil AI' : m.type === 'link' ? 'Tautan' : m.type === 'video' ? 'Video' : m.type === 'dokumen' ? 'Dokumen' : 'Lainnya';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, Materi[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Materi Pembelajaran</h2>
          <p className="text-sm text-text-tertiary">Kelola materi dan buat materi otomatis dengan AI</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon="fa-plus">
          Buat Materi Baru
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['semua', 'konten', 'link', 'video', 'dokumen'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterJenis(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              filterJenis === f
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-text-secondary border border-black/[0.08] hover:border-primary/40'
            }`}
          >
            {f === 'semua' ? 'Semua' : f === 'konten' ? 'Hasil AI' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
        </div>
      ) : Object.keys(groupedMateri).length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
          <i className="fas fa-book-open text-4xl mb-3 block opacity-40"></i>
          <p className="font-medium">Belum ada materi</p>
          <p className="text-sm mt-1">Klik "Buat Materi Baru" untuk mulai</p>
        </div>
      ) : (
        Object.entries(groupedMateri).map(([group, items]) => (
          <div key={group}>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
              <i className={`fas ${
                group === 'Hasil AI' ? 'fa-wand-magic-sparkles' : group === 'Tautan' ? 'fa-link' : group === 'Video' ? 'fa-video' : group === 'Dokumen' ? 'fa-file-alt' : 'fa-folder'
              }`}></i>
              {group}
              <span className="text-xs text-text-tertiary font-normal">({items.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {items.map((m) => (
                <Card key={m.id} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setDetailMateri(m); setDetailKey(k => k + 1); }}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      m.type === 'konten' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                      m.type === 'video' ? 'bg-gradient-to-br from-blue-500 to-cyan-400' :
                      m.type === 'dokumen' ? 'bg-gradient-to-br from-emerald-500 to-teal-400' :
                      'bg-gradient-to-br from-amber-500 to-orange-400'
                    } text-white shadow-sm`}>
                      <i className={`fas text-sm ${
                        m.type === 'konten' ? 'fa-wand-magic-sparkles' :
                        m.type === 'video' ? 'fa-video' :
                        m.type === 'dokumen' ? 'fa-file-alt' : 'fa-link'
                      }`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{m.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {m.mapel && <span className="text-[10px] text-text-tertiary bg-surface-secondary px-1.5 py-0.5 rounded">{m.mapel}</span>}
                        {m.kelas && <span className="text-[10px] text-text-tertiary">Kelas {m.kelas}</span>}
                        {m.soal && m.soal.length > 0 && (
                          <span className="text-[10px] text-amber-600 font-medium">{m.soal.length} soal</span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-tertiary mt-1">
                        {new Date(m.uploaded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm('Hapus materi ini?')) deleteMutation.mutate(m.id); }}
                      className="text-text-tertiary hover:text-danger transition-all text-xs"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {showForm && <FormMateriBaru onClose={() => setShowForm(false)} />}
      {detailMateri && <DetailMateri key={detailKey} materi={detailMateri} onClose={() => setDetailMateri(null)} onSaved={() => setDetailMateri(null)} />}
    </div>
  );
}
