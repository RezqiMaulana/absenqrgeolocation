import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/StatusBadge';
import QrDisplayModal from '../../components/dashboard/QrDisplayModal';
import KehadiranChart from '../../components/dashboard/KehadiranChart';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setting, setSetting] = useState(null);
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [weeklyData, setWeeklyData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('this_week');

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadDashboard(); // Panggil API lagi saat timer habis
          return 30; // Reset kembali ke 30 detik
        }
        return prev - 1; // Kurangi 1 detik
      });
    }, 1000);

    // Cleanup interval saat komponen ditutup agar tidak memory leak
    return () => clearInterval(timer);
  }, []);

  async function loadDashboard(selectedPeriod = chartPeriod) {
    setLoading(true);
    setError('');
    const today = new Date().toISOString().slice(0, 10);

    try {
      const [studentsRes, attendanceRes, settingRes, weeklyRes] = await Promise.all([
        api.get('/students', { params: { per_page: 1 } }),
        api.get('/attendance', { params: { date_from: today, date_to: today, per_page: 1000 } }),
        api.get('/attendance-settings').catch(() => null),
        api.get('/attendance/weekly-stats', { params: { period: selectedPeriod } }).catch(() => null),
      ]);

      setTotalSiswa(studentsRes.data.total ?? 0);
      setTodayAttendance(attendanceRes.data.data ?? []);
      setSetting(settingRes?.data ?? null);
      setWeeklyData(weeklyRes?.data?.data ?? []);
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
  const izinSakitCount = todayAttendance.filter((a) => a.status === 'izin' || a.status === 'sakit').length;
  const sudahAbsen = hadirCount + terlambatCount + izinSakitCount;
  const belumAbsen = Math.max(totalSiswa - sudahAbsen, 0);
  const persentase = totalSiswa > 0 ? ((sudahAbsen / totalSiswa) * 100).toFixed(1) : '0.0';

  const recentActivity = [...todayAttendance]
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .slice(0, 8);

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-space-lg">
      {/* Banner sesi presensi aktif */}
      {setting && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">radar</span>
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">
                Presensi Masuk Aktif • <span className="font-normal">{todayFormatted}</span>
              </div>
              <div className="text-sm text-gray-500">
                Toleransi batas keterlambatan hingga <span className="font-semibold text-gray-700">{setting.end_time?.slice(0, 5) || '07:15'} WIB</span>. Radius validasi GPS aktif: <span className="font-semibold text-emerald-600">{setting.radius_meters} Meter dari Titik Pusat Sekolah.</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-sm">
            <span className="text-gray-500">Sync otomatis:</span>
            <span className="font-bold text-gray-800">{countdown.toString().padStart(2, '0')} detik</span>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
        icon="medical_services" 
        label="IZIN & SAKIT" 
        value={`${izinSakitCount} Siswa`} 
        sub="Memiliki SKD" />
        <StatCard
          icon="trending_up"
          label="Tingkat Kehadiran"
          value={`${persentase}%`}
          accent
          sub="dari total siswa terdaftar"
        />
      </div>

      {/* Live feed aktivitas presensi hari ini */}
      {/* 4. Area Bawah: Chart & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Chart (2/3 lebar) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tren Kehadiran Mingguan Siswa</h2>
              <p className="text-xs text-gray-500">Distribusi komparatif: Tepat Waktu, Terlambat, Izin/Sakit, dan Alpa (Senin - Jumat)</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setChartPeriod('this_week'); loadDashboard('this_week'); }}
                className={`px-3 py-1 border text-xs font-semibold rounded transition-colors ${chartPeriod === 'this_week' ? 'bg-gray-50 text-gray-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Pekan Ini
              </button>
              <button 
                onClick={() => { setChartPeriod('last_week'); loadDashboard('last_week'); }}
                className={`px-3 py-1 border text-xs font-semibold rounded transition-colors ${chartPeriod === 'last_week' ? 'bg-gray-50 text-gray-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Pekan Lalu
              </button>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50/50">
             {/* Tempatkan Komponen Chart Anda Di Sini */}
             <KehadiranChart data={weeklyData} />
          </div>
        </div>

        {/* Kolom Kanan: Live Feed (1/3 lebar) */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Feed Gerbang
              </h2>
              <p className="text-[10px] text-gray-500 mt-1">Log pemindaian barcode & verifikasi GPS masuk terkini</p>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada aktivitas presensi.</p>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border">
                    {/* Placeholder Avatar - Menggunakan UI Avatars */}
                    <img src={`https://ui-avatars.com/api/?name=${item.student?.name}&background=random`} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-semibold text-gray-900 truncate pr-2">{item.student?.name}</div>
                      <div className="text-xs font-bold text-gray-900">{item.time?.slice(0, 5)}</div>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{item.student?.school_class?.name || 'Belum ada kelas'} • NIS {item.student?.nis}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={item.status} size="sm" />
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                        {setting.location_name || 'Lokasi tidak tersedia'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
