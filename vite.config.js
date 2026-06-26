import { defineConfig } from 'vite';

// base: './' so the build works when served from any sub-path (GitHub Pages, etc.)
export default defineConfig({
  base: './',
  server: { open: true },
});
