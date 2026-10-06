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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // Menggunakan single date agar mudah rekap per hari
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Endpoint khusus wali kelas yang mengembalikan rekap harian seluruh siswa kelasnya
      const endpoint = isWaliKelas ? '/attendance/class-daily-monitoring' : '/attendance';
      const res = await api.get(endpoint, {
        params: {
          search: search || undefined,
          status: status || undefined,
          date: date || undefined,
          page,
        },
      });
      setRows(res.data.data);
      setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data monitoring.');
    } finally {
      setLoading(false);
    }
  }, [isWaliKelas, search, status, date, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fungsi untuk mengubah/menginput status bagi siswa yang belum absen (izin/sakit)
  const handleStatusChange = async (studentId, newStatus) => {
    if (!newStatus) return;
    setSavingId(studentId);
    try {
      await api.post('/attendance/permission', {
        student_id: studentId,
        status: newStatus,
        date: date,
      });
      // Muat ulang data agar status langsung terbarui di tabel
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status absensi.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-space-lg">
      <div>
        <h1 className="text-headline-md font-bold text-text-primary">
          {isWaliKelas ? 'Monitoring & Input Kehadiran Kelas' : 'Monitoring Kehadiran'}
        </h1>
        <p className="text-body-md text-text-secondary">
          {isWaliKelas ? 'Kelola kehadiran dan input izin/sakit siswa di kelas Anda.' : 'Log presensi seluruh siswa.'}
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-space-md">
        <div className="flex flex-wrap gap-space-sm mb-space-md">
          <div className="relative flex-1 min-w-[180px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Cari nama atau NIS..."
              className="w-full h-10 pl-9 pr-space-md rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="h-10 px-space-md rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <option value="">Semua Status</option>
            <option value="hadir">Tepat Waktu</option>
            <option value="terlambat">Terlambat</option>
            <option value="izin">Izin</option>
            <option value="sakit">Sakit</option>
            <option value="alpa">Alpa / Belum Absen</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setPage(1);
              setDate(e.target.value);
            }}
            className="h-10 px-space-md rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>

        {error && <div className="bg-error-container text-on-error-container rounded-lg p-space-md mb-space-md">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="p-space-sm">NIS</th>
                <th className="p-space-sm">Nama Siswa</th>
                <th className="p-space-sm">Jam Absen</th>
                <th className="p-space-sm">Jarak GPS</th>
                <th className="p-space-sm">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-space-lg text-center text-text-secondary">
                    Memuat...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-space-lg text-center text-text-secondary">
                    Tidak ada siswa ditemukan di kelas ini.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  // Cek apakah siswa sudah melakukan absen otomatis (hadir/terlambat)
                  const isLocked = r.status === 'hadir' || r.status === 'terlambat';

                  return (
                    <tr key={r.student_id || r.id} className="border-b border-border hover:bg-surface-subtle">
                      <td className="p-space-sm font-tabular">{r.nis}</td>
                      <td className="p-space-sm font-medium text-text-primary">{r.name}</td>
                      <td className="p-space-sm font-tabular">{r.time ? r.time.slice(0, 5) : '-'}</td>
                      <td className="p-space-sm text-text-secondary">
                        {r.distance_meters ? `${Number(r.distance_meters).toFixed(0)}m` : '-'}
                      </td>
                      <td className="p-space-sm">
                        {isLocked ? (
                          // Jika sudah absen mandiri (hadir/terlambat), status dikunci (hanya tampil badge)
                          <div className="flex items-center gap-2">
                            <StatusBadge status={r.status} />
                            <span className="text-xs text-gray-400 italic">(Terkunci)</span>
                          </div>
                        ) : (
                          // Jika belum absen, wali kelas bisa mengubah/menginput status (Izin/Sakit/Alpa)
                          <select
                            value={r.status || 'alpa'}
                            disabled={savingId === r.student_id}
                            onChange={(e) => handleStatusChange(r.student_id, e.target.value)}
                            className="px-2 py-1 rounded border border-border text-sm bg-white focus:ring-2 focus:ring-primary-container"
                          >
                            <option value="alpa">Alpa / Belum</option>
                            <option value="izin">Izin</option>
                            <option value="sakit">Sakit</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-space-md text-body-sm text-text-secondary">
          <span>
            Halaman {meta.current_page} dari {meta.last_page} | Total {meta.total} siswa
          </span>
          <div className="flex gap-space-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-space-sm py-1 rounded border border-border disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-space-sm py-1 rounded border border-border disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}