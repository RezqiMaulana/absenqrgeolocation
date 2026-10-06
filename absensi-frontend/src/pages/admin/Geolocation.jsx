import { useEffect, useState } from 'react';
import api from '../../lib/api';

const emptyForm = {
  location_name: '',
  latitude: '',
  longitude: '',
  radius_meters: 100,
  start_time: '06:00',
  end_time: '07:00',
};

export default function AdminGeolocation() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  useEffect(() => {
    loadSetting();
  }, []);

  async function loadSetting() {
    setLoading(true);
    try {
      const res = await api.get('/attendance-settings');
      setForm({
        location_name: res.data.location_name,
        latitude: res.data.latitude,
        longitude: res.data.longitude,
        radius_meters: res.data.radius_meters,
        start_time: res.data.start_time?.slice(0, 5),
        end_time: res.data.end_time?.slice(0, 5),
      });
    } catch {
      // belum ada setting sama sekali — biarkan form kosong default
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocateError('Browser/perangkat ini tidak mendukung GPS.');
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((f) => ({
          ...f,
          latitude: position.coords.latitude.toFixed(7),
          longitude: position.coords.longitude.toFixed(7),
        }));
        setLocating(false);
      },
      () => {
        setLocateError('Gagal mengambil lokasi. Pastikan izin GPS diaktifkan.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setSuccess('');

    try {
      await api.put('/attendance-settings', form);
      setSuccess('Konfigurasi geolocation & jadwal berhasil disimpan.');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({ general: [err.response?.data?.message || 'Gagal menyimpan konfigurasi.'] });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary-container text-[32px]">sync</span>
      </div>
    );
  }

  const radiusPercent = Math.min((Number(form.radius_meters) / 500) * 100, 100);

  return (
    <div className="space-y-space-lg max-w-3xl">
      <div>
        <h1 className="text-headline-md font-bold text-text-primary">Konfigurasi Geolocation &amp; Jadwal Presensi</h1>
        <p className="text-body-md text-text-secondary">
          Atur titik lokasi sekolah, radius toleransi, dan jam buka/tutup absensi.
        </p>
      </div>

      {success && (
        <div className="bg-status-hadir/10 text-[#065F46] rounded-lg p-space-md text-body-md">{success}</div>
      )}
      {errors.general && (
        <div className="bg-error-container text-on-error-container rounded-lg p-space-md text-body-md">
          {errors.general[0]}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-space-lg">
        {/* Titik koordinat sekolah */}
        <div className="bg-surface border border-border rounded-xl p-space-md space-y-space-md">
          <h2 className="text-headline-sm font-semibold text-text-primary">Titik Koordinat Sekolah</h2>

          <Field
            label="Nama Titik Lokasi"
            name="location_name"
            value={form.location_name}
            onChange={handleChange}
            error={errors.location_name}
            placeholder="Contoh: Gerbang Utama SMKN 1 Sumedang"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <Field
              label="Latitude"
              name="latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={handleChange}
              error={errors.latitude}
              required
            />
            <Field
              label="Longitude"
              name="longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={handleChange}
              error={errors.longitude}
              required
            />
          </div>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={locating}
            className="h-10 px-space-md rounded-lg border border-primary-container text-primary-container font-semibold hover:bg-surface-container-low flex items-center gap-space-xs disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">
              {locating ? 'sync' : 'my_location'}
            </span>
            {locating ? 'Mengambil lokasi...' : 'Ambil Lokasi GPS Sekarang'}
          </button>
          {locateError && <p className="text-body-sm text-error">{locateError}</p>}
          <p className="text-body-sm text-text-secondary">
            Tips: buka halaman ini dari HP sambil berdiri tepat di titik gerbang sekolah, lalu klik tombol di atas
            supaya koordinatnya presisi.
          </p>

          <div>
            <label className="block text-label-md font-medium text-text-primary mb-space-xs">
              Radius Toleransi Presensi: <span className="font-tabular">{form.radius_meters} meter</span>
            </label>
            <input
              type="range"
              name="radius_meters"
              min="10"
              max="500"
              step="10"
              value={form.radius_meters}
              onChange={handleChange}
              className="w-full accent-primary-container"
            />
            <div className="flex justify-between text-body-sm text-text-secondary">
              <span>10m (Ketat)</span>
              <span>500m (Maksimal)</span>
            </div>
            {errors.radius_meters && <p className="text-body-sm text-error mt-1">{errors.radius_meters[0]}</p>}
          </div>

          {/* Visualisasi radius sederhana (tanpa peta) */}
          <div className="flex items-center justify-center py-space-md">
            <div className="relative w-40 h-40 rounded-full bg-primary-container/10 border-2 border-dashed border-primary-container/40 flex items-center justify-center">
              <div
                className="absolute rounded-full bg-primary-container/20 border border-primary-container flex items-center justify-center"
                style={{ width: `${Math.max(radiusPercent, 15)}%`, height: `${Math.max(radiusPercent, 15)}%` }}
              >
                <span className="material-symbols-outlined text-primary-container text-[20px]">school</span>
              </div>
            </div>
          </div>
        </div>

        {/* Jadwal */}
        <div className="bg-surface border border-border rounded-xl p-space-md space-y-space-md">
          <h2 className="text-headline-sm font-semibold text-text-primary">Jadwal &amp; Toleransi Absensi</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <Field
              label="Jam Mulai (Buka Presensi)"
              name="start_time"
              type="time"
              value={form.start_time}
              onChange={handleChange}
              error={errors.start_time}
              required
            />
            <Field
              label="Jam Selesai (Tutup Presensi)"
              name="end_time"
              type="time"
              value={form.end_time}
              onChange={handleChange}
              error={errors.end_time}
              required
            />
          </div>
          <p className="text-body-sm text-text-secondary">
            Siswa yang absen dalam 15 menit pertama sejak jam mulai otomatis berstatus <strong>Tepat Waktu</strong>;
            setelah itu sampai jam selesai berstatus <strong>Terlambat</strong>; di luar rentang ini absensi ditolak.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-11 px-space-lg rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary disabled:opacity-60 flex items-center gap-space-xs"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', required, placeholder, step }) {
  return (
    <div>
      <label className="block text-label-md font-medium text-text-primary mb-space-xs">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        step={step}
        className={`w-full h-11 px-space-md rounded-lg border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container ${
          error ? 'border-error' : 'border-border'
        }`}
      />
      {error && <p className="text-body-sm text-error mt-1">{error[0]}</p>}
    </div>
  );
}
