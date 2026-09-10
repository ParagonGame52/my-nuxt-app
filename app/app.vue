<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { Toaster } from 'vue-sonner'

const colorMode = useColorMode()
const isDarkMode = computed(() => colorMode.value === 'dark')
provide('isDarkMode', isDarkMode)

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// State
const showMobileMenu = ref(false)
const showQRModal = ref(false)

// Close mobile drawer on route change
watch(() => route.path, () => {
  showMobileMenu.value = false
})

async function handleLogout() {
  showMobileMenu.value = false
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="app-layout font-sans min-h-screen bg-app-light text-slate-900 dark:bg-app-dark dark:text-slate-100 transition-colors duration-300 flex flex-col">
    
    <!-- Navbar Header -->
    <AppNavbar
      @toggle-theme="toggleTheme"
      @open-topup="showQRModal = true"
      @toggle-mobile-menu="showMobileMenu = !showMobileMenu"
      @logout="handleLogout"
    />

    <!-- Address Reminder Banner -->
    <AppAddressBanner />

    <!-- Mobile Drawer Side Menu -->
    <AppMobileDrawer
      v-model="showMobileMenu"
      @toggle-theme="toggleTheme"
      @open-topup="showQRModal = true"
      @logout="handleLogout"
    />

    <!-- Main Content Area with safe bottom padding on mobile -->
    <main class="flex-1 pb-20 md:pb-8">
      <NuxtPage />
    </main>

    <!-- Mobile Sticky Bottom Navigation -->
    <AppBottomNav />

    <!-- PromptPay Top-up Modal -->
    <AppTopupModal v-model="showQRModal" />

    <!-- Global Toast Container & Confirm Modal -->
    <ClientOnly>
      <Toaster position="top-right" :theme="isDarkMode ? 'dark' : 'light'" richColors closeButton />
    </ClientOnly>
    <AppConfirmModal />
  </div>
</template>

<style>
/* ── Global Theme Background ─────────────────────────── */
html, body {
  background-color: #F6F6F2;
}
html.dark, html.dark body {
  background-color: #0a0a0a;
}

/* ── Remove browser default focus ring on links/buttons ─ */
a, button {
  outline: none !important;
}
a:focus-visible, button:focus-visible {
  outline: 2px solid #3b82f6 !important;
  outline-offset: 2px !important;
}

.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
