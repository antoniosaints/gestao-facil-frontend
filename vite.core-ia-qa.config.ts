import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  root: 'qa/core-ia',
  plugins: [vue()],
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api') },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] },
    proxy: { '/api': 'http://127.0.0.1:4174', '/qa': 'http://127.0.0.1:4174' },
  },
})
