import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 3000,
    sourcemap: false,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('html2pdf.js')) return 'html2pdf';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('framer-motion')) return 'animations';
            return 'vendor';
          }
        },
      },
    },
  },
});
