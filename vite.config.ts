import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Check .env file first, then fall back to system environment variables
      // (needed for AI Studio, Vercel, and other hosted environments)
      'process.env.GEMINI_API_KEY': JSON.stringify(
        env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
      ),
      'process.env.ZEROGPT_API_KEY': JSON.stringify(
        env.ZEROGPT_API_KEY || process.env.ZEROGPT_API_KEY || ''
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy /api/* to Express dev server when running Vite standalone
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
