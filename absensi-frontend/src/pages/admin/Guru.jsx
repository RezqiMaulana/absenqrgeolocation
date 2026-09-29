import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import TeacherFormModal from '../../components/guru/TeacherFormModal';

const ROLE_LABEL = { wali_kelas: 'Wali Kelas', seksi_absensi: 'Seksi Absensi' };

export default function AdminGuru() {
  const [teachers, setTeachers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/teachers', { params: { search: search || undefined, page } });
      setTeachers(res.data.data);
      setMeta({ current_page: res.data.current_page, last_page: res.data.last_page, total: res.data.total });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data guru.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  function openAdd() {
    setEditingTeacher(null);
    setModalOpen(true);
  }

  function openEdit(teacher) {
    setEditingTeacher(teacher);
    setModalOpen(true);
  }

  async function handleDelete(teacher) {
    if (!confirm(`Hapus guru "${teacher.name}"? Akun login guru ini juga akan ikut terhapus.`)) return;
    try {
      await api.delete(`/teachers/${teacher.id}`);
      loadTeachers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus guru.');
    }
  }

  return (
    <div className="space-y-space-lg">
      <div className="flex items-center justify-between flex-wrap gap-space-sm">
        <div>
          <h1 className="text-headline-md font-bold text-text-primary">Kelola Guru</h1>
          <p className="text-body-md text-text-secondary">Data Wali Kelas dan Seksi Absensi.</p>
        </div>
        <button
          onClick={openAdd}
          className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary flex items-center gap-space-xs"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Tambah Guru
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
            placeholder="Cari nama atau NIP..."
            className="w-full h-10 pl-9 pr-space-md rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>

        {error && <div className="bg-error-container text-on-error-container rounded-lg p-space-md mb-space-md">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="p-space-sm">NIP</th>
                <th className="p-space-sm">Nama</th>
                <th className="p-space-sm">No. HP</th>
                <th className="p-space-sm">Role</th>
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
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-space-lg text-center text-text-secondary">
                    Tidak ada data guru.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id} className="border-b border-border hover:bg-surface-subtle">
                    <td className="p-space-sm font-tabular">{t.nip}</td>
                    <td className="p-space-sm font-medium text-text-primary">{t.name}</td>
                    <td className="p-space-sm">{t.phone || '-'}</td>
                    <td className="p-space-sm">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-label-sm">
                        {ROLE_LABEL[t.user?.role] || t.user?.role || '-'}
                      </span>
                    </td>
                    <td className="p-space-sm text-text-secondary">{t.user?.email || '-'}</td>
                    <td className="p-space-sm text-right">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-primary-container hover:underline text-body-sm mr-space-sm"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(t)} className="text-status-alpa hover:underline text-body-sm">
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
            Halaman {meta.current_page} dari {meta.last_page} • Total {meta.total} guru
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

      <TeacherFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadTeachers}
        teacher={editingTeacher}
      />
    </div>
  );
}
