import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@core': '/src/app/core',
      '@features': '/src/app/features',
      '@shared': '/src/app/shared'
    }
  },
  build: {
    outDir: 'dist/finest9',
    sourcemap: false,
    minify: true
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
