import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function SiswaAkun() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSeksiAbsensi = Boolean(user?.student?.class_as_seksi_absensi);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="p-space-md space-y-space-md">
      <h1 className="text-headline-md font-bold text-text-primary pt-space-sm">Akun Saya</h1>

      <div className="bg-surface border border-border rounded-xl p-space-lg flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-headline-lg font-bold mb-space-sm">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="text-headline-sm font-semibold text-text-primary">{user?.name}</div>
        <div className="text-body-sm text-text-secondary">{user?.email}</div>
        {user?.student && (
          <div className="mt-space-sm inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-low text-body-sm text-text-secondary">
            NIS: {user.student.nis}
            {user.student.school_class?.name ? ` • ${user.student.school_class.name}` : ''}
          </div>
        )}
      </div>

      {isSeksiAbsensi && (
        <Link
          to="/siswa/monitoring-kelas"
          className="flex items-center justify-between bg-surface border border-border rounded-xl p-space-md"
        >
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary-container">groups</span>
            <span className="text-body-md font-medium text-text-primary">Monitoring Kelas (Seksi Absensi)</span>
          </div>
          <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
        </Link>
      )}

      <button
        onClick={handleLogout}
        className="w-full h-11 flex items-center justify-center gap-space-xs rounded-lg bg-surface border border-status-alpa text-status-alpa font-semibold hover:bg-status-alpa/5 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Keluar dari Akun
      </button>
    </div>
  );
}
