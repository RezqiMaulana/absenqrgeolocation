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
  // Menggunakan satu tanggal untuk memudahkan input presensi/rekap harian
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
          date: date || undefined, // Gunakan parameter date tunggal
          page,
        },
      });
      setRows(res.data.data || res.data); // Sesuaikan jika data langsung berupa array
      setMeta({ 
        current_page: res.data.current_page || 1, 
        last_page: res.data.last_page || 1, 
        total: res.data.total || res.data.length 
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
    <div className="space-y-space-lg">
      <div>
        <h1 className="text-headline-md font-bold text-text-primary">
          {isWaliKelas ? 'Monitoring & Input Presensi Kelas' : 'Monitoring Kehadiran'}
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
            {isWaliKelas && <option value="alpa">Alpa / Belum Absen</option>}
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
                <th className="p-space-sm">Nama</th>
                <th className="p-space-sm">Jam</th>
                <th className="p-space-sm">Jarak</th>
                <th className="p-space-sm">Status</th>
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
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  // Mengakomodasi API Wali Kelas (r.name) dan API Admin (r.student.name)
                  const studentName = r.name || r.student?.name;
                  const studentNis = r.nis || r.student?.nis;
                  const studentId = r.student_id || r.student?.id;
                  
                  const isLocked = r.status === 'hadir' || r.status === 'terlambat';

                  return (
                    <tr key={studentId || r.id} className="border-b border-border hover:bg-surface-subtle">
                      <td className="p-space-sm font-tabular">{studentNis}</td>
                      <td className="p-space-sm font-medium text-text-primary">{studentName}</td>
                      <td className="p-space-sm font-tabular">{r.time?.slice(0, 5) || '-'}</td>
                      <td className="p-space-sm text-text-secondary">
                        {r.distance_meters ? `${Number(r.distance_meters).toFixed(0)}m` : '-'}
                      </td>
                      <td className="p-space-sm">
                        {isWaliKelas && !isLocked ? (
                          <select
                            value={r.status || 'alpa'}
                            disabled={savingId === studentId}
                            onChange={(e) => handleStatusChange(studentId, e.target.value)}
                            className="px-2 py-1 rounded border border-border text-sm bg-white focus:ring-2 focus:ring-primary-container disabled:opacity-50"
                          >
                            <option value="alpa">Belum Absen</option>
                            <option value="izin">Izin</option>
                            <option value="sakit">Sakit</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <StatusBadge status={r.status} />
                            {isWaliKelas && <span className="text-xs text-gray-400 italic">(Terkunci)</span>}
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

        <div className="flex items-center justify-between mt-space-md text-body-sm text-text-secondary">
          <span>
            Halaman {meta.current_page} dari {meta.last_page} | Total {meta.total} data
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