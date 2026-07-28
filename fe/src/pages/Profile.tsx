import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useImpersonation } from '../context/ImpersonationContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Profile() {
  const { user, logout } = useAuth();
  const { viewingAs, stopImpersonating } = useImpersonation();
  const navigate = useNavigate();

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
      <div>
        <h1 className="page-title">Profil</h1>
        <p className="text-text-secondary mt-1">Informasi akun Anda</p>
      </div>

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

      <Button
        variant="danger"
        className="w-full"
        icon={viewingAs ? 'fa-arrow-left' : 'fa-sign-out-alt'}
        onClick={handleExit}
      >
        {viewingAs ? 'Kembali ke Panel Admin' : 'Keluar'}
      </Button>
    </div>
  );
}
