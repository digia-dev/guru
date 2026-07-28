import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/auth/PasswordInput';
import AuthLayout from '../components/auth/AuthLayout';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Selamat datang kembali!');
      navigate('/app', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Terjadi kesalahan';
      toast.error(msg === 'Invalid email or password' ? 'Email atau password salah' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Masuk"
      subtitle="Masuk ke akun AppGuru Anda untuk melanjutkan."
      sideTitle="Kembali Bekerja"
      sideSubtitle="Dashboard, jadwal, dan laporan menunggu Anda. Akses semuanya dari satu tempat."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="guru@sekolah.com" required autoFocus />
        </div>

        <PasswordInput label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" required minLength={8} />

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-violet-600 hover:text-violet-700">Lupa password?</Link>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm">
          {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : null}
          Masuk
        </button>
      </form>

      <div className="mt-8 text-center border-t border-black/[0.06] pt-6">
        <p className="text-sm text-text-tertiary">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-violet-600 hover:text-violet-700">Daftar sekarang</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
