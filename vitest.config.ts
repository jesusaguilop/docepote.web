import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@infra': path.resolve(__dirname, './src/infrastructure'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
