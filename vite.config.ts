import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Get the branch name from environment variable or fallback to 'main'
  const branch = process.env.BRANCH_NAME || process.env.GITHUB_REF_NAME || 'main';
  
  // Determine the base path for the deployment
  // For development, use relative path, for production use branch-specific path
  let basePath = './';
  if (command === 'build' && mode === 'production') {
    basePath = `/${branch}/`;
  }

  return {
    root: '.',
    base: basePath,
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
  };
});