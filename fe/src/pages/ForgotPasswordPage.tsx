import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AuthLayout from '../components/auth/AuthLayout';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Link reset password telah dikirim ke email Anda.');
    } catch {
      toast.error('Gagal mengirim email. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Lupa Password"
      subtitle={sent ? 'Cek email Anda untuk link reset password.' : 'Masukkan email Anda dan kami akan kirimkan link reset password.'}
      sideTitle="Tenang, Kami Bantu"
      sideSubtitle="Kami akan mengirimkan tautan reset password ke email Anda dalam beberapa detik."
    >
      {sent ? (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
              <i className="fas fa-envelope-open text-emerald-600 text-base"></i>
            </div>
            <p className="text-sm text-emerald-800 font-medium">Email terkirim!</p>
            <p className="text-xs text-emerald-600 mt-1">Cek inbox (atau spam) untuk tautan reset password.</p>
          </div>
          <button onClick={() => navigate('/login')} className="btn-primary w-full py-3.5 text-sm">
            Kembali ke Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fp-email" className="label">Email</label>
            <input id="fp-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="guru@sekolah.com" required autoFocus />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm">
            {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : null}
            Kirim Link Reset
          </button>
        </form>
      )}

      <div className="mt-8 text-center border-t border-black/[0.06] pt-6">
        <p className="text-sm text-text-tertiary">
          Ingat password?{' '}
          <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700">Masuk</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
