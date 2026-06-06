import { defineConfig } from 'vite';

// Web-first. `base: './'` keeps asset URLs relative so a later Capacitor iOS
// wrap (file://) works unchanged. Phaser is large — pre-bundle it for fast dev
// start and split it into its own chunk for cache-friendly builds.
export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  optimizeDeps: { include: ['phaser'] },
  build: {
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
