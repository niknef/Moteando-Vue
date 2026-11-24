import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const DAY = 24 * 60 * 60

// PWA: se instala en el celular y, sin señal, muestra lo último que se cargó (rutas, mapa,
// fotos). La app en sí queda precacheada; los datos se cachean al usarlos.
const pwa = VitePWA({
  // la versión nueva espera a que el usuario toque "Actualizar" (PwaStatus.vue)
  registerType: 'prompt',
  injectRegister: null,
  includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png'],
  manifest: {
    name: 'Moteando',
    short_name: 'Moteando',
    description: 'Armá tu ruta en moto, compartila al navegador de cada uno y organizá la rodada.',
    lang: 'es-AR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#1c1c1c',
    background_color: '#1c1c1c',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Crear ruta', url: '/rutas/nueva' },
      { name: 'Mis rutas', url: '/rutas' },
      { name: 'Descubrir', url: '/descubrir' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    navigateFallback: '/index.html',
    // las funciones de Vercel (vista previa de links) no son la app
    navigateFallbackDenylist: [/^\/api\//],
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        // Lecturas de Supabase: primero la red; sin señal (o si tarda), lo último guardado
        urlPattern: ({ url, request }) =>
          request.method === 'GET' && url.pathname.startsWith('/rest/v1/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'moteando-api',
          networkTimeoutSeconds: 6,
          expiration: { maxEntries: 300, maxAgeSeconds: 14 * DAY },
          cacheableResponse: { statuses: [200] },
        },
      },
      {
        // Fotos públicas (avatares, motos, salidas): no cambian de URL
        urlPattern: ({ url }) => url.pathname.startsWith('/storage/v1/object/public/'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'moteando-images',
          expiration: { maxEntries: 300, maxAgeSeconds: 30 * DAY, purgeOnQuotaError: true },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Mapa base de Carto (estilo, tiles, tipografías): lo que se vio queda para sin señal
        urlPattern: ({ url }) => url.hostname.endsWith('cartocdn.com'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'moteando-map',
          expiration: { maxEntries: 1500, maxAgeSeconds: 30 * DAY, purgeOnQuotaError: true },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})

export default {
  plugins: [vue(), tailwindcss(), pwa],
  // El worker de MapLibre 6 es un módulo ES
  worker: { format: 'es' },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}
