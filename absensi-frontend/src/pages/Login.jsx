import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ServerClock from '../components/ServerClock';

const ROLE_HOME = {
  admin: '/admin/dashboard',
  wali_kelas: '/staff/dashboard',
  seksi_absensi: '/staff/dashboard',
  siswa: '/siswa/beranda',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const redirectTo = location.state?.from || ROLE_HOME[user.role] || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Panel kiri: hero showcase (desktop only) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-margin-desktop overflow-hidden bg-primary-container text-on-primary select-none">

        <img 
        src="../assets/backgroundNesas.jpg"
        alt="Background Sekolah" 
        className="absolute inset-0 w-full h-full object-cover z-0" 
        />

        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary-container/90 to-primary/80 z-10" />

        <div className="relative z-20 flex items-center justify-between">
          <div className="flex items-center space-x-space-sm bg-surface/10 backdrop-blur-md px-space-md py-space-xs rounded-full">
            <div className="w-8 h-8 rounded-full bg-surface/20 flex items-center justify-center font-bold text-surface">
              <img src="../assets/nesas.png" alt="Logo" className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm text-surface font-bold leading-none">NESAS</span>
              <span className="text-label-sm text-surface-variant/80">SMKN 1 Sumedang - Presensi Digital</span>
            </div>
          </div>
          <div className="flex items-center space-x-space-xs bg-surface/15 backdrop-blur-md px-space-md py-space-xs rounded-full text-surface text-label-sm">
            <span className="w-2 h-2 rounded-full bg-status-hadir animate-pulse" />
            <ServerClock className="font-tabular tracking-wider" />
          </div>
        </div>

        <div className="relative z-20 my-auto py-space-xl max-w-lg">
          <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-variant/20 text-inverse-primary text-label-sm mb-space-md">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Versi Institusi v1.0.0
          </div>
          <h1 className="text-headline-lg text-surface font-bold tracking-tight mb-space-md leading-tight">
            Gerbang Presensi Digital Masa Depan
          </h1>
          <p className="text-body-lg text-surface-variant/90 leading-relaxed mb-space-lg">
            &ldquo;Pendidikan adalah paspor ke masa depan, karena hari esok dimiliki oleh mereka yang
            mempersiapkannya hari ini.&rdquo;
          </p>
          <div className="grid grid-cols-2 gap-space-md pt-space-md">
            <div className="flex items-start space-x-space-sm bg-surface/10 backdrop-blur-sm p-space-md rounded-xl">
              <span className="material-symbols-outlined text-secondary-container mt-0.5">location_on</span>
              <div>
                <div className="text-headline-sm text-surface font-semibold">QR + Geolocation</div>
                <div className="text-body-sm text-surface-variant/80">Validasi radius area sekolah</div>
              </div>
            </div>
            <div className="flex items-start space-x-space-sm bg-surface/10 backdrop-blur-sm p-space-md rounded-xl">
              <span className="material-symbols-outlined text-secondary-container mt-0.5">bolt</span>
              <div>
                <div className="text-headline-sm text-surface font-semibold">Real-time</div>
                <div className="text-body-sm text-surface-variant/80">Monitoring kehadiran langsung</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center justify-between p-space-md bg-surface/10 backdrop-blur-md rounded-xl">
          <div className="flex items-center space-x-space-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-status-hadir" />
            <div>
              <div className="text-label-md text-surface font-medium">Sistem Berjalan Normal</div>
              <div className="text-body-sm text-surface-variant/75">Presensi Server & Geolocation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel kanan: form login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-space-md sm:p-space-lg lg:p-margin-desktop">
        {error && (
          <div className="w-full max-w-md mb-space-md bg-surface rounded-xl shadow-md overflow-hidden">
            <div className="flex items-start p-space-md gap-space-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-status-alpa">
                <span className="material-symbols-outlined text-[20px]">error</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm bg-error-container text-error font-semibold mb-1">
                  Autentikasi Gagal
                </span>
                <p className="text-body-sm text-text-primary">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-text-secondary hover:text-text-primary"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        <div className="w-full max-w-md bg-surface rounded-xl p-space-md sm:p-space-lg shadow-sm">
          <div className="flex flex-col items-center text-center mb-space-lg">
            <div className="w-16 h-16 mb-space-sm flex items-center justify-center rounded-full bg-primary-container text-on-primary text-headline-lg font-bold">
              <img src="../assets/nesas.png" alt="Logo" className="w-8 h-10" />
            </div>
            <h2 className="text-headline-md font-bold text-text-primary">Masuk Akun Presensi</h2>
            <p className="text-body-md text-text-secondary mt-1">
              Silakan masuk menggunakan kredensial terdaftar Anda
            </p>
          </div>

          <form className="space-y-space-md" onSubmit={handleSubmit}>
            <div>
              <label className="block text-label-md font-medium text-text-primary mb-space-xs" htmlFor="email">
                Email
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-text-secondary text-[20px]">
                  person
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email akun Anda"
                  className="w-full h-11 pl-10 pr-space-md rounded-lg bg-surface text-text-primary text-body-md placeholder:text-text-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-space-xs">
                <label className="text-label-md font-medium text-text-primary" htmlFor="password">
                  Kata Sandi
                </label>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-text-secondary text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface text-text-primary text-body-md placeholder:text-text-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 text-text-secondary hover:text-text-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer select-none space-x-space-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary-container"
                />
                <span className="text-body-md text-text-secondary">Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-space-md flex items-center justify-center space-x-space-xs rounded-lg bg-primary-container text-on-primary text-headline-sm font-semibold hover:bg-primary transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                <>
                  <span>Masuk Ke Sistem</span>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-space-lg pt-space-md flex flex-col items-center justify-center text-center space-y-space-xs">
            <div className="flex items-center space-x-1 text-text-secondary text-body-sm">
              <span>Mengalami kendala akun?</span>
              <span className="text-primary-container font-semibold">Hubungi Admin Sekolah</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
