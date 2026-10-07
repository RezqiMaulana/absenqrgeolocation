import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      '9a6e-114-122-78-221.ngrok-free.app',
    ],
    hmr: {
      protocol: 'wss', // Gunakan WebSocket Secure karena Ngrok memakai HTTPS
      host: '9a6e-114-122-78-221.ngrok-free.app', // URL Ngrok Anda (tanpa https:// atau garis miring)
      clientPort: 443, // Port standar HTTPS dari Ngrok, bukan 5173
    }
  },
});
