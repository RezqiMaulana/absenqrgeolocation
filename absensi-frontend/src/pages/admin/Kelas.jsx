import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import ClassFormModal from '../../components/kelas/ClassFormModal';

export default function AdminKelas() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/classes', { params: { search: search || undefined, page } });
      setClasses(res.data.data);
      setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data kelas.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    api
      .get('/teachers', { params: { per_page: 100 } })
      .then((res) => setTeachers(res.data.data))
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  function openAdd() {
    setEditingClass(null);
    setModalOpen(true);
  }

  function openEdit(schoolClass) {
    setEditingClass(schoolClass);
    setModalOpen(true);
  }

  async function handleDelete(schoolClass) {
    if (
      !confirm(
        `Hapus kelas "${schoolClass.name}"? Siswa di kelas ini TIDAK akan ikut terhapus, hanya jadi tanpa kelas.`,
      )
    )
      return;
    try {
      await api.delete(`/classes/${schoolClass.id}`);
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus kelas.');
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/10 text-primary-container uppercase tracking-wider">
              Master Data Kelas
            </span>
          </div>
          <h1 className="text-headline-md font-bold text-text-primary">Kelola Kelas &amp; Wali Kelas</h1>
          <p className="text-body-md text-text-secondary mt-0.5">
            Kelola data rombongan belajar, penugasan wali kelas, dan seksi absensi kelas.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="h-11 px-4 rounded-xl bg-primary-container text-on-primary font-semibold hover:opacity-90 flex items-center gap-2 transition shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Kelas Baru
        </button>
      </div>

      {/* Konten Card Utama */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-5">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
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
            placeholder="Cari nama kelas..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
          />
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Tabel Kelas */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-body-md text-left">
            <thead className="bg-surface-container-low text-text-secondary border-b border-border text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Nama Kelas</th>
                <th className="p-4">Wali Kelas</th>
                <th className="p-4">Seksi Absensi</th>
                <th className="p-4">Jumlah Siswa</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary-container text-[32px]">sync</span>
                      <span>Memuat data kelas...</span>
                    </div>
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-secondary">
                    <span className="material-symbols-outlined text-[36px] mb-1 opacity-40">class</span>
                    <p>Tidak ada data kelas ditemukan.</p>
                  </td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low/50 transition">
                    <td className="p-4 font-semibold text-text-primary">{c.name}</td>
                    <td className="p-4 text-text-secondary">{c.wali_kelas?.name || '-'}</td>
                    <td className="p-4 text-text-secondary">{c.seksi_absensi?.name || '-'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg bg-surface-container text-text-primary text-xs font-semibold font-tabular border border-border/50">
                        {c.students_count ?? 0} Siswa
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="px-3 py-1.5 rounded-lg text-primary-container hover:bg-primary-container/10 font-medium text-sm transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="px-3 py-1.5 rounded-lg text-error hover:bg-error/10 font-medium text-sm transition"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi Bawah */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-body-sm text-text-secondary">
          <p>
            Menampilkan halaman <span className="font-semibold text-text-primary">{meta.current_page}</span> dari{' '}
            <span className="font-semibold text-text-primary">{meta.last_page}</span> (Total{' '}
            <span className="font-semibold text-text-primary">{meta.total}</span> kelas)
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

      <ClassFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadClasses}
        teachers={teachers}
        schoolClass={editingClass}
      />
    </div>
  );
}