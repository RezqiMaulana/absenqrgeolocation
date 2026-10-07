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
  const [stats, setStats] = useState({ hadir: 0, terlambat: 0, total: 0 });

  const isSeksiAbsensi = Boolean(user?.student?.class_as_seksi_absensi);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const [attRes, settingRes, historyRes] = await Promise.all([
        api.get('/attendance/me', { params: { date_from: today, date_to: today } }),
        api.get('/attendance-settings').catch(() => null),
        api.get('/attendance/me', { params: { per_page: 50 } }).catch(() => null),
      ]);
      
      setTodayAttendance(attRes.data.data?.[0] || null);
      setSetting(settingRes?.data ?? null);

      const rows = historyRes?.data?.data || [];
      const hadir = rows.filter((r) => r.status === 'hadir').length;
      const terlambat = rows.filter((r) => r.status === 'terlambat').length;
      setStats({ hadir, terlambat, total: rows.length });
    } finally {
      setLoading(false);
    }
  }

  const attendancePercentage = stats.total > 0 ? Math.round(((stats.hadir + stats.terlambat) / stats.total) * 100) : 100;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24 px-4 sm:px-0">
      
      {/* Header Banner Profil Siswa */}
      <div className="bg-gradient-to-br from-surface to-surface-container-low border border-border rounded-2xl p-6 shadow-xs flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/10 text-primary-container uppercase tracking-wider">
              {user?.student?.school_class?.name || 'Siswa Aktif'}
            </span>
          </div>
          <h1 className="text-headline-md font-bold text-text-primary">
            Halo, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-body-sm text-text-secondary mt-0.5">
            NIS: <span className="font-tabular font-medium text-text-primary">{user?.student?.nis || '-'}</span> • SMKN 1 Sumedang
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-primary-container/10 text-primary-container flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || 'S'}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-primary-container text-[32px]">sync</span>
        </div>
      ) : (
        <>
          {/* Kartu Status Absensi Hari Ini */}
          <div className="bg-surface border border-border rounded-2xl p-6 text-center shadow-xs space-y-4">
            {todayAttendance ? (
              <div className="space-y-3 py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <div className="space-y-1">
                  <StatusBadge status={todayAttendance.status} />
                  <p className="text-body-md text-text-secondary pt-1">
                    Kamu sudah melakukan presensi hari ini pada pukul{' '}
                    <span className="font-semibold font-tabular text-text-primary">{todayAttendance.time?.slice(0, 5)} WIB</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="w-16 h-16 rounded-full bg-surface-container text-text-secondary flex items-center justify-center mx-auto shadow-xs">
                  <span className="material-symbols-outlined text-[36px]">qr_code_scanner</span>
                </div>
                <div className="space-y-1">
                  <h2 className="text-headline-sm font-bold text-text-primary">Kamu Belum Absen Hari Ini</h2>
                  {setting && (
                    <p className="text-body-sm text-text-secondary">
                      Batas jam masuk presensi: <span className="font-semibold font-tabular text-text-primary">{setting.start_time?.slice(0, 5)} - {setting.end_time?.slice(0, 5)} WIB</span>
                    </p>
                  )}
                </div>
                <Link
                  to="/siswa/scan"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-primary-container text-on-primary font-semibold hover:opacity-90 transition shadow-xs w-full sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                  Scan QR Gerbang Sekarang
                </Link>
              </div>
            )}
          </div>

          {/* Grid Informasi Ringkas / Statistik Cepat */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-1">
              <div className="text-body-sm text-text-secondary font-medium">Tingkat Kehadiran</div>
              <div className="text-2xl font-bold font-tabular text-text-primary">{attendancePercentage}%</div>
              <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Status Sangat Baik
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-1">
              <div className="text-body-sm text-text-secondary font-medium">Total Tercatat</div>
              <div className="text-2xl font-bold font-tabular text-text-primary">{stats.total} Hari</div>
              <div className="text-xs text-text-secondary pt-1">
                {stats.hadir} Hadir, {stats.terlambat} Terlambat
              </div>
            </div>
          </div>

          {/* Menu Navigasi Cepat (Quick Links) */}
          <div className="space-y-3 pt-2">
            <h2 className="text-headline-sm font-semibold text-text-primary px-1">Menu Utama</h2>
            
            {isSeksiAbsensi && (
              <Link
                to="/siswa/monitoring-kelas"
                className="flex items-center justify-between bg-primary-container/10 border border-primary-container/30 rounded-2xl p-4 hover:bg-primary-container/15 transition shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">groups</span>
                  </div>
                  <div>
                    <div className="text-body-md font-bold text-text-primary">Monitoring Kelas</div>
                    <div className="text-body-sm text-text-secondary">
                      Akses tugas Seksi Absensi Kelas {user.student.class_as_seksi_absensi.name}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
              </Link>
            )}

            <Link
              to="/siswa/riwayat"
              className="flex items-center justify-between bg-surface border border-border rounded-2xl p-4 hover:bg-surface-container-low transition shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-surface-container text-text-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </div>
                <div>
                  <div className="text-body-md font-semibold text-text-primary">Riwayat Presensi Lengkap</div>
                  <div className="text-body-sm text-text-secondary">Lihat log rekam jejak kehadiran per bulan</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
            </Link>

            <Link
              to="/siswa/scan"
              className="flex items-center justify-between bg-surface border border-border rounded-2xl p-4 hover:bg-surface-container-low transition shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-surface-container text-text-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                </div>
                <div>
                  <div className="text-body-md font-semibold text-text-primary">Scan QR Code Mandiri</div>
                  <div className="text-body-sm text-text-secondary">Buka kamera pemindai presensi gerbang</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}