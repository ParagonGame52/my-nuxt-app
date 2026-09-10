<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

const authStore = useAuthStore()
const cartStore = useCartStore()
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F6F6F2]/90 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-[#212327] px-2 py-1.5 flex justify-around items-center shadow-lg transition-colors">
    <!-- Home -->
    <NuxtLink
      to="/"
      class="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition text-slate-500 dark:text-slate-400"
      active-class="!text-blue-600 dark:!text-blue-400 font-black scale-105"
    >
      <Icon name="lucide:home" class="w-5 h-5" />
      <span class="text-[10px] mt-0.5 font-bold">หน้าแรก</span>
    </NuxtLink>

    <!-- Products -->
    <NuxtLink
      to="/products"
      class="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition text-slate-500 dark:text-slate-400"
      active-class="!text-blue-600 dark:!text-blue-400 font-black scale-105"
    >
      <Icon name="lucide:shirt" class="w-5 h-5" />
      <span class="text-[10px] mt-0.5 font-bold">สินค้า</span>
    </NuxtLink>

    <!-- Gacha Center Highlight -->
    <NuxtLink
      to="/gacha"
      class="flex flex-col items-center justify-center -mt-4 group"
    >
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-active:scale-95 transition-transform border-2 border-white dark:border-slate-950">
        <Icon name="lucide:dices" class="w-6 h-6" />
      </div>
      <span class="text-[10px] mt-0.5 font-black text-amber-600 dark:text-amber-400">สุ่มชุด</span>
    </NuxtLink>

    <!-- Cart with Badge -->
    <NuxtLink
      to="/cart"
      class="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition text-slate-500 dark:text-slate-400 relative"
      active-class="!text-blue-600 dark:!text-blue-400 font-black scale-105"
    >
      <div class="relative">
        <Icon name="lucide:shopping-bag" class="w-5 h-5" />
        <span v-if="cartStore.totalItems > 0" class="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-pink-500 rounded-full flex items-center justify-center text-[8px] font-black text-white border border-white dark:border-slate-950 animate-pulse">
          {{ cartStore.totalItems }}
        </span>
      </div>
      <span class="text-[10px] mt-0.5 font-bold">ตะกร้า</span>
    </NuxtLink>

    <!-- Profile / Account -->
    <NuxtLink
      :to="authStore.isLoggedIn ? '/profile' : '/login'"
      class="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition text-slate-500 dark:text-slate-400"
      active-class="!text-blue-600 dark:!text-blue-400 font-black scale-105"
    >
      <Icon name="lucide:user" class="w-5 h-5" />
      <span class="text-[10px] mt-0.5 font-bold">{{ authStore.isLoggedIn ? 'โปรไฟล์' : 'เข้าสู่ระบบ' }}</span>
    </NuxtLink>
  </nav>
</template>
