import { NavLink } from 'react-router-dom';

const MENU_BY_ROLE = {
  admin: [
    { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard & Monitoring' },
    { to: '/admin/geolocation', icon: 'location_on', label: 'Konfigurasi Geolocation' },
    { to: '/admin/siswa', icon: 'group', label: 'Kelola Siswa & Import' },
    { to: '/admin/guru', icon: 'school', label: 'Kelola Guru' },
    { to: '/admin/kelas', icon: 'meeting_room', label: 'Kelola Kelas' },
    { to: '/admin/laporan', icon: 'description', label: 'Laporan & Rekapitulasi' },
  ],
  wali_kelas: [
    { to: '/staff/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/staff/monitoring', icon: 'groups', label: 'Monitoring Kelas' },
  ],
  seksi_absensi: [
    { to: '/staff/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/staff/monitoring', icon: 'groups', label: 'Monitoring Absensi' },
  ],
};

export default function Sidebar({ role, schoolName = 'SMKN 1 Sumedang' }) {
  const menu = MENU_BY_ROLE[role] || [];

  return (
    <aside className="hidden lg:flex lg:flex-col w-[240px] shrink-0 bg-primary min-h-screen text-surface">
      <div className="p-space-lg border-b border-surface/10">
        <div className="text-headline-sm font-bold leading-tight">{schoolName}</div>
        <div className="text-label-sm text-surface-variant/70">PresensiQu • Portal Presensi</div>
      </div>

      <nav className="flex-1 py-space-md px-space-sm space-y-1">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-body-md transition-colors ${
                isActive
                  ? 'bg-surface/15 text-surface font-semibold'
                  : 'text-surface-variant/80 hover:bg-surface/10 hover:text-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-space-md border-t border-surface/10 flex items-center gap-space-sm text-label-sm text-surface-variant/70">
        <span className="w-2 h-2 rounded-full bg-status-hadir" />
        Server Aktif
      </div>
    </aside>
  );
}
