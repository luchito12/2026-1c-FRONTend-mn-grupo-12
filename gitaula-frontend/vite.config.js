import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('/node_modules/')) return;
            if (id.includes('/@mui/') || id.includes('/@emotion/')) return 'material';
            if (
              id.includes('/zod/') ||
              id.includes('/react-hook-form/') ||
              id.includes('/@hookform/')
            )
              return 'forms';
            return 'vendor';
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': env.VITE_BACKEND_URL || 'http://localhost:8080',
        '/commissions': env.VITE_BACKEND_URL || 'http://localhost:8080',
        '/projects': env.VITE_BACKEND_URL || 'http://localhost:8080',
        '/teams': env.VITE_BACKEND_URL || 'http://localhost:8080',
        '/deliveries': env.VITE_BACKEND_URL || 'http://localhost:8080',
        '/users': env.VITE_BACKEND_URL || 'http://localhost:8080',
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      globals: true,
      exclude: ['e2e/**', 'node_modules/**'],
    },
  };
});
