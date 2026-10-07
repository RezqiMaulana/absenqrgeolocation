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
        location_name: res.data.location_name || '',
        latitude: res.data.latitude || '',
        longitude: res.data.longitude || '',
        radius_meters: res.data.radius_meters || 100,
        start_time: res.data.start_time?.slice(0, 5) || '06:00',
        end_time: res.data.end_time?.slice(0, 5) || '07:00',
      });
    } catch {
      // Biarkan kosong jika belum ada setting
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
    <div className="space-y-space-lg max-w-6xl mx-auto pb-20">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/10 text-primary-container uppercase tracking-wider">
              Zona 01 — Utama
            </span>
          </div>
          <h1 className="text-headline-md font-bold text-text-primary">Konfigurasi Geolocation &amp; Jadwal Presensi</h1>
          <p className="text-body-md text-text-secondary mt-0.5">
            Atur titik koordinat sekolah, radius toleransi, dan jam operasional absensi harian siswa.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="h-11 px-space-lg rounded-xl bg-primary-container text-on-primary font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm transition"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 text-body-md flex items-center gap-3 shadow-xs">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          {success}
        </div>
      )}
      {errors.general && (
        <div className="bg-error-container text-on-error-container rounded-xl p-4 text-body-md flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          {errors.general[0]}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KOLOM KIRI: Input Form Data (7 Grid) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card Titik Koordinat */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-sm font-semibold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">location_on</span>
                Titik Koordinat Sekolah
              </h2>
            </div>

            <Field
              label="Nama Titik Lokasi"
              name="location_name"
              value={form.location_name}
              onChange={handleChange}
              error={errors.location_name}
              placeholder="Contoh: Gerbang Utama SMKN 1 Sumedang"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Latitude (Lintang)"
                name="latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={handleChange}
                error={errors.latitude}
                required
              />
              <Field
                label="Longitude (Bujur)"
                name="longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={handleChange}
                error={errors.longitude}
                required
              />
            </div>

            {/* Tombol Aksi GPS */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locating}
                className="h-11 px-4 rounded-xl border border-primary-container text-primary-container font-semibold hover:bg-primary-container/5 flex items-center gap-2 disabled:opacity-60 transition"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {locating ? 'sync' : 'my_location'}
                </span>
                {locating ? 'Mengambil GPS...' : 'Dapatkan Lokasi GPS'}
              </button>
            </div>
            {locateError && <p className="text-body-sm text-error">{locateError}</p>}
            <p className="text-body-sm text-text-secondary italic">
              *Tips: Buka halaman ini dari smartphone Anda saat berdiri tepat di gerbang sekolah untuk hasil koordinat paling akurat.
            </p>

            {/* Radius Slider */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-label-md font-medium text-text-primary">
                  Radius Toleransi Presensi
                </label>
                <span className="px-3 py-1 bg-surface-container rounded-lg font-tabular font-bold text-primary-container text-sm">
                  {form.radius_meters} meter
                </span>
              </div>
              <input
                type="range"
                name="radius_meters"
                min="10"
                max="500"
                step="10"
                value={form.radius_meters}
                onChange={handleChange}
                className="w-full accent-primary-container cursor-pointer"
              />
              <div className="flex justify-between text-xs text-text-secondary font-medium">
                <span>10m (Ketat)</span>
                <span>250m (Standar)</span>
                <span>500m (Maksimal)</span>
              </div>
              {errors.radius_meters && <p className="text-body-sm text-error mt-1">{errors.radius_meters[0]}</p>}
            </div>

          </div>

          {/* Card Jadwal & Toleransi */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5 shadow-xs">
            <h2 className="text-headline-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">schedule</span>
              Jadwal &amp; Ketentuan Presensi Harian
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Jam Mulai (Buka Absen)"
                name="start_time"
                type="time"
                value={form.start_time}
                onChange={handleChange}
                error={errors.start_time}
                required
              />
              <Field
                label="Jam Selesai (Tutup Absen)"
                name="end_time"
                type="time"
                value={form.end_time}
                onChange={handleChange}
                error={errors.end_time}
                required
              />
            </div>
            
            <div className="bg-surface-container-low p-4 rounded-xl border border-border/60 text-body-sm text-text-secondary space-y-1">
              <p className="font-semibold text-text-primary">Aturan Sistem:</p>
              <p>• Absen dalam waktu yang ditentukan tercatat <span className="text-emerald-700 font-medium">Hadir</span>.</p>
              <p>• Setelah lewat 15 menit tercatat <span className="text-amber-700 font-medium">Terlambat</span>.</p>
              <p>• Di luar rentang waktu tersebut, sistem secara otomatis menolak presensi masuk.</p>
            </div>
          </div>

        </div>

        {/* KOLOM KANAN: Visualisasi Peta / Radar Radius (5 Grid) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 sticky top-6 shadow-xs flex flex-col items-center justify-between min-h-[480px]">
            <div className="w-full flex items-center justify-between mb-4">
              <h3 className="text-headline-sm font-semibold text-text-primary">Visualisasi Area Radius</h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                GPS Aktif
              </span>
            </div>

            {/* Simulasi Radar Lingkaran Radius */}
            <div className="relative w-64 h-64 rounded-full bg-primary-container/5 border-2 border-dashed border-primary-container/30 flex items-center justify-center my-auto shadow-inner">
              {/* Lingkaran Inner */}
              <div
                className="absolute rounded-full bg-primary-container/15 border border-primary-container/50 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-sm"
                style={{ width: `${Math.max(radiusPercent, 25)}%`, height: `${Math.max(radiusPercent, 25)}%` }}
              >
                <div className="bg-surface p-2 rounded-full shadow-md text-primary-container mb-1">
                  <span className="material-symbols-outlined text-[24px]">school</span>
                </div>
              </div>
              
              {/* Badge Radius di luar */}
              <div className="absolute bottom-4 bg-surface px-3 py-1 rounded-full border border-border shadow-xs text-xs font-bold text-text-primary">
                Radius: {form.radius_meters}m
              </div>
            </div>

            <div className="w-full space-y-2 pt-4 border-t border-border text-center">
              <p className="text-body-sm font-medium text-text-primary truncate">
                {form.location_name || 'Belum ada nama lokasi'}
              </p>
              <p className="text-xs text-text-secondary font-mono">
                Lat: {form.latitude || '0.0000000'}, Long: {form.longitude || '0.0000000'}
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = 'text', required, placeholder, step }) {
  return (
    <div>
      <label className="block text-label-md font-medium text-text-primary mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        step={step}
        className={`w-full h-11 px-4 rounded-xl border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition ${
          error ? 'border-error' : 'border-border'
        }`}
      />
      {error && <p className="text-body-sm text-error mt-1">{error[0]}</p>}
    </div>
  );
}