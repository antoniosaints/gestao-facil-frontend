import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://127.0.0.1:5179/__qa_no_network__'),
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify('http://127.0.0.1:5179'),
  },
  resolve: {
    alias: [
      {
        find: '@/utils/axios',
        replacement: fileURLToPath(new URL('./previewHttp.ts', import.meta.url)),
      },
      {
        find: '@/pluguins/socket',
        replacement: fileURLToPath(new URL('./previewSocket.ts', import.meta.url)),
      },
      { find: '@', replacement: fileURLToPath(new URL('../../', import.meta.url)) },
    ],
  },
  server: { host: '127.0.0.1', port: 5179, strictPort: true },
})
