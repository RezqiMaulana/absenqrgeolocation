import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

export default function SiswaRiwayat() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/attendance/me', { params: { page } });
      setRows(res.data.data);
      setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hadirCount = rows.filter((r) => r.status === 'hadir').length;
  const terlambatCount = rows.filter((r) => r.status === 'terlambat').length;

  return (
    <div className="p-space-md space-y-space-md">
      <h1 className="text-headline-md font-bold text-text-primary pt-space-sm">Riwayat Presensi</h1>

      <div className="grid grid-cols-2 gap-space-sm">
        <div className="bg-surface border border-border rounded-xl p-space-md text-center">
          <div className="text-headline-lg font-bold font-tabular text-status-hadir">{hadirCount}</div>
          <div className="text-body-sm text-text-secondary">Tepat Waktu (hal. ini)</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-space-md text-center">
          <div className="text-headline-lg font-bold font-tabular text-status-terlambat">{terlambatCount}</div>
          <div className="text-body-sm text-text-secondary">Terlambat (hal. ini)</div>
        </div>
      </div>

      {error && <div className="bg-error-container text-on-error-container rounded-lg p-space-md">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-space-lg">
          <span className="material-symbols-outlined animate-spin text-primary-container text-[28px]">sync</span>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-body-md text-text-secondary text-center py-space-lg">Belum ada riwayat presensi.</p>
      ) : (
        <div className="space-y-space-sm">
          {rows.map((r) => (
            <div key={r.id} className="bg-surface border border-border rounded-xl p-space-md">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-body-md font-semibold text-text-primary">{r.date?.slice(0, 10)}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="flex items-center justify-between text-body-sm text-text-secondary">
                <span>Jam masuk: {r.time?.slice(0, 5)} WIB</span>
                <span>{Number(r.distance_meters).toFixed(0)}m dari titik absensi</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="flex items-center justify-between text-body-sm text-text-secondary pt-space-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-space-sm py-1 rounded border border-border disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span>
            Halaman {meta.current_page} / {meta.last_page}
          </span>
          <button
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="px-space-sm py-1 rounded border border-border disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
