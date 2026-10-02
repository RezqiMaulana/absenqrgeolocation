import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/StatusBadge';
import QrDisplayModal from '../../components/dashboard/QrDisplayModal';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setting, setSetting] = useState(null);
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    const today = new Date().toISOString().slice(0, 10);

    try {
      const [studentsRes, attendanceRes, settingRes] = await Promise.all([
        api.get('/students', { params: { per_page: 1 } }),
        api.get('/attendance', { params: { date_from: today, date_to: today, per_page: 1000 } }),
        api.get('/attendance-settings').catch(() => null),
      ]);

      setTotalSiswa(studentsRes.data.total ?? 0);
      setTodayAttendance(attendanceRes.data.data ?? []);
      setSetting(settingRes?.data ?? null);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard.');
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

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container rounded-xl p-space-md text-body-md">{error}</div>
    );
  }

  const hadirCount = todayAttendance.filter((a) => a.status === 'hadir').length;
  const terlambatCount = todayAttendance.filter((a) => a.status === 'terlambat').length;
  const sudahAbsen = hadirCount + terlambatCount;
  const belumAbsen = Math.max(totalSiswa - sudahAbsen, 0);
  const persentase = totalSiswa > 0 ? ((sudahAbsen / totalSiswa) * 100).toFixed(1) : '0.0';

  const recentActivity = [...todayAttendance]
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-space-lg">
      {/* Banner sesi presensi aktif */}
      {setting && (
        <div className="bg-surface-container-low border border-border rounded-xl p-space-md flex items-center justify-between gap-space-sm flex-wrap">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary-container">radio_button_checked</span>
            <div>
              <div className="text-body-md font-semibold text-text-primary">
                Presensi {setting.location_name} sedang berjalan
              </div>
              <div className="text-body-sm text-text-secondary">
                Jam absensi {setting.start_time?.slice(0, 5)} - {setting.end_time?.slice(0, 5)} WIB • Radius aktif{' '}
                {setting.radius_meters} meter
              </div>
            </div>
          </div>
          <button
            onClick={() => setQrModalOpen(true)}
            className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary flex items-center gap-space-xs shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
            Tampilkan QR Hari Ini
          </button>
        </div>
      )}

      <QrDisplayModal open={qrModalOpen} onClose={() => setQrModalOpen(false)} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
        <StatCard icon="group" label="Total Siswa Terdaftar" value={totalSiswa} />
        <StatCard
          icon="check_circle"
          label="Hadir Hari Ini"
          value={hadirCount}
          sub={`${terlambatCount} Terlambat`}
        />
        <StatCard
          icon="warning"
          label="Belum Presensi"
          value={belumAbsen}
          sub="Perlu tindak lanjut"
          subColor="text-status-alpa"
        />
        <StatCard
          icon="trending_up"
          label="Tingkat Kehadiran"
          value={`${persentase}%`}
          accent
          sub="dari total siswa terdaftar"
        />
      </div>

      {/* Live feed aktivitas presensi hari ini */}
      <div className="bg-surface border border-border rounded-xl p-space-md">
        <div className="flex items-center justify-between mb-space-md">
          <h2 className="text-headline-sm font-semibold text-text-primary">Aktivitas Presensi Hari Ini</h2>
          <span className="text-label-sm text-text-secondary">{todayAttendance.length} log tercatat</span>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-body-md text-text-secondary text-center py-space-lg">
            Belum ada siswa yang melakukan presensi hari ini.
          </p>
        ) : (
          <div className="space-y-space-sm">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-subtle transition-colors"
              >
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
