import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(import.meta.dirname, 'showcase'),
  base: './',
  publicDir: resolve(import.meta.dirname, '.cache/showcase-public'),
  build: { outDir: resolve(import.meta.dirname, 'dist/showcase'), emptyOutDir: true },
});
