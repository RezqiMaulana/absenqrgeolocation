import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ServerClock from './ServerClock';

const ROLE_LABEL = {
  admin: 'Super Admin',
  wali_kelas: 'Wali Kelas',
  seksi_absensi: 'Seksi Absensi',
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-space-md sm:px-space-lg shrink-0">
      <div className="hidden sm:flex items-center gap-space-sm text-text-secondary text-body-md w-72">
        <span className="material-symbols-outlined text-[20px]">search</span>
        <input
          type="text"
          placeholder="Cari NISN, nama siswa, kelas..."
          className="bg-transparent outline-none w-full text-text-primary placeholder:text-text-secondary/60"
        />
      </div>

      <div className="flex items-center gap-space-md ml-auto">
        <div className="hidden sm:flex items-center gap-space-xs text-text-secondary text-body-sm">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          <ServerClock className="font-tabular" />
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-space-sm"
          >
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-body-md font-medium text-text-primary leading-tight">{user?.name}</div>
              <div className="text-body-sm text-text-secondary leading-tight">
                {ROLE_LABEL[user?.role] || user?.role}
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-text-secondary">expand_more</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-space-xs w-48 bg-surface rounded-lg shadow-md border border-border py-1 z-30">
              <button
                onClick={handleLogout}
                className="w-full text-left px-space-md py-space-sm text-body-md text-status-alpa hover:bg-surface-subtle flex items-center gap-space-sm"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
