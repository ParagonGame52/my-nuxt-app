<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

const emit = defineEmits<{
  (e: 'toggle-theme'): void
  (e: 'open-topup'): void
  (e: 'toggle-mobile-menu'): void
  (e: 'logout'): void
}>()

const authStore = useAuthStore()
const cartStore = useCartStore()
const colorMode = useColorMode()
const route = useRoute()

const showUserMenu = ref(false)

// Close user menu when route changes
watch(() => route.path, () => {
  showUserMenu.value = false
})

function onBodyClick(e: any) {
  if (e.target && typeof e.target.closest === 'function') {
    if (!e.target.closest('#user-menu-wrapper')) {
      showUserMenu.value = false
    }
  }
}
onMounted(() => document.addEventListener('click', onBodyClick))
onUnmounted(() => document.removeEventListener('click', onBodyClick))

function handleLogout() {
  showUserMenu.value = false
  emit('logout')
}

function handleTopup() {
  showUserMenu.value = false
  emit('open-topup')
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-[#F6F6F2]/90 dark:bg-[#0a0a0a]/90 border-b border-slate-200 dark:border-[#212327] backdrop-blur-md text-slate-800 dark:text-slate-100 transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      
      <!-- Logo -->
      <NuxtLink to="/" class="text-lg md:text-xl font-black tracking-tighter hover:opacity-85 transition duration-200 flex items-center gap-1.5 outline-none focus:outline-none">
        <span class="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-md shadow-blue-600/30">D</span>
        <span>DIP &amp; <span class="text-blue-600 dark:text-blue-400">DRIP</span></span>
      </NuxtLink>
      
      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center space-x-5 text-xs font-black tracking-wide">
        <NuxtLink to="/" class="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition outline-none focus:outline-none flex items-center gap-1.5" active-class="text-blue-600 dark:text-blue-400 font-black">
          <Icon name="lucide:home" class="w-3.5 h-3.5" />
          <span>หน้าหลัก</span>
        </NuxtLink>
        <NuxtLink to="/products" class="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition outline-none focus:outline-none flex items-center gap-1.5" active-class="text-blue-600 dark:text-blue-400 font-black">
          <Icon name="lucide:shirt" class="w-3.5 h-3.5" />
          <span>รายการชุดทั้งหมด</span>
        </NuxtLink>
        <NuxtLink to="/promotions" class="text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 transition outline-none focus:outline-none flex items-center gap-1.5" active-class="text-pink-600 dark:text-pink-400 font-black">
          <Icon name="lucide:gift" class="w-3.5 h-3.5 text-pink-500" />
          <span>โปรโมชั่น</span>
        </NuxtLink>
        <NuxtLink to="/gacha" class="text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition outline-none focus:outline-none flex items-center gap-1.5" active-class="text-amber-600 dark:text-amber-400 font-black">
          <Icon name="lucide:dices" class="w-3.5 h-3.5 text-amber-500" />
          <span>สุ่มชุดสุดคุ้ม</span>
        </NuxtLink>
        <NuxtLink to="/history" class="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition outline-none focus:outline-none flex items-center gap-1.5" active-class="text-blue-600 dark:text-blue-400 font-black">
          <Icon name="lucide:package" class="w-3.5 h-3.5" />
          <span>ประวัติการสั่งซื้อ</span>
        </NuxtLink>
        <NuxtLink to="/support" class="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition outline-none focus:outline-none flex items-center gap-1.5" active-class="text-orange-600 dark:text-orange-400 font-black">
          <Icon name="lucide:message-circle" class="w-3.5 h-3.5 text-orange-500" />
          <span>แจ้งปัญหา</span>
        </NuxtLink>
        <NuxtLink to="/about" class="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition outline-none focus:outline-none flex items-center gap-1.5" active-class="text-blue-600 dark:text-blue-400 font-black">
          <Icon name="lucide:info" class="w-3.5 h-3.5" />
          <span>เกี่ยวกับเรา</span>
        </NuxtLink>
      </nav>

      <!-- Action buttons -->
      <div class="flex items-center space-x-2 sm:space-x-3">
        
        <!-- Theme Switcher -->
        <ClientOnly>
          <button 
            @click="emit('toggle-theme')" 
            class="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center border border-slate-200/80 dark:border-[#212327] bg-slate-100/50 dark:bg-[#191919] hover:bg-slate-100 dark:hover:bg-[#212327] transition-all duration-200 cursor-pointer"
            title="สลับโหมดธีม"
            aria-label="Toggle theme"
          >
            <Icon v-if="colorMode.value === 'dark'" name="lucide:sun" class="w-4 h-4 md:w-[18px] md:h-[18px] text-yellow-400 animate-spin-slow" />
            <Icon v-else name="lucide:moon" class="w-4 h-4 md:w-[18px] md:h-[18px] text-slate-700" />
          </button>
          <template #fallback>
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-slate-200/80 dark:border-[#212327] bg-slate-100/50 dark:bg-[#191919]" />
          </template>
        </ClientOnly>
        
        <!-- Cart Button -->
        <NuxtLink to="/cart" class="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center border border-slate-200/80 dark:border-[#212327] bg-slate-100/50 dark:bg-[#191919] hover:bg-slate-100 dark:hover:bg-[#212327] text-slate-700 dark:text-slate-300 transition duration-200 relative" title="ตะกร้าสินค้า">
          <Icon name="lucide:shopping-bag" class="w-4 h-4 md:w-[18px] md:h-[18px]" />
          <span v-if="cartStore.totalItems > 0" class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-pink-500 rounded-full flex items-center justify-center text-[9px] font-black text-white border border-white dark:border-slate-950 animate-pulse">
            {{ cartStore.totalItems }}
          </span>
        </NuxtLink>

        <!-- Auth: Not logged in (Desktop) -->
        <template v-if="!authStore.isLoggedIn">
          <NuxtLink
            to="/login"
            class="hidden md:flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition duration-200 shadow-md shadow-blue-600/20"
          >
            <Icon name="lucide:log-in" class="w-3.5 h-3.5" />
            <span>เข้าสู่ระบบ</span>
          </NuxtLink>
        </template>

        <!-- Auth: Logged in (Desktop Dropdown) -->
        <template v-else>
          <div id="user-menu-wrapper" class="relative hidden md:block">
            <button
              @click.stop="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 bg-slate-100/80 dark:bg-[#191919] border border-slate-200 dark:border-[#212327] hover:border-blue-400 dark:hover:border-blue-600 px-3 py-2 rounded-xl transition duration-200 cursor-pointer"
            >
              <div class="w-6 h-6 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                <img v-if="(authStore.user as any)?.avatar" :src="(authStore.user as any).avatar" class="w-full h-full object-cover" />
                <span v-else>{{ authStore.user?.name?.charAt(0)?.toUpperCase() }}</span>
              </div>
              <span class="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[80px] truncate">
                {{ authStore.user?.name }}
              </span>
              <Icon name="lucide:chevron-down" class="w-3.5 h-3.5 text-slate-400" />
            </button>

            <!-- Dropdown -->
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 scale-95 translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="showUserMenu"
                class="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl shadow-xl py-2 z-50"
              >
                <!-- User info -->
                <div class="px-4 py-3 border-b border-slate-200 dark:border-[#212327]">
                  <p class="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{{ authStore.user?.name }}</p>
                  <p class="text-[10px] text-slate-500 mt-1">
                    ยอดเงินคงเหลือ: <span class="text-blue-600 dark:text-blue-400 font-black">฿{{ authStore.balance.toLocaleString() }}</span>
                  </p>
                </div>

                <!-- Menu items -->
                <NuxtLink
                  v-if="authStore.isAdmin"
                  to="/admin"
                  @click="showUserMenu = false"
                  class="flex items-center space-x-3 px-4 py-2.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-[#212327] transition"
                >
                  <Icon name="lucide:shield-check" class="w-4 h-4 text-indigo-500" />
                  <span>จัดการระบบหลังบ้าน</span>
                </NuxtLink>

                <NuxtLink
                  to="/products"
                  @click="showUserMenu = false"
                  class="flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition"
                >
                  <Icon name="lucide:shirt" class="w-4 h-4 text-blue-500" />
                  <span>รายการชุด / สินค้าทั้งหมด</span>
                </NuxtLink>

                <NuxtLink
                  to="/profile"
                  @click="showUserMenu = false"
                  class="flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#212327] transition"
                >
                  <Icon name="lucide:user" class="w-4 h-4" />
                  <span>โปรไฟล์ของฉัน</span>
                </NuxtLink>

                <NuxtLink
                  to="/history"
                  @click="showUserMenu = false"
                  class="flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#212327] transition"
                >
                  <Icon name="lucide:package" class="w-4 h-4" />
                  <span>ประวัติการสั่งซื้อ</span>
                </NuxtLink>

                <NuxtLink
                  to="/cart"
                  @click="showUserMenu = false"
                  class="flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#212327] transition"
                >
                  <Icon name="lucide:shopping-cart" class="w-4 h-4" />
                  <span>ตะกร้าสินค้า</span>
                </NuxtLink>

                <NuxtLink
                  to="/promotions"
                  @click="showUserMenu = false"
                  class="flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition"
                >
                  <Icon name="lucide:tag" class="w-4 h-4" />
                  <span>โปรโมชั่น</span>
                </NuxtLink>

                <NuxtLink
                  to="/support"
                  @click="showUserMenu = false"
                  class="flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition"
                >
                  <Icon name="lucide:message-circle" class="w-4 h-4" />
                  <span>แจ้งปัญหา</span>
                </NuxtLink>

                <!-- Top-up trigger -->
                <button
                  @click="handleTopup"
                  class="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition cursor-pointer"
                >
                  <Icon name="lucide:wallet" class="w-4 h-4 text-emerald-500" />
                  <span>เติมเงิน</span>
                </button>

                <div class="border-t border-slate-200 dark:border-[#212327] mt-2 pt-2">
                  <button
                    @click="handleLogout"
                    class="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  >
                    <Icon name="lucide:log-out" class="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </template>

        <!-- Mobile Hamburger Button -->
        <button
          @click="emit('toggle-mobile-menu')"
          class="md:hidden w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200/80 dark:border-[#212327] bg-slate-100/50 dark:bg-[#191919] hover:bg-slate-100 dark:hover:bg-[#212327] text-slate-700 dark:text-slate-200 transition cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Icon name="lucide:menu" class="w-5 h-5" />
        </button>

      </div>
    </div>
  </header>
</template>
