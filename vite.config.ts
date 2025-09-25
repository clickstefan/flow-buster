import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@/core': '/src/core',
      '@/audio': '/src/audio',
      '@/game': '/src/game',
      '@/ui': '/src/ui',
      '@/data': '/src/data',
      '@/utils': '/src/utils'
    }
  },
  optimizeDeps: {
    include: ['phaser', 'meyda', 'tone']
  }
});