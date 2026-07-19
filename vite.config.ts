import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// To enable build-time image compression to automatically convert local assets to WebP
// and minimize bundle size, install vite-plugin-image-optimizer:
// npm install vite-plugin-image-optimizer --save-dev
// And uncomment the import and configuration below:
// import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ViteImageOptimizer({
    //   png: { quality: 80 },
    //   jpeg: { quality: 80 },
    //   webp: { lossy: true, quality: 80 },
    //   svg: {
    //     plugins: [
    //       { name: 'removeViewBox', active: false },
    //       { name: 'sortAttrs', active: true },
    //     ]
    //   }
    // })
  ],
  base: '/',
})
