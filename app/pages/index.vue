<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

const { data: statsData, refresh: refreshStats } = await useFetch<any>('/api/stats')
const { data: promoData, refresh: refreshPromos } = await useFetch<{ promotions: any[] }>('/api/promotions')
const { data: activitiesData, refresh: refreshActivities } = await useFetch<{ activities: any[] }>('/api/activities')

let statsTimer: ReturnType<typeof setInterval> | null = null

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return 'เมื่อสักครู่'
  const now = new Date().getTime()
  const d = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - d) / 1000)

  if (diffSec < 45) return 'เมื่อสักครู่'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} วันที่แล้ว`
}

onMounted(() => {
  // Real-time polling every 4 seconds for live stats & activities
  statsTimer = setInterval(() => {
    refreshStats()
    refreshPromos()
    refreshActivities()
  }, 4000)
})

onUnmounted(() => {
  if (statsTimer) clearInterval(statsTimer)
})

const activities = computed(() => {
  return (activitiesData.value?.activities || []).slice(0, 3)
})

const stats = computed(() => {
  const totalGacha = statsData.value?.totalGacha ?? 0
  const totalUsers = statsData.value?.totalUsers ?? 0
  const avgRating = statsData.value?.avgRating ?? 5.0
  const totalReviews = statsData.value?.totalReviews ?? 0

  return [
    { value: `${totalGacha.toLocaleString()}`, label: 'กล่องสุ่มที่ถูกเปิดแล้ว', icon: 'lucide:dice-5' },
    { value: `${totalUsers.toLocaleString()}`, label: 'สมาชิกผู้ใช้งาน', icon: 'lucide:users' },
    { value: '100%', label: 'การันตีได้รับของแท้ทุกชิ้น', icon: 'lucide:shield-check' },
    { 
      value: `${avgRating} / 5`, 
      label: totalReviews > 0 ? `คะแนนรีวิวจากลูกค้า (${totalReviews} รีวิว)` : 'คะแนนรีวิวจากลูกค้า',
      icon: 'lucide:star'
    }
  ]
})

const latestPromos = computed(() => (promoData.value?.promotions || []).slice(0, 3))

const badgeColor: Record<string, string> = {
  'Flash Sale': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  'Buy 2 Get 1': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'New Collection': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  'โปรโมชั่น': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
}
function getBadgeClass(badge: string) {
  return badgeColor[badge] || badgeColor['โปรโมชั่น']
}
</script>


<template>
  <div class="max-w-7xl mx-auto px-4 py-10 space-y-10 transition-colors duration-300">
    
    <!-- Hero section and recent activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Premium Hero banner -->
      <div class="lg:col-span-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-850 dark:from-[#191919] dark:via-[#151515] dark:to-[#191919] rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-xl border border-blue-500/10 dark:border-[#212327]">
        
        <!-- Ambient background glow in dark mode -->
        <div class="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="space-y-5 md:max-w-md z-10">
          <span class="bg-white/15 dark:bg-blue-500/20 text-blue-100 dark:text-blue-300 text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-white/10 dark:border-blue-500/10">
            <Icon name="lucide:sparkles" class="w-4 h-4 inline-block align-middle" /> New Arrival &amp; Lucky Box
          </span>
          <h1 class="text-3xl md:text-5xl font-black leading-tight tracking-tight">
            ยกระดับสตรีทแฟชั่น<br><span class="text-yellow-300 drop-shadow-sm">สุ่มชุดสุดคุ้ม 99.-</span>
          </h1>
          <p class="text-indigo-100/90 dark:text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
            คัดสรรเสื้อผ้านำเข้าสไตล์เกรดพรีเมียม การันตีความคุ้มค่าทุกกล่องสุ่ม ลุ้นแจ็คพอตใหญ่แบรนด์ดัง จัดส่งด่วนถึงบ้านใน 24 ชั่วโมง
          </p>
          <div class="flex flex-wrap gap-3.5 pt-3">
            <NuxtLink to="/gacha" class="bg-yellow-400 hover:bg-yellow-500 active:scale-[0.98] text-slate-950 font-black px-7 py-3.5 rounded-2xl text-xs md:text-sm transition duration-200 shadow-lg shadow-yellow-500/20 flex items-center gap-2">
              <Icon name="lucide:dice-5" class="w-4 h-4" />
              <span>สุ่มชุดนำโชคเลย</span>
            </NuxtLink>
            <NuxtLink to="/products" class="bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-bold px-7 py-3.5 rounded-2xl text-xs md:text-sm transition duration-200 backdrop-blur-md border border-white/15 flex items-center gap-2">
              <Icon name="lucide:shirt" class="w-4 h-4" />
              <span>ดูชุดทั้งหมด</span>
            </NuxtLink>
          </div>
        </div>
        
        <!-- Hero Image -->
        <div class="mt-8 md:mt-0 relative w-full md:w-64 aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10 dark:border-[#212327]">
          <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80" class="w-full h-full object-cover" alt="Fashion collection">
        </div>
      </div>

      <!-- Recent activity feed -->
      <div class="bg-white dark:bg-[#191919] border border-slate-300 dark:border-[#212327] rounded-3xl p-6 shadow-sm dark:shadow-2xl/20 space-y-5 transition-all duration-300">
        <div class="flex items-center justify-between">
          <h3 class="text-slate-800 dark:text-slate-200 font-black text-sm flex items-center space-x-2">
            <Icon name="lucide:sparkles" class="w-4 h-4 text-amber-500" />
            <span class="tracking-wide">กิจกรรมล่าสุดจากผู้ใช้งาน</span>
          </h3>
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>

        <div v-if="activities.length === 0" class="py-10 text-center space-y-2">
          <div class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#1a1c20] flex items-center justify-center mx-auto text-slate-400">
            <Icon name="lucide:sparkles" class="w-5 h-5 text-amber-500/80" />
          </div>
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">ยังไม่มีกิจกรรมล่าสุด</p>
          <p class="text-[10px] text-slate-400 dark:text-slate-500">กิจกรรมการสุ่มและสั่งซื้อจริงจะแสดงที่นี่</p>
        </div>

        <div v-else class="space-y-3.5">
          <div v-for="act in activities" :key="act.id" class="flex items-center space-x-4 p-3 rounded-2xl bg-slate-50/70 dark:bg-[#0a0a0a] hover:bg-slate-100 dark:hover:bg-[#1a1c20] transition duration-200 border border-slate-200/80 dark:border-[#212327]">
            <div class="w-11 h-11 bg-slate-200 dark:bg-[#1a1c20] rounded-xl overflow-hidden flex-shrink-0 border border-slate-300 dark:border-[#212327] flex items-center justify-center">
              <img v-if="act.img" :src="act.img" class="w-full h-full object-cover animate-fade-in" :alt="act.text">
              <Icon v-else :name="act.isGacha ? 'lucide:sparkles' : 'lucide:shirt'" class="w-5 h-5 text-pink-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded">{{ act.userName }}</span>
              </div>
              <p class="text-slate-700 dark:text-slate-300 text-xs font-bold truncate leading-tight mt-0.5">{{ act.text }}</p>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-1 flex items-center gap-1">
                <Icon name="lucide:clock" class="w-3 h-3" />
                <span>{{ act.time || formatRelativeTime(act.created_at) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats summary bar -->
    <div class="bg-white dark:bg-[#191919] border border-slate-300 dark:border-[#212327] rounded-3xl p-7 shadow-sm dark:shadow-2xl/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center transition-all duration-300">
      <div v-for="(stat, idx) in stats" :key="idx" class="space-y-1.5 border-r border-slate-200 dark:border-[#212327] last:border-none">
        <div class="flex items-center justify-center gap-1.5">
          <Icon :name="stat.icon" class="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <p class="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">{{ stat.value }}</p>
        </div>
        <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Promotions Section -->
    <div v-if="latestPromos.length > 0" class="space-y-5">
      <!-- Section header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-base shadow-md shadow-pink-500/20">
            <Icon name="lucide:gift" class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-slate-900 dark:text-white font-black text-base tracking-tight">โปรโมชั่น &amp; ประกาศล่าสุด</h2>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">ข้อเสนอพิเศษสำหรับคุณ</p>
          </div>
        </div>
        <NuxtLink
          to="/promotions"
          class="text-xs font-black text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition flex items-center space-x-1"
        >
          <span>ดูทั้งหมด</span>
          <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>

      <!-- Promo cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <NuxtLink
          v-for="promo in latestPromos"
          :key="promo.id"
          to="/promotions"
          class="group bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg dark:hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 flex"
        >
          <!-- Image thumbnail -->
          <div class="w-24 flex-shrink-0 bg-slate-100 dark:bg-[#0a0a0a] relative overflow-hidden">
            <img
              v-if="promo.image"
              :src="promo.image"
              :alt="promo.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            >
            <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
              <Icon name="lucide:gift" class="w-6 h-6" />
            </div>
            <div v-if="promo.discount_text" class="absolute bottom-1.5 left-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow">
              {{ promo.discount_text }}
            </div>
          </div>
          <!-- Content -->
          <div class="p-4 flex flex-col justify-center flex-1 min-w-0">
            <span :class="['text-[9px] font-black px-2 py-0.5 rounded-full inline-block w-fit mb-1.5 uppercase tracking-wider', getBadgeClass(promo.badge)]">
              {{ promo.badge }}
            </span>
            <p class="text-slate-900 dark:text-white font-black text-xs leading-snug line-clamp-2">{{ promo.title }}</p>
            <p class="text-slate-400 dark:text-slate-500 text-[10px] mt-1 font-medium line-clamp-1">{{ promo.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>

  </div>
</template>
