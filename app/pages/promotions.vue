<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

interface Promotion {
  id: number
  title: string
  description: string
  image: string
  badge: string
  discount_text: string
  start_date: string
  end_date: string
  is_active: number
  target_category?: string
  promo_type?: string
  min_spend?: number
  created_at: string
}

const { data, pending } = await useFetch<{ promotions: Promotion[] }>('/api/promotions')
const promotions = computed(() => data.value?.promotions || [])

// ===== Countdown Timer =====
const now = ref(new Date())
let timerInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timerInterval = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

function getCountdown(endDate: string): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const end = new Date(endDate)
  // ถ้าเป็นวันที่ล้วน (ไม่มีเวลา) ให้หมดอายุตอนสิ้นวัน
  if (typeof endDate === 'string' && endDate.length === 10) {
    end.setHours(23, 59, 59, 999)
  }
  const diff = end.getTime() - now.value.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds, expired: false }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (typeof dateStr === 'string' && (dateStr.includes('T') || dateStr.length > 10)) {
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function isExpiringSoon(endDate: string) {
  const end = new Date(endDate)
  if (typeof endDate === 'string' && endDate.length === 10) {
    end.setHours(23, 59, 59, 999)
  }
  const diff = (end.getTime() - now.value.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 3
}

const badgeColor: Record<string, string> = {
  'Flash Sale': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50',
  'Buy 2 Get 1': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
  'New Collection': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
  'โปรโมชั่น': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
}

function getBadgeClass(badge: string) {
  return badgeColor[badge] || badgeColor['โปรโมชั่น']
}

const vipTiers = [
  {
    name: 'Bronze',
    icon: 'lucide:medal',
    spent: '฿0+',
    multiplier: '1 แต้ม/฿100',
    discount: 'ไม่มีส่วนลด',
    iconBg: 'bg-amber-100 dark:bg-[#3d200e] text-amber-700 dark:text-[#f59e0b] border border-amber-300/60 dark:border-[#78350f]/60',
    spentBadge: 'bg-amber-100/80 dark:bg-[#2d180a] text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-[#78350f]/40',
    cardBorder: 'hover:border-amber-400/60 dark:hover:border-amber-700/60',
    accentColor: 'text-amber-600 dark:text-amber-400'
  },
  {
    name: 'Silver',
    icon: 'lucide:medal',
    spent: '฿1,000+',
    multiplier: '2 แต้ม/฿100',
    discount: 'ส่วนลด 5%',
    iconBg: 'bg-slate-200 dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
    spentBadge: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700/60',
    cardBorder: 'hover:border-slate-400 dark:hover:border-slate-600',
    accentColor: 'text-slate-600 dark:text-slate-300'
  },
  {
    name: 'Gold',
    icon: 'lucide:medal',
    spent: '฿5,000+',
    multiplier: '3 แต้ม/฿100',
    discount: 'ส่วนลด 10%',
    iconBg: 'bg-yellow-100 dark:bg-[#422006] text-yellow-600 dark:text-yellow-400 border border-yellow-300 dark:border-[#a16207]',
    spentBadge: 'bg-yellow-100/80 dark:bg-[#2e1605] text-yellow-800 dark:text-yellow-300 border border-yellow-300/50 dark:border-[#a16207]/40',
    cardBorder: 'hover:border-yellow-400/60 dark:hover:border-yellow-600/60',
    accentColor: 'text-yellow-600 dark:text-yellow-400'
  },
  {
    name: 'Platinum',
    icon: 'lucide:gem',
    spent: '฿15,000+',
    multiplier: '5 แต้ม/฿100',
    discount: 'ส่วนลด 15%',
    iconBg: 'bg-cyan-100 dark:bg-[#083344] text-cyan-600 dark:text-cyan-300 border border-cyan-300 dark:border-[#0e7490]',
    spentBadge: 'bg-cyan-100/80 dark:bg-[#062430] text-cyan-800 dark:text-cyan-300 border border-cyan-300/50 dark:border-[#0e7490]/40',
    cardBorder: 'hover:border-cyan-400/60 dark:hover:border-cyan-600/60',
    accentColor: 'text-cyan-600 dark:text-cyan-400'
  }
]

useHead({
  title: 'โปรโมชั่นพิเศษ & สิทธิสมาชิก | DIP & DRIP',
  meta: [{ name: 'description', content: 'โปรโมชั่น ส่วนลด และสิทธิประโยชน์สมาชิก VIP จาก DIP & DRIP' }]
})
</script>

<template>
  <div class="min-h-screen py-10 transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4">

      <!-- Page Header -->
      <div class="mb-10 text-center">
        <span class="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 text-pink-700 dark:text-pink-300 font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest border border-pink-200 dark:border-pink-800/50 mb-4">
          <Icon name="lucide:sparkles" class="w-3.5 h-3.5" />
          <span>Special Offers &amp; VIP</span>
        </span>
        <h1 class="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          โปรโมชั่น &amp; สิทธิพิเศษสมาชิก
        </h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 max-w-xl mx-auto">
          อัปเดตข้อเสนอส่วนลดล่าสุด และสิทธิประโยชน์ระดับสมาชิก VIP พร้อมระบบแต้มสะสม
        </p>
      </div>

      <!-- Membership Tiers Section -->
      <div class="mb-12 bg-white dark:bg-[#191919] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#212327] shadow-sm">
        <div class="text-center mb-6">
          <span class="bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 font-black text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider">VIP Benefits</span>
          <h2 class="text-xl font-black text-slate-800 dark:text-white mt-2 flex items-center justify-center gap-2">
            <Icon name="lucide:crown" class="w-5 h-5 text-amber-500" />
            <span>ระดับสมาชิก &amp; แต้มสะสม</span>
          </h2>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">ยิ่งช้อปมาก ยิ่งได้แต้มเยอะ แลก 100 แต้ม = ฿10 เข้ากระเป๋าเงิน</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="t in vipTiers"
            :key="t.name"
            class="bg-slate-50 dark:bg-[#1a1c20] rounded-2xl p-5 border border-slate-200 dark:border-[#212327] relative overflow-hidden transition-all duration-300"
            :class="t.cardBorder"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" :class="t.iconBg">
                <Icon :name="t.icon" class="w-5 h-5" />
              </div>
              <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full" :class="t.spentBadge">
                {{ t.spent }}
              </span>
            </div>
            <h3 class="font-black text-slate-800 dark:text-white text-base">ระดับ {{ t.name }}</h3>
            <div class="mt-3 space-y-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <p class="flex items-center justify-between">
                <span>อัตราแต้ม:</span>
                <span class="font-black" :class="t.accentColor">{{ t.multiplier }}</span>
              </p>
              <p class="flex items-center justify-between">
                <span>สิทธิประโยชน์:</span>
                <span class="text-emerald-500 font-black">{{ t.discount }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State with Skeletons -->
      <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="bg-white dark:bg-[#191919] rounded-3xl overflow-hidden border border-slate-200 dark:border-[#212327] shadow-sm flex flex-col">
          <AppSkeleton height="192px" width="100%" rounded="none" />
          <div class="p-6 space-y-4 flex-1">
            <AppSkeleton width="80px" height="20px" variant="badge" />
            <AppSkeleton width="90%" height="20px" />
            <AppSkeleton width="65%" height="14px" />
            <div class="pt-4 border-t border-slate-100 dark:border-[#212327]">
              <AppSkeleton width="120px" height="14px" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="promotions.length === 0" class="text-center py-20 bg-white dark:bg-[#191919] rounded-3xl border border-slate-200 dark:border-[#212327]">
        <div class="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Icon name="lucide:gift" class="w-8 h-8" />
        </div>
        <h3 class="text-lg font-black text-slate-800 dark:text-white">ยังไม่มีโปรโมชั่นในขณะนี้</h3>
        <p class="text-xs text-slate-400 mt-1">โปรดติดตามอัปเดตโปรโมชั่นใหม่ๆ ได้ที่นี่เร็วๆ นี้</p>
      </div>

      <!-- Promotions Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="promo in promotions"
          :key="promo.id"
          class="bg-white dark:bg-[#191919] rounded-3xl overflow-hidden border border-slate-200 dark:border-[#212327] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
        >
          <!-- Image -->
          <div class="relative h-48 bg-slate-100 dark:bg-[#191919] overflow-hidden">
            <img
              v-if="promo.image"
              :src="promo.image"
              :alt="promo.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
              <Icon name="lucide:gift" class="w-10 h-10" />
            </div>

            <!-- Discount badge overlay -->
            <div v-if="promo.discount_text" class="absolute top-3 right-3 bg-gradient-to-br from-pink-500 to-rose-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-pink-500/30">
              {{ promo.discount_text }}
            </div>

            <!-- Expiring soon ribbon -->
            <div v-if="isExpiringSoon(promo.end_date)" class="absolute top-3 left-3 bg-amber-400 text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-lg animate-pulse flex items-center gap-1">
              <Icon name="lucide:zap" class="w-3 h-3" />
              <span>ใกล้หมดแล้ว!</span>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6 flex flex-col flex-1">
            <!-- Badges -->
            <div class="flex flex-wrap items-center gap-1.5 mb-3">
              <span :class="['text-[10px] font-black px-3 py-1 rounded-full border inline-block uppercase tracking-widest', getBadgeClass(promo.badge)]">
                {{ promo.badge }}
              </span>
              
              <!-- Shipping vs Product Promo Badge -->
              <span v-if="promo.promo_type === 'shipping'" class="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Icon name="lucide:truck" class="w-3 h-3" />
                <span>ลดค่าจัดส่ง</span>
              </span>
              <span v-else-if="promo.target_category && promo.target_category !== 'ALL'" class="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Icon name="lucide:tag" class="w-3 h-3" />
                <span>เฉพาะหมวด {{ promo.target_category }}</span>
              </span>
              <span v-else class="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#191919] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#212327] flex items-center gap-1">
                <Icon name="lucide:globe" class="w-3 h-3" />
                <span>ทุกหมวดหมู่</span>
              </span>
            </div>

            <!-- Title -->
            <h2 class="text-slate-900 dark:text-white font-black text-base leading-snug mb-2 line-clamp-2">
              {{ promo.title }}
            </h2>

            <!-- Description -->
            <p class="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-3 mb-3 flex-1">
              {{ promo.description }}
            </p>

            <!-- Min spend note if any -->
            <div v-if="promo.min_spend && promo.min_spend > 0" class="mb-3 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-xl border border-amber-200/60 dark:border-amber-900/40 inline-flex items-center gap-1 w-fit">
              <Icon name="lucide:credit-card" class="w-3.5 h-3.5" />
              <span>ขั้นต่ำ ฿{{ promo.min_spend }}</span>
            </div>

            <!-- Date range + Countdown -->
            <div class="pt-4 border-t border-slate-200 dark:border-[#212327] space-y-3">
              <!-- Date range -->
              <div class="flex items-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                <Icon name="lucide:calendar" class="w-3.5 h-3.5" />
                <span>{{ formatDate(promo.start_date) }} – {{ formatDate(promo.end_date) }}</span>
              </div>
              <!-- Countdown Timer -->
              <ClientOnly>
                <div v-if="promo.end_date" class="">
                  <template v-if="getCountdown(promo.end_date).expired">
                    <span class="inline-flex items-center gap-1 text-[10px] font-black text-slate-400 dark:text-slate-600">
                      <Icon name="lucide:clock" class="w-3 h-3" />
                      หมดอายุแล้ว
                    </span>
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-1.5">
                      <Icon name="lucide:timer" class="w-3 h-3 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                      <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-1">หมดใน</span>
                      <div class="flex items-center gap-1">
                        <template v-if="getCountdown(promo.end_date).days > 0">
                          <span class="inline-flex flex-col items-center">
                            <span class="font-black text-[11px] text-slate-800 dark:text-white leading-none">{{ getCountdown(promo.end_date).days }}</span>
                            <span class="text-[8px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5">วัน</span>
                          </span>
                          <span class="text-slate-300 dark:text-slate-700 font-bold text-xs">:</span>
                        </template>
                        <span class="inline-flex flex-col items-center">
                          <span class="font-black text-[11px] tabular-nums" :class="isExpiringSoon(promo.end_date) ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-white'">{{ pad(getCountdown(promo.end_date).hours) }}</span>
                          <span class="text-[8px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5">ชม.</span>
                        </span>
                        <span class="text-slate-300 dark:text-slate-700 font-bold text-xs">:</span>
                        <span class="inline-flex flex-col items-center">
                          <span class="font-black text-[11px] tabular-nums" :class="isExpiringSoon(promo.end_date) ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-white'">{{ pad(getCountdown(promo.end_date).minutes) }}</span>
                          <span class="text-[8px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5">นาที</span>
                        </span>
                        <span class="text-slate-300 dark:text-slate-700 font-bold text-xs">:</span>
                        <span class="inline-flex flex-col items-center">
                          <span class="font-black text-[11px] tabular-nums" :class="isExpiringSoon(promo.end_date) ? 'text-rose-500 dark:text-rose-400 animate-pulse' : 'text-slate-800 dark:text-white'">{{ pad(getCountdown(promo.end_date).seconds) }}</span>
                          <span class="text-[8px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5">วิ</span>
                        </span>
                      </div>
                    </div>
                  </template>
                </div>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA bottom -->
      <div class="mt-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 rounded-3xl p-8 md:p-10 text-center text-white relative overflow-hidden border border-blue-500/20 dark:border-[#212327] shadow-xl">
        <div class="relative z-10 space-y-4 max-w-xl mx-auto">
          <p class="text-2xl md:text-3xl font-black tracking-tight flex items-center justify-center gap-2">
            <Icon name="lucide:gem" class="w-7 h-7 text-amber-300" />
            <span>สิทธิพิเศษสมาชิก VIP</span>
          </p>
          <p class="text-xs md:text-sm text-blue-100 dark:text-slate-300 font-medium leading-relaxed">
            สะสมยอดช้อปเพื่ออัปเลเวล รับแต้มทวีคูณ และแลกเงินเข้ากระเป๋าได้ทันที!
          </p>
          <div class="pt-2">
            <NuxtLink
              v-if="authStore.isLoggedIn"
              to="/profile"
              class="inline-flex items-center gap-2 bg-white text-blue-700 dark:bg-blue-600 dark:text-white font-black text-xs md:text-sm px-8 py-3.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-700 transition duration-200 shadow-lg shadow-black/10 active:scale-95"
            >
              <Icon name="lucide:crown" class="w-4 h-4" />
              <span>ดูระดับสมาชิก &amp; แต้มสะสมของคุณ</span>
              <Icon name="lucide:arrow-right" class="w-4 h-4" />
            </NuxtLink>
            <NuxtLink
              v-else
              to="/register"
              class="inline-flex items-center gap-2 bg-white text-blue-700 dark:bg-blue-600 dark:text-white font-black text-xs md:text-sm px-8 py-3.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-700 transition duration-200 shadow-lg shadow-black/10 active:scale-95"
            >
              <Icon name="lucide:user-plus" class="w-4 h-4" />
              <span>สมัครสมาชิกฟรี</span>
              <Icon name="lucide:arrow-right" class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
