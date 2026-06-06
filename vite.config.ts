import { defineConfig } from 'vite';

// A human-readable build stamp shown top-center in-game, so we can tell which
// build is live (and whether a refresh is needed). Date-based, regenerated every
// build. Bump the leading version by hand on meaningful milestones.
const BUILD_ID =
  'v0.4 · ' + new Date().toISOString().slice(2, 16).replace('T', ' ') + ' UTC';

// Web-first. `base: './'` keeps asset URLs relative so a later Capacitor iOS
// wrap (file://) works unchanged. Phaser is large — pre-bundle it for fast dev
// start and split it into its own chunk for cache-friendly builds.
export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  server: { host: true, port: 5173 },
  optimizeDeps: { include: ['phaser'] },
  build: {
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
