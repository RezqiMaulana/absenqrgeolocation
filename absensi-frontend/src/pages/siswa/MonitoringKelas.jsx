import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

export default function SiswaMonitoringKelas() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    const today = new Date().toISOString().slice(0, 10);
    try {
      const res = await api.get('/attendance/my-seksi-class', {
        params: { date_from: today, date_to: today, per_page: 100 },
      });
      setRows(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data monitoring.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-space-md space-y-space-md">
      <div className="flex items-center gap-space-sm pt-space-sm">
        <button onClick={() => navigate(-1)} className="text-text-secondary">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-headline-md font-bold text-text-primary">Monitoring Kelas</h1>
      </div>
      <p className="text-body-md text-text-secondary">Presensi hari ini sebagai Seksi Absensi.</p>

      {loading ? (
        <div className="flex justify-center py-space-lg">
          <span className="material-symbols-outlined animate-spin text-primary-container text-[28px]">sync</span>
        </div>
      ) : error ? (
        <div className="bg-error-container text-on-error-container rounded-lg p-space-md">{error}</div>
      ) : rows.length === 0 ? (
        <p className="text-body-md text-text-secondary text-center py-space-lg">
          Belum ada siswa yang presensi hari ini.
        </p>
      ) : (
        <div className="space-y-space-sm">
          {rows.map((r) => (
            <div key={r.id} className="bg-surface border border-border rounded-xl p-space-md flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-body-md font-medium text-text-primary truncate">{r.student?.name}</div>
                <div className="text-body-sm text-text-secondary">{r.student?.nis}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-body-sm font-tabular text-text-primary">{r.time?.slice(0, 5)} WIB</div>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
