import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ command }) => ({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), {
    name: 'development-csp',
    transformIndexHtml(html) {
      // Only the local development server needs HMR; shipped output retains strict CSP.
      return command === 'serve' ? html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '') : html;
    },
  }],
  build: { outDir: 'dist', emptyOutDir: true, modulePreload: { polyfill: false }, sourcemap: false },
}));
