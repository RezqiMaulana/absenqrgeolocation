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
    <div className="space-y-space-lg">
      <div className="flex items-center justify-between flex-wrap gap-space-sm">
        <div>
          <h1 className="text-headline-md font-bold text-text-primary">Kelola Kelas</h1>
          <p className="text-body-md text-text-secondary">Data kelas dan wali kelasnya.</p>
        </div>
        <button
          onClick={openAdd}
          className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary flex items-center gap-space-xs"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Kelas
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl p-space-md">
        <div className="relative mb-space-md max-w-sm">
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
            placeholder="Cari nama kelas..."
            className="w-full h-10 pl-9 pr-space-md rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>

        {error && <div className="bg-error-container text-on-error-container rounded-lg p-space-md mb-space-md">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="p-space-sm">Nama Kelas</th>
                <th className="p-space-sm">Wali Kelas</th>
                <th className="p-space-sm">Jumlah Siswa</th>
                <th className="p-space-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-space-lg text-center text-text-secondary">
                    Memuat...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-space-lg text-center text-text-secondary">
                    Tidak ada data kelas.
                  </td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr key={c.id} className="border-b border-border hover:bg-surface-subtle">
                    <td className="p-space-sm font-medium text-text-primary">{c.name}</td>
                    <td className="p-space-sm">{c.wali_kelas?.name || '-'}</td>
                    <td className="p-space-sm font-tabular">{c.students_count ?? '-'}</td>
                    <td className="p-space-sm text-right">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-primary-container hover:underline text-body-sm mr-space-sm"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c)} className="text-status-alpa hover:underline text-body-sm">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-space-md text-body-sm text-text-secondary">
          <span>
            Halaman {meta.current_page} dari {meta.last_page} • Total {meta.total} kelas
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
