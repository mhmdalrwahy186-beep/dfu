import {defineConfig} from 'vite';

// Port 5179 keeps the starter out of the way of the reference project on 5178.
export default defineConfig({
  server: {host: '127.0.0.1', port: 5179},
  preview: {host: '127.0.0.1', port: 5179},
  build: {target: 'es2022', chunkSizeWarningLimit: 1600}
});
