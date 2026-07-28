import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';

export default function VerifyEmailPage() {
  const location = useLocation();
  const email = (location.state as any)?.email || 'email Anda';
  const justRegistered = (location.state as any)?.justRegistered;

  if (!justRegistered) {
    return (
      <AuthLayout title="Verifikasi Email" subtitle="Link verifikasi telah dikirim ke email Anda." sideTitle="Cek Email" sideSubtitle="Klik link verifikasi yang kami kirim untuk mengaktifkan akun Anda.">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
              <i className="fas fa-envelope text-amber-600 text-base"></i>
            </div>
            <p className="text-sm text-amber-800 font-medium">Cek email Anda</p>
            <p className="text-xs text-amber-600 mt-1">Kami telah mengirim link verifikasi ke {email}.</p>
          </div>
          <Link to="/login" className="btn-primary w-full inline-block text-center py-3.5 text-sm">Kembali ke Login</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Cek Email Anda" subtitle={`Kami telah mengirim link konfirmasi ke ${email}. Klik link tersebut untuk mengaktifkan akun Anda.`} sideTitle="Hampir Selesai" sideSubtitle="Konfirmasi email Anda untuk mulai menggunakan AppGuru. Cek inbox atau folder spam.">
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
            <i className="fas fa-envelope-open text-emerald-600 text-base"></i>
          </div>
          <p className="text-sm text-emerald-800 font-medium">Email terkirim!</p>
          <p className="text-xs text-emerald-600 mt-1">Cek inbox (atau folder spam) untuk link konfirmasi.</p>
        </div>

        <p className="text-center text-sm text-text-tertiary">
          Tidak menerima email?{' '}
          <button className="font-semibold text-violet-600 hover:text-violet-700" onClick={() => window.location.reload()}>Kirim ulang</button>
        </p>

        <div className="text-center">
          <Link to="/login" className="text-sm text-text-tertiary hover:text-text-secondary">
            <i className="fas fa-arrow-left mr-1.5"></i> Kembali ke login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
