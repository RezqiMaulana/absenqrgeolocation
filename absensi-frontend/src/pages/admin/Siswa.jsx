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
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/10 text-primary-container uppercase tracking-wider">
              Master Data Siswa
            </span>
          </div>
          <h1 className="text-headline-md font-bold text-text-primary">Kelola Siswa &amp; Import Excel</h1>
          <p className="text-body-md text-text-secondary mt-0.5">
            Unggah berkas rekap data siswa, periksa validasi data, dan direktori database sekolah.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowImport((v) => !v)}
            className="h-11 px-4 rounded-xl border border-border bg-surface text-text-primary font-medium hover:bg-surface-container-low flex items-center gap-2 transition shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            {showImport ? 'Sembunyikan Import' : 'Import Excel'}
          </button>
          <button
            onClick={openAdd}
            className="h-11 px-4 rounded-xl bg-primary-container text-on-primary font-semibold hover:opacity-90 flex items-center gap-2 transition shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Tambah Siswa Manual
          </button>
        </div>
      </div>

      {/* Bagian Import Card */}
      {showImport && (
        <div className="transition-all animate-fadeIn">
          <ImportExcelCard
            onImported={() => {
              loadStudents();
            }}
          />
        </div>
      )}

      {/* Tabel & Filter Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-5">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
              placeholder="Cari nama atau NIS siswa..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <select
              value={classFilter}
              onChange={(e) => {
                setPage(1);
                setClassFilter(e.target.value);
              }}
              className="w-full sm:w-48 h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
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

        {error && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Tabel Data Siswa */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-body-md text-left">
            <thead className="bg-surface-container-low text-text-secondary border-b border-border text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">NIS</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">L/P</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">Email / Akun</th>
                <th className="p-4">No. HP Ortu</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary-container text-[32px]">sync</span>
                      <span>Memuat data siswa...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-secondary">
                    <span className="material-symbols-outlined text-[36px] mb-1 opacity-40">folder_open</span>
                    <p>Tidak ada data siswa ditemukan.</p>
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low/50 transition">
                    <td className="p-4 font-tabular font-medium text-text-primary">{s.nis}</td>
                    <td className="p-4 font-semibold text-text-primary">{s.name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${s.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                        {s.gender || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg bg-surface-container text-text-primary text-xs font-medium border border-border/50">
                        {s.school_class?.name || '-'}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary text-sm">{s.user?.email || '-'}</td>
                    <td className="p-4 text-text-secondary text-sm">
                      {s.parent_phone ? (
                        <span className="flex items-center gap-1">
                          <span className="text-green-600">📱</span>
                          <span className="font-mono text-xs">{s.parent_phone}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-text-disabled italic">Belum diisi</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="px-3 py-1.5 rounded-lg text-primary-container hover:bg-primary-container/10 font-medium text-sm transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
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
            <span className="font-semibold text-text-primary">{meta.total}</span> siswa)
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