import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

export default function SiswaBeranda() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [setting, setSetting] = useState(null);

  const isSeksiAbsensi = Boolean(user?.student?.class_as_seksi_absensi);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const [attRes, settingRes] = await Promise.all([
        api.get('/attendance/me', { params: { date_from: today, date_to: today } }),
        api.get('/attendance-settings').catch(() => null),
      ]);
      setTodayAttendance(attRes.data.data?.[0] || null);
      setSetting(settingRes?.data ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-space-md space-y-space-md">
      <div className="pt-space-sm">
        <h1 className="text-headline-md font-bold text-text-primary">Halo, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-body-md text-text-secondary">
          {user?.student?.nis} • {user?.student?.school_class?.name || 'Belum ada kelas'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-space-lg">
          <span className="material-symbols-outlined animate-spin text-primary-container text-[28px]">sync</span>
        </div>
      ) : (
        <>
          {/* Status absensi hari ini */}
          <div className="bg-surface border border-border rounded-xl p-space-lg text-center">
            {todayAttendance ? (
              <>
                <span className="material-symbols-outlined text-status-hadir text-[48px] mb-space-sm">
                  check_circle
                </span>
                <div className="mb-space-xs">
                  <StatusBadge status={todayAttendance.status} />
                </div>
                <p className="text-body-md text-text-secondary">
                  Kamu sudah absen hari ini jam{' '}
                  <span className="font-semibold text-text-primary">{todayAttendance.time?.slice(0, 5)} WIB</span>
                </p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-text-secondary text-[48px] mb-space-sm">
                  schedule
                </span>
                <p className="text-body-lg font-semibold text-text-primary mb-space-xs">Kamu belum absen hari ini</p>
                {setting && (
                  <p className="text-body-sm text-text-secondary mb-space-md">
                    Jam absensi: {setting.start_time?.slice(0, 5)} - {setting.end_time?.slice(0, 5)} WIB
                  </p>
                )}
                <Link
                  to="/siswa/scan"
                  className="inline-flex items-center gap-space-xs h-11 px-space-lg rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                  Scan QR Sekarang
                </Link>
              </>
            )}
          </div>

          {isSeksiAbsensi && (
            <Link
              to="/siswa/monitoring-kelas"
              className="flex items-center justify-between bg-primary-container/10 border border-primary-container/30 rounded-xl p-space-md"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary-container">groups</span>
                <div>
                  <div className="text-body-md font-semibold text-text-primary">Monitoring Kelas</div>
                  <div className="text-body-sm text-text-secondary">
                    Kamu Seksi Absensi {user.student.class_as_seksi_absensi.name}
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
            </Link>
          )}

          <Link
            to="/siswa/riwayat"
            className="flex items-center justify-between bg-surface border border-border rounded-xl p-space-md"
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-text-secondary">history</span>
              <span className="text-body-md font-medium text-text-primary">Lihat Riwayat Presensi</span>
            </div>
            <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
          </Link>
        </>
      )}
    </div>
  );
}
