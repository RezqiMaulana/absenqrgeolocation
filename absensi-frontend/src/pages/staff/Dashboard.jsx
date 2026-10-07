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
      <div className="bg-surface-container-low border border-border rounded-xl p-space-lg text-center text-text-secondary">
        Kamu belum ditetapkan sebagai wali kelas manapun. Hubungi Admin untuk di-assign ke sebuah kelas.
      </div>
    );
  }

  if (error) {
    return <div className="bg-error-container text-on-error-container rounded-xl p-space-md">{error}</div>;
  }

  const hadirCount = rows.filter((a) => a.status === 'hadir').length;
  const terlambatCount = rows.filter((a) => a.status === 'terlambat').length;
  const izinSakitCount = rows.filter((a) => a.status === 'izin' || a.status === 'sakit').length;
  const sudahAbsen = hadirCount + terlambatCount + izinSakitCount;

  const recentActivity = [...rows].sort((a, b) => (a.time < b.time ? 1 : -1)).slice(0, 8);

  return (
    <div className="space-y-space-lg">
      <div>
        <h1 className="text-headline-md font-bold text-text-primary">
          {isWaliKelas ? `Dashboard — ${myClasses.map((c) => c.name).join(', ')}` : 'Dashboard Monitoring Absensi'}
        </h1>
        <p className="text-body-md text-text-secondary">
          {isWaliKelas ? 'Ringkasan presensi kelas yang  di ampu.' : 'Ringkasan presensi seluruh siswa hari ini.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
        <StatCard icon="check_circle" label="Hadir Tepat Waktu" value={hadirCount} accent />
        <StatCard icon="schedule" label="Terlambat" value={terlambatCount} />
        <StatCard icon="medical_services" label="Izin & Sakit" value={izinSakitCount} />
        <StatCard icon="fact_check" label="Total Sudah Absen" value={sudahAbsen} />
      </div>

      <div className="bg-surface border border-border rounded-xl p-space-md">
        <h2 className="text-headline-sm font-semibold text-text-primary mb-space-md">Aktivitas Presensi Hari Ini</h2>

        {recentActivity.length === 0 ? (
          <p className="text-body-md text-text-secondary text-center py-space-lg">
            Belum ada siswa yang melakukan presensi hari ini.
          </p>
        ) : (
          <div className="space-y-space-sm">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-subtle">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center font-semibold shrink-0">
                    {item.student?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-body-md font-medium text-text-primary truncate">{item.student?.name}</div>
                    <div className="text-body-sm text-text-secondary truncate">
                      {item.student?.nis} • {item.student?.school_class?.name || 'Belum ada kelas'}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-space-sm">
                  <div className="text-body-sm font-tabular text-text-primary">{item.time?.slice(0, 5)} WIB</div>
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
