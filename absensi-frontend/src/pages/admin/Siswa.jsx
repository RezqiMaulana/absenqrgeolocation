import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import ImportExcelCard from '../../components/siswa/ImportExcelCard';
import StudentFormModal from '../../components/siswa/StudentFormModal';

export default function AdminSiswa() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/students', {
        params: { search: search || undefined, class_id: classFilter || undefined, page },
      });
      setStudents(res.data.data);
      setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data siswa.');
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, page]);

  useEffect(() => {
    api
      .get('/classes', { params: { per_page: 100 } })
      .then((res) => setClasses(res.data.data))
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  function openAdd() {
    setEditingStudent(null);
    setModalOpen(true);
  }

  function openEdit(student) {
    setEditingStudent(student);
    setModalOpen(true);
  }

  async function handleDelete(student) {
    if (!confirm(`Hapus siswa "${student.name}"? Akun login siswa ini juga akan ikut terhapus.`)) return;
    try {
      await api.delete(`/students/${student.id}`);
      loadStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus siswa.');
    }
  }

  return (
    <div className="space-y-space-lg">
      <div className="flex items-center justify-between flex-wrap gap-space-sm">
        <div>
          <h1 className="text-headline-md font-bold text-text-primary">Kelola Siswa &amp; Import Excel</h1>
          <p className="text-body-md text-text-secondary">
            Kelola data siswa satu per satu atau import massal lewat Excel.
          </p>
        </div>
        <div className="flex gap-space-sm">
          <button
            onClick={() => setShowImport((v) => !v)}
            className="h-10 px-space-md rounded-lg border border-border text-text-primary font-medium hover:bg-surface-subtle flex items-center gap-space-xs"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            {showImport ? 'Sembunyikan Import' : 'Import Excel'}
          </button>
          <button
            onClick={openAdd}
            className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary flex items-center gap-space-xs"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Tambah Siswa
          </button>
        </div>
      </div>

      {showImport && (
        <ImportExcelCard
          onImported={() => {
            loadStudents();
          }}
        />
      )}

      <div className="bg-surface border border-border rounded-xl p-space-md">
        <div className="flex flex-wrap gap-space-sm mb-space-md">
          <div className="relative flex-1 min-w-[200px]">
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
            value={classFilter}
            onChange={(e) => {
              setPage(1);
              setClassFilter(e.target.value);
            }}
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

        {error && <div className="bg-error-container text-on-error-container rounded-lg p-space-md mb-space-md">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="p-space-sm">NIS</th>
                <th className="p-space-sm">Nama</th>
                <th className="p-space-sm">L/P</th>
                <th className="p-space-sm">Kelas</th>
                <th className="p-space-sm">Email</th>
                <th className="p-space-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-space-lg text-center text-text-secondary">
                    Memuat...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-space-lg text-center text-text-secondary">
                    Tidak ada data siswa.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="border-b border-border hover:bg-surface-subtle">
                    <td className="p-space-sm font-tabular">{s.nis}</td>
                    <td className="p-space-sm font-medium text-text-primary">{s.name}</td>
                    <td className="p-space-sm">{s.gender || '-'}</td>
                    <td className="p-space-sm">{s.school_class?.name || '-'}</td>
                    <td className="p-space-sm text-text-secondary">{s.user?.email || '-'}</td>
                    <td className="p-space-sm text-right">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-primary-container hover:underline text-body-sm mr-space-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="text-status-alpa hover:underline text-body-sm"
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

        <div className="flex items-center justify-between mt-space-md text-body-sm text-text-secondary">
          <span>
            Halaman {meta.current_page} dari {meta.last_page} • Total {meta.total} siswa
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

      <StudentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadStudents}
        classes={classes}
        student={editingStudent}
      />
    </div>
  );
}
