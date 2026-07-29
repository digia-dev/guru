import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

interface Announcement {
  id: number;
  title: string;
  content: string | null;
  target_role: string | null;
  created_by: number;
  sent_at: string | null;
  created_at: string;
  created_by_user?: { name: string };
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [sendPush, setSendPush] = useState(true);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await apiClient.get('/announcements');
      return (data.data || []) as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      apiClient.post('/announcements', { title, content, targetRole: targetRole || null, sendPush }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Pengumuman dikirim!');
      setShowForm(false);
      setTitle('');
      setContent('');
      setTargetRole('');
      setSendPush(true);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Gagal mengirim'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Pengumuman dihapus');
    },
    onError: () => toast.error('Gagal menghapus'),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pengumuman</h2>
          <p className="text-sm text-text-tertiary">Buat dan kirim pengumuman ke guru</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon="fa-plus">Buat Pengumuman</Button>
      </div>

      <Card padding={false}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary">
            <i className="fas fa-bullhorn text-4xl mb-3 block opacity-40"></i>
            <p className="font-medium">Belum ada pengumuman</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {announcements.map((a) => (
              <div key={a.id} className="p-5 hover:bg-surface-secondary transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      {a.sent_at && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-green-100 text-green-700">
                          <i className="fas fa-paper-plane mr-0.5"></i> Terkirim
                        </span>
                      )}
                      {a.target_role && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700">
                          {a.target_role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary whitespace-pre-wrap line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-text-tertiary">
                      <span>{a.created_by_user?.name || 'Admin'}</span>
                      <span>·</span>
                      <span>{new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { if (confirm('Hapus pengumuman ini?')) deleteMutation.mutate(a.id); }}
                    className="text-text-tertiary hover:text-danger text-xs flex-shrink-0"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Buat Pengumuman">
        <div className="space-y-4">
          <div>
            <label className="label">Judul <span className="text-danger">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Judul pengumuman" />
          </div>
          <div>
            <label className="label">Isi Pengumuman</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="input-field" rows={4} placeholder="Tulis isi pengumuman..." />
          </div>
          <div>
            <label className="label">Target</label>
            <div className="relative">
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="select-field">
                <option value="">Semua Guru</option>
                <option value="admin">Admin</option>
                <option value="guru">Guru</option>
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs pointer-events-none"></i>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={sendPush} onChange={(e) => setSendPush(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
            Kirim notifikasi push (jika diizinkan)
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title || createMutation.isPending}
              loading={createMutation.isPending}
              icon="fa-paper-plane"
            >
              Kirim
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
