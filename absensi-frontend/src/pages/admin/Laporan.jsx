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
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/10 text-primary-container uppercase tracking-wider">
              Analitik &amp; Laporan
            </span>
          </div>
          <h1 className="text-headline-md font-bold text-text-primary">Laporan &amp; Rekapitulasi Presensi</h1>
          <p className="text-body-md text-text-secondary mt-0.5">
            Rekapitulasi kehadiran siswa secara menyeluruh berdasarkan rentang periode waktu dan kelas.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => window.print()}
            className="h-11 px-4 rounded-xl border border-border bg-surface text-text-primary font-medium hover:bg-surface-container-low flex items-center gap-2 transition shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Halaman
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting === 'excel'}
            className="h-11 px-4 rounded-xl border border-border bg-surface text-text-primary font-medium hover:bg-surface-container-low flex items-center gap-2 disabled:opacity-60 transition shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {exporting === 'excel' ? 'Mengunduh...' : 'Export Excel'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf'}
            className="h-11 px-4 rounded-xl bg-primary-container text-on-primary font-semibold hover:opacity-90 flex items-center gap-2 disabled:opacity-60 transition shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            {exporting === 'pdf' ? 'Mengunduh...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Konten Card Utama */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-6">
        
        {/* Filter Bar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-container-low p-4 rounded-xl border border-border/60">
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
            />
          </div>
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
            />
          </div>
          <div>
            <label className="block text-label-md font-medium text-text-primary mb-1.5">Filter Kelas</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
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
          <div className="flex items-center gap-2 text-body-sm text-text-secondary px-1">
            <span className="material-symbols-outlined text-[18px] text-primary-container">info</span>
            <span>
              Periode <strong className="text-text-primary">{data.date_from}</strong> s/d{' '}
              <strong className="text-text-primary">{data.date_to}</strong> (Estimasi hari efektif:{' '}
              <strong className="text-text-primary">{data.effective_days} hari</strong> tercatat sistem)
            </span>
          </div>
        )}

        {error && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Tabel Rekapitulasi */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-body-md text-left">
            <thead className="bg-surface-container-low text-text-secondary border-b border-border text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">NIS</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Kelas</th>
                <th className="p-4 text-right">Hadir</th>
                <th className="p-4 text-right">Terlambat</th>
                <th className="p-4 text-right">Alpa</th>
                <th className="p-4 text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary-container text-[32px]">sync</span>
                      <span>Memuat data rekapitulasi...</span>
                    </div>
                  </td>
                </tr>
              ) : !data || data.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-secondary">
                    <span className="material-symbols-outlined text-[36px] mb-1 opacity-40">assignment_turned_in</span>
                    <p>Tidak ada data rekapitulasi siswa pada periode ini.</p>
                  </td>
                </tr>
              ) : (
                data.rows.map((r) => (
                  <tr key={r.nis} className="hover:bg-surface-container-low/50 transition">
                    <td className="p-4 font-tabular font-medium text-text-primary">{r.nis}</td>
                    <td className="p-4 font-semibold text-text-primary">{r.name}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg bg-surface-container text-text-primary text-xs font-medium border border-border/50">
                        {r.class}
                      </span>
                    </td>
                    <td className="p-4 text-right font-tabular font-semibold text-status-hadir">{r.hadir}</td>
                    <td className="p-4 text-right font-tabular font-semibold text-status-terlambat">{r.terlambat}</td>
                    <td className="p-4 text-right font-tabular font-semibold text-status-alpa">{r.alpa}</td>
                    <td className="p-4 text-right font-tabular font-bold text-text-primary">
                      <span className="px-2.5 py-1 rounded-lg bg-primary-container/10 text-primary-container text-sm">
                        {r.persentase}%
                      </span>
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