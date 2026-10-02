import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import api from '../../lib/api';

// idle -> meminta izin kamera belum dimulai
// scanning -> kamera aktif, mencari QR
// processing -> QR ketemu, sedang ambil lokasi & kirim ke server
// result -> hasil akhir (sukses/gagal)
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
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
    <div className="p-space-md space-y-space-md">
      <h1 className="text-headline-md font-bold text-text-primary pt-space-sm">Scan QR Absensi</h1>

      {step === 'idle' && !manualMode && (
        <div className="bg-surface border border-border rounded-xl p-space-lg text-center space-y-space-md">
          <span className="material-symbols-outlined text-primary-container text-[56px]">qr_code_scanner</span>
          <p className="text-body-md text-text-secondary">
            Arahkan kamera ke QR Code yang ditampilkan Admin/Petugas di gerbang sekolah. Pastikan GPS/lokasi
            perangkat kamu aktif.
          </p>
          {cameraError && <p className="text-body-sm text-error">{cameraError}</p>}
          <button
            onClick={startCamera}
            className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary flex items-center justify-center gap-space-xs"
          >
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            Izinkan Lokasi &amp; Scan QR
          </button>
          <button
            onClick={() => setManualMode(true)}
            className="w-full h-11 rounded-lg border border-border text-text-primary font-medium hover:bg-surface-subtle"
          >
            Input Kode Alternatif Manual
          </button>
        </div>
      )}

      {manualMode && step === 'idle' && (
        <form onSubmit={handleManualSubmit} className="bg-surface border border-border rounded-xl p-space-lg space-y-space-md">
          <label className="block text-label-md font-medium text-text-primary">Kode QR (ditulis manual)</label>
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Tempel/ketik kode QR di sini"
            className="w-full h-11 px-space-md rounded-lg border border-border text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
          <div className="flex gap-space-sm">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="flex-1 h-11 rounded-lg border border-border text-text-primary font-medium hover:bg-surface-subtle"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary"
            >
              Kirim
            </button>
          </div>
        </form>
      )}

      {step === 'scanning' && (
        <div className="space-y-space-md">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-8 border-2 border-secondary-container rounded-xl" />
          </div>
          <p className="text-body-sm text-text-secondary text-center">Arahkan kamera ke QR Code...</p>
          <button
            onClick={() => {
              stopCamera();
              reset();
            }}
            className="w-full h-11 rounded-lg border border-border text-text-primary font-medium hover:bg-surface-subtle"
          >
            Batal
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="bg-surface border border-border rounded-xl p-space-lg text-center space-y-space-md">
          <span className="material-symbols-outlined animate-spin text-primary-container text-[40px]">sync</span>
          <p className="text-body-md text-text-secondary">Memeriksa lokasi dan memproses absensi...</p>
        </div>
      )}

      {step === 'result' && result && (
        <div
          className={`rounded-xl p-space-lg text-center space-y-space-sm border ${
            result.success ? 'bg-status-hadir/5 border-status-hadir/30' : 'bg-status-alpa/5 border-status-alpa/30'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[48px] ${
              result.success ? 'text-status-hadir' : 'text-status-alpa'
            }`}
          >
            {result.success ? 'check_circle' : 'error'}
          </span>
          <p className={`text-headline-sm font-bold ${result.success ? 'text-status-hadir' : 'text-status-alpa'}`}>
            {result.success ? 'Absensi Berhasil!' : 'Absensi Ditolak'}
          </p>
          <p className="text-body-md text-text-primary">{result.message}</p>

          {result.detail && (
            <div className="bg-surface rounded-lg p-space-md text-left text-body-sm space-y-1 mt-space-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Jarak dari titik absensi</span>
                <span className="font-semibold text-text-primary">{result.detail.distance_meters}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Radius diizinkan</span>
                <span className="font-semibold text-text-primary">{result.detail.radius_meters}m</span>
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="w-full h-11 mt-space-sm rounded-lg bg-primary-container text-on-primary font-semibold hover:bg-primary"
          >
            {result.success ? 'Selesai' : 'Coba Lagi'}
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
