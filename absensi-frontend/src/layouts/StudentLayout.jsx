import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/siswa/beranda', icon: 'home', label: 'Beranda' },
  { to: '/siswa/riwayat', icon: 'history', label: 'Riwayat' },
  { to: '/siswa/scan', icon: 'qr_code_scanner', label: '', isCenter: true },
  { to: '/siswa/akun', icon: 'person', label: 'Akun' },
];

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <main className="flex-1 pb-24 max-w-md w-full mx-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border max-w-md w-full mx-auto flex items-center justify-around h-16 px-space-sm pb-[env(safe-area-inset-bottom,0px)]">
        {TABS.map((tab) =>
          tab.isCenter ? (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center -mt-8 shadow-lg"
            >
              <span className="material-symbols-outlined text-[26px]">{tab.icon}</span>
            </NavLink>
          ) : (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-body-sm px-space-sm py-1 ${
                  isActive ? 'text-primary-container font-semibold' : 'text-text-secondary'
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
