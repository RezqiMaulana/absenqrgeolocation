import { useRef, useState } from 'react';
import api from '../../lib/api';

export default function ImportExcelCard({ onImported }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { mode, summary, rows }
  const [error, setError] = useState('');

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
  }

  async function runImport(preview) {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/students/import${preview ? '?preview=1' : ''}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      if (!preview) {
        onImported?.();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.response?.data?.missing_columns
            ? `Kolom hilang: ${err.response.data.missing_columns.join(', ')}`
            : 'Gagal memproses file Excel.'),
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-space-md">
      <div className="flex items-center justify-between mb-space-md">
        <div>
          <h2 className="text-headline-sm font-semibold text-text-primary">Import Data Siswa via Excel</h2>
          <p className="text-body-sm text-text-secondary">
            Kolom wajib: <code className="text-text-primary">nis, name, email, class_name</code> (kolom{' '}
            <code className="text-text-primary">gender</code> opsional, isi L/P)
          </p>
        </div>
      </div>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-space-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary-container bg-surface-container-low' : 'border-border'
          }`}
        >
          <span className="material-symbols-outlined text-[40px] text-primary-container mb-space-sm">
            cloud_upload
          </span>
          <p className="text-body-md font-medium text-text-primary">Tarik &amp; lepas file Excel di sini</p>
          <p className="text-body-sm text-text-secondary mt-1">Mendukung .xlsx, .xls, .csv hingga 5MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between bg-surface-container-low rounded-lg p-space-md mb-space-md">
          <div className="flex items-center gap-space-sm min-w-0">
            <span className="material-symbols-outlined text-primary-container">description</span>
            <div className="min-w-0">
              <div className="text-body-md font-medium text-text-primary truncate">{file.name}</div>
              <div className="text-body-sm text-text-secondary">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
          <button onClick={reset} className="text-text-secondary hover:text-status-alpa">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {file && !result && (
        <div className="flex gap-space-sm">
          <button
            onClick={() => runImport(true)}
            disabled={loading}
            className="flex-1 h-11 rounded-lg border border-primary-container text-primary-container font-semibold hover:bg-surface-container-low disabled:opacity-60"
          >
            {loading ? 'Memeriksa...' : 'Preview / Validasi Dulu'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-space-md bg-error-container text-on-error-container rounded-lg p-space-md text-body-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-space-md space-y-space-md">
          <div className="flex flex-wrap gap-space-sm">
            <SummaryPill label="Total Baris" value={result.summary.total} />
            <SummaryPill label="Valid/Berhasil" value={result.summary.berhasil} tone="hadir" />
            <SummaryPill label="Gagal" value={result.summary.gagal} tone="alpa" />
            <SummaryPill label="Duplikat" value={result.summary.duplikat} tone="terlambat" />
          </div>

          <div className="border border-border rounded-lg overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-body-sm">
              <thead className="bg-surface-subtle sticky top-0">
                <tr className="text-left text-text-secondary">
                  <th className="p-space-sm">Baris</th>
                  <th className="p-space-sm">NIS</th>
                  <th className="p-space-sm">Nama</th>
                  <th className="p-space-sm">Status</th>
                  <th className="p-space-sm">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.row} className="border-t border-border">
                    <td className="p-space-sm text-text-secondary">{row.row}</td>
                    <td className="p-space-sm">{row.nis}</td>
                    <td className="p-space-sm">{row.name}</td>
                    <td className="p-space-sm">
                      <RowStatus status={row.status} />
                    </td>
                    <td className="p-space-sm text-text-secondary">{row.errors.join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-space-sm">
            <button
              onClick={reset}
              className="flex-1 h-11 rounded-lg border border-border text-text-primary font-medium hover:bg-surface-subtle"
            >
              Batal
            </button>
            {result.mode === 'preview' && result.summary.berhasil > 0 && (
              <button
                onClick={() => runImport(false)}
                disabled={loading}
                className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary disabled:opacity-60"
              >
                {loading ? 'Menyimpan...' : `Konfirmasi Import ${result.summary.berhasil} Siswa`}
              </button>
            )}
            {result.mode === 'import' && (
              <div className="flex-1 h-11 flex items-center justify-center rounded-lg bg-status-hadir/10 text-[#065F46] font-semibold">
                Import selesai — {result.summary.berhasil} siswa tersimpan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, value, tone }) {
  const toneClass =
    tone === 'hadir'
      ? 'bg-status-hadir/10 text-[#065F46]'
      : tone === 'alpa'
        ? 'bg-status-alpa/10 text-[#991B1B]'
        : tone === 'terlambat'
          ? 'bg-status-terlambat/10 text-[#92400E]'
          : 'bg-surface-subtle text-text-secondary';

  return (
    <div className={`px-space-md py-space-sm rounded-lg ${toneClass}`}>
      <div className="text-headline-sm font-bold font-tabular">{value}</div>
      <div className="text-body-sm">{label}</div>
    </div>
  );
}

function RowStatus({ status }) {
  const map = {
    valid: 'bg-status-hadir/10 text-[#065F46]',
    gagal: 'bg-status-alpa/10 text-[#991B1B]',
    duplikat: 'bg-status-terlambat/10 text-[#92400E]',
  };
  const label = { valid: 'Valid', gagal: 'Gagal', duplikat: 'Duplikat' }[status] || status;

  return (
    <span className={`px-2 py-0.5 rounded-full text-label-sm font-semibold ${map[status] || ''}`}>{label}</span>
  );
}
