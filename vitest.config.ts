import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.ts']
  },
  resolve: {
    alias: {
      '@core': '/src/app/core',
      '@features': '/src/app/features',
      '@shared': '/src/app/shared'
    }
  }
});
