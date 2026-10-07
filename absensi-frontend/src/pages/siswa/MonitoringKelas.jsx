import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

export default function SiswaMonitoringKelas() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State yang terlewat sebelumnya (untuk loading saat menyimpan status)
  const [savingId, setSavingId] = useState(null);
  
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadData();
  }, [date]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/attendance/class-daily-monitoring', {
        params: { date: date, per_page: 100 },
      });
      setRows(res.data.data || res.data); // Antisipasi format data backend
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data monitoring.');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (studentId, newStatus) => {
    if (!newStatus || newStatus === 'alpa') return;
    setSavingId(studentId);
    try {
      await api.post('/attendance/permission', {
        student_id: studentId,
        status: newStatus,
        date: date,
      });
      // Muat ulang data agar badge status langsung terbarui
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status absensi.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-space-md space-y-space-md pb-24">
      {/* Header */}
      <div className="flex items-center gap-space-sm pt-space-sm">
        <button onClick={() => navigate(-1)} className="text-text-secondary">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-headline-md font-bold text-text-primary">Monitoring Kelas</h1>
      </div>
      
      {/* Input Tanggal */}
      <div className="flex flex-col gap-2">
        <p className="text-body-md text-text-secondary">Input izin/sakit & pantau presensi teman sekelasmu.</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-10 px-space-md w-full rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-space-lg">
          <span className="material-symbols-outlined animate-spin text-primary-container text-[28px]">sync</span>
        </div>
      ) : error ? (
        <div className="bg-error-container text-on-error-container rounded-lg p-space-md">{error}</div>
      ) : rows.length === 0 ? (
        <p className="text-body-md text-text-secondary text-center py-space-lg">
          Belum ada data siswa di kelas ini.
        </p>
      ) : (
        <div className="space-y-space-sm">
          {rows.map((r) => {
            // Jika siswa sudah absen mandiri (hadir/terlambat), statusnya dikunci
            const isLocked = r.status === 'hadir' || r.status === 'terlambat';

            return (
              <div key={r.student_id} className="bg-surface border border-border rounded-xl p-space-md flex flex-col gap-3">
                
                {/* Bagian Atas: Nama, NIS, dan Jam */}
                <div className="flex items-start justify-between min-w-0">
                  <div className="min-w-0 pr-2">
                    {/* PERBAIKAN: Gunakan r.name bukan r.student.name */}
                    <div className="text-body-md font-medium text-text-primary truncate">{r.name}</div>
                    <div className="text-body-sm text-text-secondary">{r.nis}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-body-sm font-tabular text-text-secondary">
                      {r.time ? `${r.time.slice(0, 5)} WIB` : '-'}
                    </div>
                  </div>
                </div>

                {/* Bagian Bawah: Badge Status & Dropdown Input */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-body-sm text-text-secondary">Status:</span>
                  
                  {isLocked ? (
                    // Jika sudah absen otomatis, hanya tampilkan badge
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-secondary italic uppercase">(Terkunci)</span>
                      <StatusBadge status={r.status} />
                    </div>
                  ) : (
                    // Jika belum absen, Seksi Absensi bisa menginput izin/sakit
                    <select
                      value={r.status || 'alpa'}
                      disabled={savingId === r.student_id}
                      onChange={(e) => handleStatusChange(r.student_id, e.target.value)}
                      className="px-2 py-1 rounded-md border border-border text-sm font-medium bg-white focus:ring-2 focus:ring-primary-container disabled:opacity-50"
                    >
                      <option value="alpa">Belum Absen</option>
                      <option value="izin">Izin</option>
                      <option value="sakit">Sakit</option>
                    </select>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}