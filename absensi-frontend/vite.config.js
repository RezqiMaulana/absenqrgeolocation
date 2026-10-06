import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      'e665-2404-c0-2e10-00-4d41-e4da.ngrok-free.app',
    ],
    hmr: {
      protocol: 'wss', // Gunakan WebSocket Secure karena Ngrok memakai HTTPS
      host: 'e665-2404-c0-2e10-00-4d41-e4da.ngrok-free.app', // URL Ngrok Anda (tanpa https:// atau garis miring)
      clientPort: 443, // Port standar HTTPS dari Ngrok, bukan 5173
    }
  },
});
