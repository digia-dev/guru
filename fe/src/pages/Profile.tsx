import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { viewingAs, stopImpersonating } = useImpersonation();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setCurrentPassword('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setCurrentPassword('');
  };

  const handleSave = async () => {
    if (!currentPassword) { toast.error('Masukkan password saat ini untuk verifikasi'); return; }
    if (!editName.trim()) { toast.error('Nama tidak boleh kosong'); return; }
    setSaving(true);
    try {
      await apiClient.put('/auth/me', { currentPassword, name: editName.trim(), email: editEmail.trim() });
      toast.success('Profil berhasil diperbarui');
      setEditing(false);
      setCurrentPassword('');
      await refreshUser();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handleExit = async () => {
    if (viewingAs) {
      stopImpersonating();
      navigate('/app/admin/dashboard');
      return;
    }
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">

      <Card>
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/20 mb-3">
            {user?.name?.charAt(0) || '?'}
          </div>
          <h2 className="text-lg font-bold">{user?.name}</h2>
          <p className="text-text-secondary text-xs">{user?.email}</p>
          <span className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-600">
            {viewingAs ? `Melihat sebagai ${viewingAs.teacherName}` : user?.role === 'admin' ? 'Admin' : 'Guru'}
          </span>
        </div>
      </Card>

      {editing ? (
        <Card>
          <h3 className="font-semibold text-sm mb-4">Edit Profil</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Nama</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="input-field" placeholder="email@sekolah.com" />
            </div>
            <div>
              <label className="label">Password Saat Ini</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input-field" placeholder="Masukkan password untuk verifikasi" />
              <p className="text-[10px] text-text-tertiary mt-1">Diperlukan untuk menyimpan perubahan</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !currentPassword} loading={saving}>Simpan</Button>
              <Button variant="ghost" onClick={cancelEditing} disabled={saving}>Batal</Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="divide-y divide-black/[0.06]">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-text-secondary">Nama</span>
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-text-secondary">Email</span>
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-text-secondary">Role</span>
                <span className="text-sm font-medium capitalize">{user?.role}</span>
              </div>
              {user?.role === 'guru' && (
                <>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-text-secondary">Kelas</span>
                    <span className="text-sm font-medium">{(user?.teacher_classes || []).join(', ') || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-text-secondary">Mata Pelajaran</span>
                    <span className="text-sm font-medium">{(user?.teacher_subjects || []).join(', ') || '-'}</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <Button icon="fa-pen" onClick={startEditing}>Edit Profil</Button>
            <Button
              variant="danger"
              className="w-full"
              icon={viewingAs ? 'fa-arrow-left' : 'fa-sign-out-alt'}
              onClick={handleExit}
            >
              {viewingAs ? 'Kembali ke Panel Admin' : 'Keluar'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
