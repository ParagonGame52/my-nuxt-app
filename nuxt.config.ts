// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'DIP & DRIP - สตรีทแฟชั่น & กล่องสุ่มเสื้อผ้า',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'ร้านเสื้อผ้าสตรีทแฟชั่น มินิมอล พร้อมตู้สุ่มเสื้อผ้าสุดคุ้ม' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  modules: ['@nuxt/content', '@nuxt/icon', '@nuxtjs/tailwindcss', '@nuxtjs/color-mode', '@pinia/nuxt'],
  css: ['vue-sonner/style.css'],
  colorMode: {
    classSuffix: ''
  },
  tailwindcss: {
    config: {
      darkMode: 'class',
    },
  },
  devtools: { enabled: false },
  compatibilityDate: '2024-04-03',
})