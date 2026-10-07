import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/StatusBadge';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);

  const isWaliKelas = user?.role === 'wali_kelas';
  const myClasses = user?.teacher?.classes_as_wali || [];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    const today = new Date().toISOString().slice(0, 10);

    try {
      const endpoint = isWaliKelas ? '/attendance/my-class' : '/attendance';
      const res = await api.get(endpoint, {
        params: { date_from: today, date_to: today, per_page: 1000 },
      });
      setRows(res.data.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data absensi.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary-container text-[32px]">sync</span>
      </div>
    );
  }

  if (isWaliKelas && myClasses.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-12 text-center text-text-secondary max-w-xl mx-auto mt-10 shadow-xs">
        <span className="material-symbols-outlined text-[40px] mb-2 text-amber-500">warning</span>
        <p className="text-body-lg font-semibold text-text-primary mb-1">Belum Ada Kelas Binaan</p>
        <p className="text-body-md">Kamu belum ditetapkan sebagai wali kelas manapun. Hubungi Admin untuk di-assign ke sebuah kelas.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container rounded-2xl p-6 flex items-center gap-3">
        <span className="material-symbols-outlined">error</span>
        {error}
      </div>
    );
  }

  const hadirCount = rows.filter((a) => a.status === 'hadir').length;
  const terlambatCount = rows.filter((a) => a.status === 'terlambat').length;
  const izinSakitCount = rows.filter((a) => a.status === 'izin' || a.status === 'sakit').length;
  const sudahAbsen = hadirCount + terlambatCount + izinSakitCount;

  const recentActivity = [...rows].sort((a, b) => (a.time < b.time ? 1 : -1)).slice(0, 8);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/10 text-primary-container uppercase tracking-wider">
              {isWaliKelas ? 'Portal Wali Kelas' : 'Monitoring Staff'}
            </span>
          </div>
          <h1 className="text-headline-md font-bold text-text-primary">
            {isWaliKelas ? `Dashboard — Kelas ${myClasses.map((c) => c.name).join(', ')}` : 'Dashboard Monitoring Absensi'}
          </h1>
          <p className="text-body-md text-text-secondary mt-0.5">
            {isWaliKelas ? 'Ringkasan presensi harian siswa pada kelas binaan Anda.' : 'Ringkasan presensi seluruh siswa di sekolah hari ini.'}
          </p>
        </div>
      </div>

      {/* Grid Statistik Kartu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="check_circle" label="Hadir Tepat Waktu" value={hadirCount} accent />
        <StatCard icon="schedule" label="Terlambat" value={terlambatCount} />
        <StatCard icon="medical_services" label="Izin & Sakit" value={izinSakitCount} />
        <StatCard icon="fact_check" label="Total Sudah Absen" value={sudahAbsen} />
      </div>

      {/* Card Aktivitas Presensi Terbaru */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-headline-sm font-semibold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">history</span>
            Aktivitas Presensi Hari Ini
          </h2>
          <span className="text-xs bg-surface-container px-3 py-1 rounded-full font-medium text-text-secondary">
            {rows.length} Total Data
          </span>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">
            <span className="material-symbols-outlined text-[36px] mb-1 opacity-40">event_busy</span>
            <p className="text-body-md">Belum ada siswa yang melakukan presensi hari ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3.5 hover:bg-surface-container-low/50 px-3 rounded-xl transition">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center font-bold shrink-0 shadow-xs">
                    {item.student?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-body-md font-semibold text-text-primary truncate">{item.student?.name}</div>
                    <div className="text-body-sm text-text-secondary flex items-center gap-2 truncate mt-0.5">
                      <span className="font-tabular font-medium">{item.student?.nis}</span>
                      <span>•</span>
                      <span>{item.student?.school_class?.name || 'Tanpa Kelas'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4 flex items-center gap-4">
                  <div className="text-body-sm font-tabular font-medium text-text-secondary">
                    {item.time?.slice(0, 5)} WIB
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}