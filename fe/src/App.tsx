import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthGuard } from './context/AuthContext';
import { useImpersonation } from './context/ImpersonationContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Absensi = lazy(() => import('./pages/Absensi'));
const Nilai = lazy(() => import('./pages/Nilai'));
const PenilaianSemester = lazy(() => import('./pages/PenilaianSemester'));
const AnalisisNilai = lazy(() => import('./pages/AnalisisNilai'));
const Data = lazy(() => import('./pages/Data'));
const KalenderPendidikan = lazy(() => import('./pages/KalenderPendidikan'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AcademicYearsPage = lazy(() => import('./pages/admin/AcademicYearsPage'));
const SubjectsPage = lazy(() => import('./pages/admin/SubjectsPage'));
const LogsPage = lazy(() => import('./pages/admin/LogsPage'));

function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
    </div>
  );
}

export default function App() {
  const { isLoading, user } = useAuth();
  const { viewingAs } = useImpersonation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-500 mb-4"></i>
          <p className="text-gray-500">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  const isAdmin = !viewingAs && user?.role === 'admin';

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<AuthGuard><Navigate to="/login" replace /></AuthGuard>} />
      <Route path="/login" element={<AuthGuard><LoginPage /></AuthGuard>} />
      <Route path="/register" element={<AuthGuard><RegisterPage /></AuthGuard>} />
      <Route path="/verify-email" element={<AuthGuard><VerifyEmailPage /></AuthGuard>} />
      <Route path="/forgot-password" element={<AuthGuard><ForgotPasswordPage /></AuthGuard>} />
      <Route path="/reset-password" element={<AuthGuard><ResetPasswordPage /></AuthGuard>} />

      {/* Guru routes */}
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={isAdmin ? <Navigate to="/app/admin/dashboard" replace /> : <Suspense fallback={<SuspenseFallback />}><Dashboard /></Suspense>} />
        <Route path="agenda" element={<Suspense fallback={<SuspenseFallback />}><Agenda /></Suspense>} />
        <Route path="absensi" element={<Suspense fallback={<SuspenseFallback />}><Absensi /></Suspense>} />
        <Route path="nilai" element={<Suspense fallback={<SuspenseFallback />}><Nilai /></Suspense>} />
        <Route path="penilaian-semester" element={<Suspense fallback={<SuspenseFallback />}><PenilaianSemester /></Suspense>} />
        <Route path="analisis-nilai" element={<Suspense fallback={<SuspenseFallback />}><AnalisisNilai /></Suspense>} />
        <Route path="data" element={<Suspense fallback={<SuspenseFallback />}><Data /></Suspense>} />
        <Route path="kalender" element={<Suspense fallback={<SuspenseFallback />}><KalenderPendidikan /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<SuspenseFallback />}><Settings /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<SuspenseFallback />}><Profile /></Suspense>} />

        {/* Admin-only routes within /app */}
        {isAdmin && (
          <>
            <Route path="admin/dashboard" element={<Suspense fallback={<SuspenseFallback />}><AdminDashboard /></Suspense>} />
            <Route path="admin/users" element={<Suspense fallback={<SuspenseFallback />}><UsersPage /></Suspense>} />
            <Route path="admin/academic-years" element={<Suspense fallback={<SuspenseFallback />}><AcademicYearsPage /></Suspense>} />
            <Route path="admin/subjects" element={<Suspense fallback={<SuspenseFallback />}><SubjectsPage /></Suspense>} />
            <Route path="admin/logs" element={<Suspense fallback={<SuspenseFallback />}><LogsPage /></Suspense>} />
          </>
        )}
      </Route>

      {/* Legacy admin routes (direct /admin/*) */}
      {isAdmin && (
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/admin/dashboard" replace />} />
          <Route path="users" element={<Navigate to="/app/admin/users" replace />} />
          <Route path="academic-years" element={<Navigate to="/app/admin/academic-years" replace />} />
          <Route path="subjects" element={<Navigate to="/app/admin/subjects" replace />} />
          <Route path="logs" element={<Navigate to="/app/admin/logs" replace />} />
        </Route>
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
