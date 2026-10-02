import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      'cda3-114-122-77-74.ngrok-free.app',
    ]
  },
});
