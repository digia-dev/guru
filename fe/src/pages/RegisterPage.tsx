import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/auth/PasswordInput';
import PasswordStrength from '../components/auth/PasswordStrength';
import AuthLayout from '../components/auth/AuthLayout';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Akun berhasil dibuat! Silakan login.');
      navigate('/login');
    } catch (err: any) {
      const raw = err?.response?.data?.error || err?.message || 'Gagal mendaftar';
      const msg = Array.isArray(raw)
        ? raw.map((e: any) =>
          e.path?.includes('password') && e.code === 'too_small' ? 'Password minimal 8 karakter' : (e.message || JSON.stringify(e))
        ).join(', ')
        : String(raw);
      toast.error(msg === 'Email already registered' ? 'Email sudah terdaftar, silakan login' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Daftar Akun"
      subtitle="Bergabung dengan 12.000+ guru di seluruh Indonesia. Gratis!"
      sideTitle="Mulai Perjalanan Anda"
      sideSubtitle="Kelola administrasi, atur jadwal, dan lacak kinerja — semuanya dari satu platform."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="label">Nama Lengkap</label>
          <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Nama lengkap" required autoFocus />
        </div>

        <div>
          <label htmlFor="reg-email" className="label">Email</label>
          <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="guru@sekolah.com" required />
        </div>

        <div>
          <PasswordInput label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 8 karakter" required minLength={8} />
          <PasswordStrength password={password} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm">
          {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : null}
          Buat Akun
        </button>
      </form>

      <div className="mt-8 text-center border-t border-black/[0.06] pt-6">
        <p className="text-sm text-text-tertiary">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700">Masuk</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
