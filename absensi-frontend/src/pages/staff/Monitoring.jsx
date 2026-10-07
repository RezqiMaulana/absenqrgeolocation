import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

export default function StaffMonitoring() {
  const { user } = useAuth();
  const isWaliKelas = user?.role === 'wali_kelas';

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isWaliKelas ? '/attendance/class-daily-monitoring' : '/attendance';
      const res = await api.get(endpoint, {
        params: {
          search: search || undefined,
          status: status || undefined,
          date: date || undefined,
          page,
        },
      });
      setRows(res.data.data || res.data);
      setMeta({ 
        current_page: res.data.current_page || 1, 
        last_page: res.data.last_page || 1, 
        total: res.data.total || (res.data.length ? res.data.length : 0)
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data monitoring.');
    } finally {
      setLoading(false);
    }
  }, [isWaliKelas, search, status, date, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (studentId, newStatus) => {
    if (!newStatus || newStatus === 'alpa') return;
    setSavingId(studentId);
    try {
      await api.post('/attendance/permission', {
        student_id: studentId,
        status: newStatus,
        date: date,
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status absensi.');
    } finally {
      setSavingId(null);
    }
  };

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
            {isWaliKelas ? 'Monitoring & Input Presensi Kelas' : 'Monitoring Kehadiran Siswa'}
          </h1>
          <p className="text-body-md text-text-secondary mt-0.5">
            {isWaliKelas ? 'Kelola kehadiran dan input manual izin atau sakit siswa di kelas binaan Anda.' : 'Log rekam jejak presensi seluruh siswa di sekolah.'}
          </p>
        </div>
      </div>

      {/* Konten Card Utama */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-5">
        
        {/* Filter Bar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Cari nama atau NIS siswa..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
          >
            <option value="">Semua Status Kehadiran</option>
            <option value="hadir">Tepat Waktu</option>
            <option value="terlambat">Terlambat</option>
            <option value="izin">Izin</option>
            <option value="sakit">Sakit</option>
            {isWaliKelas && <option value="alpa">Alpa / Belum Absen</option>}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => {
              setPage(1);
              setDate(e.target.value);
            }}
            className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
          />
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Tabel Monitoring */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-body-md text-left">
            <thead className="bg-surface-container-low text-text-secondary border-b border-border text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">NIS</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Jam Absen</th>
                <th className="p-4">Jarak GPS</th>
                <th className="p-4">Status / Aksi Input</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary-container text-[32px]">sync</span>
                      <span>Memuat data monitoring...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-secondary">
                    <span className="material-symbols-outlined text-[36px] mb-1 opacity-40">fact_check</span>
                    <p>Tidak ada data monitoring ditemukan pada tanggal ini.</p>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const studentName = r.name || r.student?.name;
                  const studentNis = r.nis || r.student?.nis;
                  const studentId = r.student_id || r.student?.id;
                  
                  const isLocked = r.status === 'hadir' || r.status === 'terlambat';

                  return (
                    <tr key={studentId || r.id} className="hover:bg-surface-container-low/50 transition">
                      <td className="p-4 font-tabular font-medium text-text-primary">{studentNis}</td>
                      <td className="p-4 font-semibold text-text-primary">{studentName}</td>
                      <td className="p-4 font-tabular text-text-secondary">{r.time?.slice(0, 5) || '-'}</td>
                      <td className="p-4 font-tabular text-text-secondary">
                        {r.distance_meters ? `${Number(r.distance_meters).toFixed(0)}m` : '-'}
                      </td>
                      <td className="p-4">
                        {isWaliKelas && !isLocked ? (
                          <select
                            value={r.status || 'alpa'}
                            disabled={savingId === studentId}
                            onChange={(e) => handleStatusChange(studentId, e.target.value)}
                            className="h-9 px-3 rounded-xl border border-border text-sm bg-surface font-medium focus:ring-2 focus:ring-primary-container disabled:opacity-50 transition"
                          >
                            <option value="alpa">Belum Absen / Alpa</option>
                            <option value="izin">Izin</option>
                            <option value="sakit">Sakit</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <StatusBadge status={r.status} />
                            {isWaliKelas && <span className="text-xs text-text-secondary italic">(Terkunci otomatis)</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi Bawah */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-body-sm text-text-secondary">
          <p>
            Menampilkan halaman <span className="font-semibold text-text-primary">{meta.current_page}</span> dari{' '}
            <span className="font-semibold text-text-primary">{meta.last_page}</span> (Total{' '}
            <span className="font-semibold text-text-primary">{meta.total}</span> data)
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 px-4 rounded-xl border border-border font-medium hover:bg-surface-container-low disabled:opacity-40 transition flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              Sebelumnya
            </button>
            <button
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 px-4 rounded-xl border border-border font-medium hover:bg-surface-container-low disabled:opacity-40 transition flex items-center gap-1"
            >
              Berikutnya
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}