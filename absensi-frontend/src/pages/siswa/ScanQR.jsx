import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import api from '../../lib/api';

export default function SiswaScanQR() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const [step, setStep] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState(null); // { success, message, detail }
  const [manualMode, setManualMode] = useState(false);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function startCamera() {
    setCameraError('');
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      setStep('scanning');
      tick();
    } catch (err) {
      setCameraError('Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan di browser.');
    }
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function tick() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code?.data) {
      stopCamera();
      processToken(code.data);
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  function processToken(token) {
    setStep('processing');

    if (!navigator.geolocation) {
      finishWithError('Perangkat kamu tidak mendukung GPS/Geolocation.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await api.post('/attendance', {
            qr_token: token,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setResult({
            success: true,
            message: res.data.message,
            detail: res.data.location,
          });
          setStep('result');
        } catch (err) {
          finishWithError(
            err.response?.data?.message || 'Gagal memproses absensi.',
            err.response?.data?.location,
          );
        }
      },
      (geoErr) => {
        finishWithError(
          geoErr.code === geoErr.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan GPS/izin lokasi untuk bisa absen.'
            : 'Gagal mendapatkan lokasi GPS. Coba lagi di tempat terbuka.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function finishWithError(message, detail) {
    setResult({ success: false, message, detail });
    setStep('result');
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualToken.trim()) return;
    processToken(manualToken.trim());
  }

  function reset() {
    setResult(null);
    setManualMode(false);
    setManualToken('');
    setStep('idle');
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto pb-24">
      {/* Header Halaman */}
      <div>
        <h1 className="text-headline-md font-bold text-text-primary">Scan QR Absensi</h1>
        <p className="text-body-sm text-text-secondary">Lakukan presensi harian secara mandiri di gerbang sekolah</p>
      </div>

      {/* State Idle: Tampilan awal sebelum kamera aktif */}
      {step === 'idle' && !manualMode && (
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-xs">
          <div className="w-20 h-20 rounded-2xl bg-primary-container/10 text-primary-container flex items-center justify-center mx-auto shadow-xs">
            <span className="material-symbols-outlined text-[40px]">qr_code_scanner</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-headline-sm font-semibold text-text-primary">Arahkan Kamera ke QR Gerbang</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              Pastikan GPS atau izin lokasi perangkat Anda aktif agar validasi radius sekolah berhasil diverifikasi sistem.
            </p>
          </div>

          {cameraError && (
            <div className="bg-error-container text-on-error-container rounded-xl p-3 text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{cameraError}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={startCamera}
              className="w-full h-11 rounded-xl bg-primary-container text-on-primary font-semibold hover:opacity-90 flex items-center justify-center gap-2 transition shadow-xs"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              Izinkan Lokasi &amp; Scan QR
            </button>
            <button
              onClick={() => setManualMode(true)}
              className="w-full h-11 rounded-xl border border-border bg-surface text-text-primary font-medium hover:bg-surface-container-low transition"
            >
              Input Kode Alternatif Manual
            </button>
          </div>
        </div>
      )}

      {/* State Manual Input */}
      {manualMode && step === 'idle' && (
        <form onSubmit={handleManualSubmit} className="bg-surface border border-border rounded-2xl p-6 space-y-5 shadow-xs">
          <div>
            <h2 className="text-headline-sm font-semibold text-text-primary mb-1">Input Kode Token Manual</h2>
            <p className="text-body-sm text-text-secondary">Masukkan string token QR yang diberikan petugas jika kamera bermasalah.</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-label-md font-medium text-text-primary">Token Absensi</label>
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Contoh: TOKEN-QR-XYZ123"
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="flex-1 h-11 rounded-xl border border-border text-text-primary font-medium hover:bg-surface-container-low transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-primary-container text-on-primary font-semibold hover:opacity-90 transition shadow-xs"
            >
              Kirim Token
            </button>
          </div>
        </form>
      )}

      {/* State Scanning: Kamera Aktif */}
      <div className={`space-y-4 ${step === 'scanning' ? '' : 'hidden'}`}>
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-square shadow-md border border-border">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
          {/* Border panduan pemindai kotak tengah */}
          <div className="absolute inset-12 border-2 border-primary-container/80 rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-primary-container/50 animate-pulse"></div>
          </div>
        </div>
        <p className="text-body-sm text-text-secondary text-center font-medium">Posisikan QR Code di dalam kotak pemindai...</p>
        <button
          onClick={() => {
            stopCamera();
            reset();
          }}
          className="w-full h-11 rounded-xl border border-border bg-surface text-text-primary font-medium hover:bg-surface-container-low transition shadow-xs"
        >
          Batalkan Scan
        </button>
      </div>

      {/* State Processing: Loading Geolocation & API */}
      {step === 'processing' && (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <span className="material-symbols-outlined animate-spin text-primary-container text-[40px]">sync</span>
          <div>
            <p className="text-headline-sm font-semibold text-text-primary">Memverifikasi Lokasi GPS</p>
            <p className="text-body-sm text-text-secondary mt-1">Mohon tunggu, sistem sedang mencocokkan koordinat radius sekolah...</p>
          </div>
        </div>
      )}

      {/* State Result: Hasil Berhasil / Gagal */}
      {step === 'result' && result && (
        <div
          className={`rounded-2xl p-6 text-center space-y-4 border shadow-xs ${
            result.success ? 'bg-emerald-50/5 border-emerald-200' : 'bg-red-50/5 border-red-200'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xs ${
            result.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className="material-symbols-outlined text-[32px]">
              {result.success ? 'check_circle' : 'error'}
            </span>
          </div>

          <div>
            <h2 className={`text-headline-sm font-bold ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
              {result.success ? 'Presensi Masuk Berhasil!' : 'Presensi Ditolak'}
            </h2>
            <p className="text-body-md text-text-primary mt-1 font-medium">{result.message}</p>
          </div>

          {result.detail && (
            <div className="bg-surface rounded-xl p-4 text-left text-body-sm space-y-2 border border-border/60">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Jarak dari titik absensi</span>
                <span className="font-semibold font-tabular text-text-primary">{result.detail.distance_meters}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Radius maksimal diizinkan</span>
                <span className="font-semibold font-tabular text-text-primary">{result.detail.radius_meters}m</span>
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="w-full h-11 rounded-xl bg-primary-container text-on-primary font-semibold hover:opacity-90 transition shadow-xs"
          >
            {result.success ? 'Selesai' : 'Coba Scan Ulang'}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}