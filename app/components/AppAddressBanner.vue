<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const dismissed = ref(false)
</script>

<template>
  <div
    v-if="authStore.isLoggedIn && !authStore.hasCompletedAddress && !dismissed && route.path !== '/profile'"
    class="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xs py-2.5 px-4 shadow-md transition-all duration-300 relative z-30"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 font-bold min-w-0">
        <Icon name="lucide:map-pin" class="w-4 h-4 flex-shrink-0 text-white animate-bounce" />
        <p class="truncate text-[11px] sm:text-xs">
          <span class="font-black bg-white/20 px-2 py-0.5 rounded-md mr-1">สมาชิกใหม่</span> คุณยังไม่ได้ระบุที่อยู่จัดส่งสินค้า แนะนำให้กรอกที่อยู่ให้ครบถ้วนเพื่อความสะดวกรวดเร็วในการสั่งซื้อ
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <NuxtLink
          to="/profile"
          class="bg-white text-slate-900 hover:bg-slate-100 font-black text-[11px] px-3.5 py-1.5 rounded-xl shadow transition flex items-center gap-1.5 whitespace-nowrap"
        >
          <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
          <span>ไปกรอกที่อยู่</span>
        </NuxtLink>
        <button
          @click="dismissed = true"
          class="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          title="ปิดการแจ้งเตือนนี้"
        >
          <Icon name="lucide:x" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
