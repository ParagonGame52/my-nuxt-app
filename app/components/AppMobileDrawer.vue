<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'toggle-theme'): void
  (e: 'open-topup'): void
  (e: 'logout'): void
}>()

const authStore = useAuthStore()
const cartStore = useCartStore()
const colorMode = useColorMode()

function close() {
  emit('update:modelValue', false)
}

function handleTopup() {
  close()
  emit('open-topup')
}

function handleLogout() {
  close()
  emit('logout')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 md:hidden flex justify-end"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="close"
        />

        <!-- Drawer Panel -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div
            v-if="modelValue"
            class="relative w-4/5 max-w-sm h-full bg-white dark:bg-[#0a0a0a] shadow-2xl border-l border-slate-200 dark:border-[#212327] flex flex-col justify-between overflow-y-auto"
          >
            <!-- Drawer Header -->
            <div class="p-5 border-b border-slate-200 dark:border-[#212327] flex items-center justify-between">
              <NuxtLink to="/" @click="close" class="text-base font-black flex items-center gap-2">
                <span class="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs">D</span>
                <span>DIP &amp; <span class="text-blue-600 dark:text-blue-400">DRIP</span></span>
              </NuxtLink>
              <button
                @click="close"
                class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#191919] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>

            <!-- User Info Card or Login CTA in Drawer -->
            <div class="p-4 border-b border-slate-200 dark:border-[#212327] bg-slate-50/70 dark:bg-[#0a0a0a]">
              <template v-if="authStore.isLoggedIn">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-md">
                    <img v-if="(authStore.user as any)?.avatar" :src="(authStore.user as any).avatar" class="w-full h-full object-cover" />
                    <span v-else>{{ authStore.user?.name?.charAt(0)?.toUpperCase() }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-black text-slate-800 dark:text-white truncate">{{ authStore.user?.name }}</p>
                      <span v-if="authStore.isAdmin" class="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">Admin</span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ authStore.user?.email }}</p>
                  </div>
                </div>
                <!-- Balance & Top-up bar -->
                <div class="mt-3 bg-white dark:bg-[#191919] p-2.5 rounded-2xl border border-slate-200/80 dark:border-[#212327] flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-slate-400 block font-bold">ยอดเงินคงเหลือ</span>
                    <span class="text-sm font-black text-blue-600 dark:text-blue-400">฿{{ authStore.balance.toLocaleString() }}</span>
                  </div>
                  <button
                    @click="handleTopup"
                    class="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/30 cursor-pointer"
                  >
                    <Icon name="lucide:wallet" class="w-3.5 h-3.5" />
                    <span>เติมเงิน</span>
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="text-center py-2 space-y-2">
                  <p class="text-xs font-bold text-slate-600 dark:text-slate-300">เข้าสู่ระบบเพื่อสุ่มชุดและช้อปปิ้ง</p>
                  <div class="grid grid-cols-2 gap-2">
                    <NuxtLink
                      to="/login"
                      @click="close"
                      class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-2.5 rounded-xl transition text-center shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
                    >
                      <Icon name="lucide:log-in" class="w-3.5 h-3.5" />
                      <span>เข้าสู่ระบบ</span>
                    </NuxtLink>
                    <NuxtLink
                      to="/register"
                      @click="close"
                      class="bg-slate-200 dark:bg-[#191919] text-slate-800 dark:text-white text-xs font-black py-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5"
                    >
                      <Icon name="lucide:user-plus" class="w-3.5 h-3.5" />
                      <span>สมัครสมาชิก</span>
                    </NuxtLink>
                  </div>
                </div>
              </template>
            </div>

            <!-- Drawer Navigation Links -->
            <div class="p-4 space-y-1 flex-1 overflow-y-auto">
              <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">เมนูหลัก</p>
              
              <NuxtLink
                to="/"
                @click="close"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-[#212327] transition"
                active-class="!bg-blue-600 !text-white font-black"
              >
                <Icon name="lucide:home" class="w-4 h-4" />
                <span>หน้าหลัก</span>
              </NuxtLink>

              <NuxtLink
                to="/products"
                @click="close"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-[#212327] transition"
                active-class="!bg-blue-600 !text-white font-black"
              >
                <Icon name="lucide:shirt" class="w-4 h-4" />
                <span>รายการชุดทั้งหมด</span>
              </NuxtLink>

              <NuxtLink
                to="/promotions"
                @click="close"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition"
                active-class="!bg-pink-600 !text-white font-black"
              >
                <Icon name="lucide:tag" class="w-4 h-4" />
                <span>โปรโมชั่น</span>
              </NuxtLink>

              <NuxtLink
                to="/gacha"
                @click="close"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-[#212327] transition"
                active-class="!bg-blue-600 !text-white font-black"
              >
                <Icon name="lucide:dices" class="w-4 h-4 text-yellow-500" />
                <span>สุ่มชุดสุดคุ้ม</span>
              </NuxtLink>

              <NuxtLink
                to="/cart"
                @click="close"
                class="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-[#212327] transition"
                active-class="!bg-blue-600 !text-white font-black"
              >
                <div class="flex items-center space-x-3">
                  <Icon name="lucide:shopping-cart" class="w-4 h-4" />
                  <span>ตะกร้าสินค้า</span>
                </div>
                <span v-if="cartStore.totalItems > 0" class="bg-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {{ cartStore.totalItems }}
                </span>
              </NuxtLink>

              <NuxtLink
                to="/history"
                @click="close"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-[#212327] transition"
                active-class="!bg-blue-600 !text-white font-black"
              >
                <Icon name="lucide:package" class="w-4 h-4" />
                <span>ประวัติการสั่งซื้อ</span>
              </NuxtLink>

              <NuxtLink
                to="/support"
                @click="close"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-[#212327] transition"
                active-class="!bg-blue-600 !text-white font-black"
              >
                <Icon name="lucide:message-circle" class="w-4 h-4 text-orange-500" />
                <span>แจ้งปัญหา &amp; ติดต่อ</span>
              </NuxtLink>

              <NuxtLink
                to="/about"
                @click="close"
                class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-[#212327] transition"
                active-class="!bg-blue-600 !text-white font-black"
              >
                <Icon name="lucide:info" class="w-4 h-4" />
                <span>เกี่ยวกับเรา</span>
              </NuxtLink>

              <template v-if="authStore.isLoggedIn">
                <div class="pt-3 mt-3 border-t border-slate-200 dark:border-[#212327]">
                  <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">บัญชีของฉัน</p>

                  <NuxtLink
                    to="/profile"
                    @click="close"
                    class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#212327] transition"
                    active-class="!bg-blue-600 !text-white font-black"
                  >
                    <Icon name="lucide:user" class="w-4 h-4" />
                    <span>โปรไฟล์ของฉัน</span>
                  </NuxtLink>

                  <NuxtLink
                    v-if="authStore.isAdmin"
                    to="/admin"
                    @click="close"
                    class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition"
                  >
                    <Icon name="lucide:shield-check" class="w-4 h-4 text-indigo-500" />
                    <span>จัดการระบบหลังบ้าน</span>
                  </NuxtLink>
                </div>
              </template>
            </div>

            <!-- Drawer Footer Controls -->
            <div class="p-4 border-t border-slate-200 dark:border-[#212327] bg-slate-50/50 dark:bg-[#0a0a0a] space-y-2">
              <ClientOnly>
                <button
                  @click="emit('toggle-theme')"
                  class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <div class="flex items-center gap-2">
                    <Icon v-if="colorMode.value === 'dark'" name="lucide:sun" class="w-4 h-4 text-yellow-400" />
                    <Icon v-else name="lucide:moon" class="w-4 h-4 text-slate-700" />
                    <span>{{ colorMode.value === 'dark' ? 'โหมดสว่าง (Light)' : 'โหมดมืด (Dark)' }}</span>
                  </div>
                  <Icon name="lucide:arrow-right" class="w-3 h-3 text-slate-400" />
                </button>
              </ClientOnly>

              <template v-if="authStore.isLoggedIn">
                <button
                  @click="handleLogout"
                  class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-black transition active:scale-98 cursor-pointer"
                >
                  <Icon name="lucide:log-out" class="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </button>
              </template>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
