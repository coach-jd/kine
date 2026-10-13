import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kine',
        short_name: 'Kine',
        description: 'Polimetrajes: historias en video vertical donde tú decides cómo terminan.',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#060A1C',
        background_color: '#060A1C',
        icons: [
          { src: 'marca/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'marca/icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'marca/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // El video nunca se precachea: se sirve aparte y pesa demasiado.
        globPatterns: ['**/*.{js,css,html,png,webp,svg}'],
        // Las imágenes de vista previa solo las piden las apps de mensajería.
        globIgnores: ['og/**'],
        // Los enlaces para compartir los responde el servidor, no la app instalada.
        navigateFallbackDenylist: [/\/media\//, /^\/c\//],
      },
    }),
  ],
})
