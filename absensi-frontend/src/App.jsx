import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import StudentLayout from './layouts/StudentLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminGeolocation from './pages/admin/Geolocation';
import AdminLaporan from './pages/admin/Laporan';
import AdminSiswa from './pages/admin/Siswa';
import AdminGuru from './pages/admin/Guru';
import AdminKelas from './pages/admin/Kelas';
import StaffDashboard from './pages/staff/Dashboard';
import StaffMonitoring from './pages/staff/Monitoring';
import SiswaBeranda from './pages/siswa/Beranda';
import SiswaScanQR from './pages/siswa/ScanQR';
import SiswaRiwayat from './pages/siswa/Riwayat';
import SiswaMonitoringKelas from './pages/siswa/MonitoringKelas';
import SiswaAkun from './pages/siswa/Akun';

const ROLE_HOME = {
  admin: '/admin/dashboard',
  wali_kelas: '/staff/dashboard',
  seksi_absensi: '/staff/dashboard',
  siswa: '/siswa/beranda',
};

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Admin & Staff (wali_kelas, seksi_absensi) — layout Sidebar + Header */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'wali_kelas', 'seksi_absensi']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/geolocation" element={<AdminGeolocation />} />
        <Route path="/admin/siswa" element={<AdminSiswa />} />
        <Route path="/admin/guru" element={<AdminGuru />} />
        <Route path="/admin/kelas" element={<AdminKelas />} />
        <Route path="/admin/laporan" element={<AdminLaporan />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/monitoring" element={<StaffMonitoring />} />
      </Route>

      {/* Siswa — layout mobile bottom nav */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['siswa']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/siswa/beranda" element={<SiswaBeranda />} />
        <Route path="/siswa/riwayat" element={<SiswaRiwayat />} />
        <Route path="/siswa/scan" element={<SiswaScanQR />} />
        <Route path="/siswa/monitoring-kelas" element={<SiswaMonitoringKelas />} />
        <Route path="/siswa/akun" element={<SiswaAkun />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
