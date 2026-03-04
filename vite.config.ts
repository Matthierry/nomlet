import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use relative asset paths so the app works on GitHub Pages project paths.
export default defineConfig({
  plugins: [react()],
  base: './',
});
