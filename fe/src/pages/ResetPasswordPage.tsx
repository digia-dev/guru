import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import PasswordInput from '../components/auth/PasswordInput';
import PasswordStrength from '../components/auth/PasswordStrength';
import AuthLayout from '../components/auth/AuthLayout';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Password tidak cocok'); return; }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Password berhasil direset!');
    } catch {
      toast.error('Gagal mereset password. Token mungkin kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Link Tidak Valid" subtitle="Tautan reset password tidak valid atau telah kedaluwarsa." sideTitle="Oops!" sideSubtitle="Minta tautan baru dengan mengklik 'Lupa Password' di halaman login.">
        <Link to="/forgot-password" className="btn-primary w-full inline-block text-center py-3.5 text-sm">Minta Link Baru</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle={done ? 'Password Anda telah berhasil direset.' : 'Buat password baru untuk akun Anda.'} sideTitle="Password Baru" sideSubtitle="Pastikan password baru Anda kuat dan mudah diingat.">
      {done ? (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
              <i className="fas fa-check text-emerald-600 text-base"></i>
            </div>
            <p className="text-sm text-emerald-800 font-medium">Password berhasil diubah!</p>
          </div>
          <button onClick={() => navigate('/login')} className="btn-primary w-full py-3.5 text-sm">Masuk Sekarang</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput label="Password Baru" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 8 karakter" required minLength={8} autoFocus />
          <PasswordStrength password={password} />
          <PasswordInput label="Konfirmasi Password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ketik ulang password" required minLength={8} />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm">
            {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : null}
            Reset Password
          </button>
        </form>
      )}

      <div className="mt-8 text-center border-t border-black/[0.06] pt-6">
        <Link to="/login" className="text-sm font-semibold text-violet-600 hover:text-violet-700">Kembali ke Login</Link>
      </div>
    </AuthLayout>
  );
}
