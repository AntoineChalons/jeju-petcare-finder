import { defineConfig } from 'vite';

// GitHub Pages project sites are served from a subpath (e.g. /jeju-petcare-finder/),
// so asset URLs must be relative rather than absolute.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
