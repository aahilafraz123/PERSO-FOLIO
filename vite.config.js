import { defineConfig } from 'vite';

// base: './' so the build works when served from any sub-path (GitHub Pages, etc.)
export default defineConfig({
  base: './',
  // Honor the PORT assigned by the launch runner (preview_start with autoPort);
  // fall back to Vite's default when run directly.
  server: { open: true, port: process.env.PORT ? Number(process.env.PORT) : undefined },
});
