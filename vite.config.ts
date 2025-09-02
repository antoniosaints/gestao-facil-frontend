import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

const env = loadEnv('development', process.cwd())
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Gestão Fácil - ERP',
        short_name: 'Gestão Fácil',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#fff',
        icons: [
          {
            src: '/imgs/192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/imgs/512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: new RegExp(`^${env.VITE_API_URL.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
