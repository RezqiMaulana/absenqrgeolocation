import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function SiswaAkun() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // State untuk form ubah password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/profile/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setSuccessMsg('Kata sandi berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24 px-4 sm:px-0">
      
      {/* Header Halaman */}
      <div>
        <h1 className="text-headline-md font-bold text-text-primary">Profil &amp; Akun Siswa</h1>
        <p className="text-body-sm text-text-secondary">Kelola informasi identitas dan keamanan kata sandi Anda</p>
      </div>

      {/* Kartu Profil Identitas */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div className="min-w-0">
            <h2 className="text-headline-sm font-bold text-text-primary truncate">{user?.name}</h2>
            <p className="text-body-sm text-text-secondary truncate">
              NIS: <span className="font-tabular font-medium text-text-primary">{user?.student?.nis || '-'}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="bg-surface-container-low p-4 rounded-xl border border-border/60 space-y-1">
            <span className="text-xs text-text-secondary font-medium">Kelas Rombel</span>
            <p className="text-body-md font-semibold text-text-primary">
              {user?.student?.school_class?.name || 'Belum ada kelas'}
            </p>
          </div>
          <div className="bg-surface-container-low p-4 rounded-xl border border-border/60 space-y-1">
            <span className="text-xs text-text-secondary font-medium">Peran Akses</span>
            <p className="text-body-md font-semibold text-text-primary uppercase tracking-wider">
              {user?.role === 'siswa' ? 'Siswa Aktif' : user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Kartu Ubah Kata Sandi */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-headline-sm font-semibold text-text-primary">Keamanan Akun</h2>
          <p className="text-body-sm text-text-secondary">Ubah kata sandi akun secara berkala untuk menjaga keamanan</p>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="text-body-sm font-medium">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="text-body-sm font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-label-md font-medium text-text-primary">Kata Sandi Saat Ini</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-label-md font-medium text-text-primary">Kata Sandi Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-label-md font-medium text-text-primary">Konfirmasi Kata Sandi Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary-container text-on-primary font-semibold hover:opacity-90 transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Perbarui Kata Sandi</span>
            )}
          </button>
        </form>
      </div>

      {/* Tombol Keluar / Logout */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full h-11 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2 shadow-xs"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Keluar dari Akun
        </button>
      </div>

    </div>
  );
}