import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
  ],
  worker: {
    format: 'es',
    plugins: () => [
      wasm(),
      topLevelAwait()
    ]
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    modulePreload: true
  },
  optimizeDeps: {
    exclude: ['babyjubjub-utils', '@aztec/bb.js', '@noir-lang/noir_wasm'], // Replace with your actual WASM package name
    esbuildOptions: {
      target: "esnext",
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
