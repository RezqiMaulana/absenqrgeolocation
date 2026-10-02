import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import Modal from '../Modal';
import api from '../../lib/api';

export default function QrDisplayModal({ open, onClose }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validDate, setValidDate] = useState('');

  useEffect(() => {
    if (open) loadQr();
  }, [open]);

  async function loadQr() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/qr/token');
      setValidDate(res.data.valid_date);
      await QRCode.toCanvas(canvasRef.current, res.data.qr_token, { width: 280, margin: 2 });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat QR Code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="QR Code Absensi Hari Ini">
      <div className="flex flex-col items-center text-center space-y-space-md">
        {error && <p className="text-body-sm text-error">{error}</p>}
        {loading && <p className="text-body-sm text-text-secondary">Memuat QR Code...</p>}
        <canvas ref={canvasRef} className={loading ? 'hidden' : ''} />
        {!loading && !error && (
          <p className="text-body-sm text-text-secondary">
            QR ini hanya berlaku untuk tanggal <strong>{validDate}</strong>. Tampilkan di layar/proyektor gerbang
            sekolah supaya siswa bisa scan.
          </p>
        )}
      </div>
    </Modal>
  );
}
