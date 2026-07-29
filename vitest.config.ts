import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'core'),
      '@interfaces': path.resolve(__dirname, 'interfaces'),
      '@data': path.resolve(__dirname, 'data'),
      '@content': path.resolve(__dirname, 'content'),
    },
  },
});
