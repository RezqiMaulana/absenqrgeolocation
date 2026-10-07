import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

export default function SiswaRiwayat() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State filter bulan dinamis (Format: YYYY-MM atau memecah bulan & tahun)
  // Default ke bulan aktif saat ini (contoh: 2026-10 berdasarkan waktu sistem)
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Mengirimkan parameter bulan dan tahun ke backend
      const [year, month] = selectedMonth.split('-');
      const res = await api.get('/attendance/me', { 
        params: { 
          page,
          year: year || undefined,
          month: month || undefined
        } 
      });
      setRows(res.data.data || []);
      setMeta({ 
        current_page: res.data.current_page || 1, 
        last_page: res.data.last_page || 1, 
        total: res.data.total || 0 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat presensi.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Kalkulasi statistik dari data riwayat
  const hadirCount = rows.filter((r) => r.status === 'hadir').length;
  const terlambatCount = rows.filter((r) => r.status === 'terlambat').length;
  const izinSakitCount = rows.filter((r) => r.status === 'izin' || r.status === 'sakit').length;
  const alpaCount = rows.filter((r) => r.status === 'alpa').length;
  
  const totalKehadiranValid = hadirCount + terlambatCount;
  const totalRecord = rows.length > 0 ? rows.length : 1;
  const percentage = Math.round((totalKehadiranValid / totalRecord) * 100);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto pb-24">
      
      {/* Header & Filter Bulan Dinamis */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-text-primary">Riwayat Presensi</h1>
          <p className="text-body-sm text-text-secondary">Rekap kehadiran &amp; log aktivitas harian siswa</p>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-xl shadow-xs">
          <span className="material-symbols-outlined text-[18px] text-primary-container">calendar_month</span>
          <input 
            type="month"
            value={selectedMonth} 
            onChange={(e) => {
              setPage(1);
              setSelectedMonth(e.target.value);
            }}
            className="bg-transparent text-sm font-semibold text-text-primary focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Kartu Persentase Tingkat Kehadiran Utama */}
      <div className="bg-gradient-to-br from-surface to-surface-container-low border border-border rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-secondary">Tingkat Kehadiran Periode Ini</span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sangat Baik (Target: Min 95%)
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold font-tabular text-text-primary">{percentage}%</span>
          <span className="text-body-sm text-text-secondary">Akumulasi bulan terpilih</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
          <div className="bg-primary-container h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
        </div>
      </div>

      {/* Grid Statistik 4 Kolom */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4 text-center shadow-xs space-y-1">
          <div className="text-2xl font-bold font-tabular text-status-hadir">{hadirCount}</div>
          <div className="text-xs text-text-secondary font-medium">Tepat Waktu</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 text-center shadow-xs space-y-1">
          <div className="text-2xl font-bold font-tabular text-status-terlambat">{terlambatCount}</div>
          <div className="text-xs text-text-secondary font-medium">Terlambat</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 text-center shadow-xs space-y-1">
          <div className="text-2xl font-bold font-tabular text-blue-600">{izinSakitCount}</div>
          <div className="text-xs text-text-secondary font-medium">Izin / Sakit</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 text-center shadow-xs space-y-1">
          <div className="text-2xl font-bold font-tabular text-status-alpa">{alpaCount}</div>
          <div className="text-xs text-text-secondary font-medium">Alpa</div>
        </div>
      </div>

      {error && <div className="bg-error-container text-on-error-container rounded-2xl p-4">{error}</div>}

      {/* Daftar Aktivitas Presensi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm font-semibold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">history</span>
            Log Aktivitas Presensi
          </h2>
          <span className="text-xs text-text-secondary font-medium bg-surface-container px-2.5 py-1 rounded-full">
            {meta.total} Total Log
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary-container text-[32px]">sync</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center text-text-secondary shadow-xs">
            <span className="material-symbols-outlined text-[36px] mb-2 opacity-40">event_busy</span>
            <p className="text-body-md">Belum ada riwayat presensi tercatat pada bulan ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="bg-surface border border-border rounded-2xl p-4 shadow-xs hover:border-primary-container/40 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">event</span>
                    <span className="text-body-md font-semibold text-text-primary">{r.date?.slice(0, 10)}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center justify-between text-body-sm text-text-secondary pt-2 border-t border-border/60">
                  <span className="flex items-center gap-1 font-tabular">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    Masuk: {r.time?.slice(0, 5) || '-'} WIB
                  </span>
                  <span className="flex items-center gap-1 font-tabular">
                    <span className="material-symbols-outlined text-[16px]">near_me</span>
                    {r.distance_meters ? `${Number(r.distance_meters).toFixed(0)}m dari titik` : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginasi Bawah */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-4 text-body-sm text-text-secondary border-t border-border">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-9 px-4 rounded-xl border border-border font-medium hover:bg-surface-container-low disabled:opacity-40 transition flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            Sebelumnya
          </button>
          <span className="font-medium text-text-primary">
            Halaman {meta.current_page} dari {meta.last_page}
          </span>
          <button
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="h-9 px-4 rounded-xl border border-border font-medium hover:bg-surface-container-low disabled:opacity-40 transition flex items-center gap-1"
          >
            Berikutnya
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      )}

    </div>
  );
}