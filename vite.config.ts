import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'core'),
      '@interfaces': path.resolve(__dirname, 'interfaces'),
    },
  },
});
