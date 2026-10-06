import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function AdminLaporan() {
  const [classes, setClasses] = useState([]);
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    api
      .get('/classes', { params: { per_page: 100 } })
      .then((res) => setClasses(res.data.data))
      .catch(() => setClasses([]));
  }, []);

  const loadRecap = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/recap', {
        params: { date_from: dateFrom, date_to: dateTo, class_id: classId || undefined },
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat rekap.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, classId]);

  useEffect(() => {
    loadRecap();
  }, [loadRecap]);

  async function handleExport(type) {
    setExporting(type);
    try {
      const res = await api.get(`/reports/recap/export-${type}`, {
        params: { date_from: dateFrom, date_to: dateTo, class_id: classId || undefined },
        responseType: 'blob',
      });
      const ext = type === 'excel' ? 'xlsx' : 'pdf';
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap-presensi-${dateFrom}_sd_${dateTo}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengunduh file. Coba lagi.');
    } finally {
      setExporting('');
    }
  }

  return (
    <div className="space-y-space-lg">
      <div className="flex items-center justify-between flex-wrap gap-space-sm">
        <div>
          <h1 className="text-headline-md font-bold text-text-primary">Laporan &amp; Rekapitulasi</h1>
          <p className="text-body-md text-text-secondary">Rekap kehadiran siswa per periode.</p>
        </div>
        <div className="flex gap-space-sm">
          <button
            onClick={() => window.print()}
            className="h-10 px-space-md rounded-lg border border-border text-text-primary font-medium hover:bg-surface-subtle flex items-center gap-space-xs"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting === 'excel'}
            className="h-10 px-space-md rounded-lg border border-border text-text-primary font-medium hover:bg-surface-subtle flex items-center gap-space-xs disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {exporting === 'excel' ? 'Mengunduh...' : 'Export Excel'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf'}
            className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary flex items-center gap-space-xs disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            {exporting === 'pdf' ? 'Mengunduh...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-space-md">
        <div className="flex flex-wrap gap-space-sm mb-space-md">
          <div>
            <label className="block text-label-sm text-text-secondary mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 px-space-md rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div>
            <label className="block text-label-sm text-text-secondary mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 px-space-md rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div>
            <label className="block text-label-sm text-text-secondary mb-1">Kelas</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="h-10 px-space-md rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {data && (
          <p className="text-body-sm text-text-secondary mb-space-md">
            Periode {data.date_from} s/d {data.date_to} • Estimasi hari efektif:{' '}
            <strong>{data.effective_days} hari</strong> (dihitung dari tanggal yang punya minimal satu catatan
            absensi di sistem, bukan kalender akademik resmi)
          </p>
        )}

        {error && <div className="bg-error-container text-on-error-container rounded-lg p-space-md mb-space-md">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="p-space-sm">NIS</th>
                <th className="p-space-sm">Nama</th>
                <th className="p-space-sm">Kelas</th>
                <th className="p-space-sm text-right">Hadir</th>
                <th className="p-space-sm text-right">Terlambat</th>
                <th className="p-space-sm text-right">Alpa</th>
                <th className="p-space-sm text-right">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-space-lg text-center text-text-secondary">
                    Memuat...
                  </td>
                </tr>
              ) : !data || data.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-space-lg text-center text-text-secondary">
                    Tidak ada data siswa.
                  </td>
                </tr>
              ) : (
                data.rows.map((r) => (
                  <tr key={r.nis} className="border-b border-border hover:bg-surface-subtle">
                    <td className="p-space-sm font-tabular">{r.nis}</td>
                    <td className="p-space-sm font-medium text-text-primary">{r.name}</td>
                    <td className="p-space-sm">{r.class}</td>
                    <td className="p-space-sm text-right font-tabular text-status-hadir">{r.hadir}</td>
                    <td className="p-space-sm text-right font-tabular text-status-terlambat">{r.terlambat}</td>
                    <td className="p-space-sm text-right font-tabular text-status-alpa">{r.alpa}</td>
                    <td className="p-space-sm text-right font-tabular font-semibold text-text-primary">
                      {r.persentase}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
