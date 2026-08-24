<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
const toast = useToast()

const authStore = useAuthStore()
const router = useRouter()

interface GachaChest {
  id: number
  name: string
  price: number
  image: string
  description: string
  prize_count: number
  total_prizes: number
  total_stock: number
  unlimited_count: number
  is_out_of_stock: boolean
}

interface GachaItem {
  id: number
  name: string
  img: string
  tier: string
  odds: number
  chance: number
  stock: number | null
}

const chests = ref<GachaChest[]>([])
const loadingChests = ref(true)
const selectedChest = ref<GachaChest | null>(null)

const itemsPool = ref<GachaItem[]>([])
const currentDisplayImg = ref('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80')
const isRolling = ref(false)
const prizeWon = ref<any>(null)
const loadingPool = ref(false)

// Real-time timer
let realtimeTimer: ReturnType<typeof setInterval> | null = null

const totalAvailableItems = computed(() => {
  return itemsPool.value.filter(item => item.stock === null || item.stock > 0).length
})

const totalPoolStock = computed(() => {
  let count = 0
  let hasUnlimited = false
  for (const item of itemsPool.value) {
    if (item.stock === null) hasUnlimited = true
    else count += item.stock
  }
  return { count, hasUnlimited }
})

async function loadChests(showLoading = true) {
  if (showLoading) loadingChests.value = true
  try {
    const data = await $fetch('/api/gacha/chests') as any
    chests.value = data.chests || []
    if (selectedChest.value) {
      const updated = chests.value.find(c => c.id === selectedChest.value?.id)
      if (updated) selectedChest.value = updated
    }
  } catch (e: any) {
    console.error('Failed to load gacha chests', e)
  } finally {
    if (showLoading) loadingChests.value = false
  }
}

async function selectChest(chest: GachaChest) {
  if (chest.is_out_of_stock) {
    toast.info('ตู้สุ่มนี้หมดแล้ว', 'สินค้าในตู้สุ่มนี้ถูกสุ่มหมดแล้ว โปรดเลือกตู้สุ่มอื่นหรือรอแอดมินเติมของ')
    return
  }

  selectedChest.value = chest
  prizeWon.value = null
  loadingPool.value = true
  itemsPool.value = []
  
  try {
    const data = await $fetch(`/api/gacha/chests/${chest.id}`) as any
    itemsPool.value = data.pool || []
    if (itemsPool.value.length > 0) {
      currentDisplayImg.value = itemsPool.value[0]?.img || ''
    }
  } catch (e: any) {
    toast.error('โหลดไม่สำเร็จ', e.data?.statusMessage || e.message || 'ไม่สามารถโหลดของรางวัลในตู้นี้ได้')
    selectedChest.value = null
  } finally {
    loadingPool.value = false
  }
}

async function refreshPoolSilent() {
  if (!selectedChest.value || isRolling.value) return
  try {
    const data = await $fetch(`/api/gacha/chests/${selectedChest.value.id}`) as any
    itemsPool.value = data.pool || []
  } catch (e) {
    // silent update
  }
}

function goBack() {
  if (isRolling.value) return
  selectedChest.value = null
  prizeWon.value = null
  loadChests(false)
}

onMounted(async () => {
  loadChests(true)
  if (authStore.isLoggedIn) {
    await authStore.fetchMe()
  }

  // Poll real-time stock every 3.5 seconds
  realtimeTimer = setInterval(() => {
    if (selectedChest.value) {
      refreshPoolSilent()
    } else {
      loadChests(false)
    }
  }, 3500)
})

onUnmounted(() => {
  if (realtimeTimer) clearInterval(realtimeTimer)
})

async function startGacha() {
  if (!selectedChest.value) return
  if (!authStore.isLoggedIn) {
    router.push(`/login?redirect=/gacha`)
    return
  }
  // Refresh user state from server to get updated balance
  await authStore.fetchMe()

  if (authStore.balance < selectedChest.value.price) {
    toast.warning('ยอดเงินไม่เพียงพอ', `กรุณาเติมเงินก่อนสุ่มครับ (ยอดเงินของคุณมี ฿${authStore.balance} แต่ค่าสุ่มตู้นี้คือ ${selectedChest.value.price} บาท)`)
    return
  }
  if (isRolling.value) return
  isRolling.value = true
  prizeWon.value = null

  try {
    // 1. Call server to roll gacha and deduct balance
    const res = await $fetch('/api/gacha/roll', {
      method: 'POST',
      body: { chest_id: selectedChest.value.id }
    }) as any
    
    // Update local store balance
    if (authStore.user) {
      authStore.user.balance = res.newBalance
    }

    // 2. Play client animation
    let counter = 0
    const interval = setInterval(async () => {
      const randomIndex = Math.floor(Math.random() * itemsPool.value.length)
      currentDisplayImg.value = itemsPool.value[randomIndex]?.img || ''
      counter++
      
      if (counter > 15) {
        clearInterval(interval)
        // Set final display to the actual prize won from server
        currentDisplayImg.value = res.product.img
        prizeWon.value = res.product
        toast.success('ยินดีด้วย!', `คุณได้รับ ${res.product.name}`)
        isRolling.value = false

        // Immediate Real-time stock update
        await refreshPoolSilent()
        await loadChests(false)
      }
    }, 120)

  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message || 'เกิดข้อผิดพลาดในการสุ่มสินค้า')
    isRolling.value = false
    await refreshPoolSilent()
    await loadChests(false)
  }
}
</script>

<template>
  <div class="min-h-screen py-10 transition-colors duration-300">
    <div class="max-w-4xl mx-auto px-4">
      
      <!-- VIEW 1: CHEST SELECTOR -->
      <div v-if="!selectedChest" class="bg-white dark:bg-[#191919] rounded-3xl shadow-xl border border-slate-200 dark:border-[#212327] p-6 md:p-12 transition-colors duration-300">
        <!-- Header -->
        <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap mb-2">
              <span class="bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-pink-200 dark:border-pink-800/50">
                DIP & DRIP GACHA
              </span>
              <span class="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-black text-[10px] px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>● REALTIME STOCK LIVE</span>
              </span>
            </div>
            <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Icon name="lucide:dice-5" class="w-8 h-8 text-pink-500" />
              <span>เลือกตู้สุ่มรางวัลนำเข้า</span>
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">มีตู้สุ่มระดับพรีเมียมให้เลือกสรรมากมาย ลุ้นรางวัลใหญ่การันตี 100%</p>
          </div>
        </div>

        <!-- Loading Skeletons -->
        <div v-if="loadingChests" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GachaChestSkeleton v-for="i in 4" :key="i" />
        </div>

        <!-- Empty -->
        <div v-else-if="chests.length === 0" class="border border-dashed border-slate-200 dark:border-[#212327] rounded-2xl p-14 text-center">
          <div class="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Icon name="lucide:dice-5" class="w-8 h-8" />
          </div>
          <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">ขออภัย ขณะนี้ระบบยังไม่มีตู้สุ่มเปิดให้บริการ</p>
          <p class="text-slate-400 dark:text-slate-500 text-xs mt-2">โปรดเข้ามาตรวจสอบภายหลัง หรือติดต่อแอดมิน</p>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="chest in chests"
            :key="chest.id"
            @click="selectChest(chest)"
            :class="chest.is_out_of_stock ? 'opacity-70 grayscale-[30%]' : 'hover:border-pink-500 dark:hover:border-pink-500 shadow-sm hover:shadow-lg transform hover:-translate-y-1 cursor-pointer'"
            class="group bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-3xl p-5 transition-all duration-300 flex flex-col relative"
          >
            <!-- Preview cover -->
            <div class="h-48 bg-slate-100 dark:bg-[#191919] rounded-2xl overflow-hidden relative">
              <img :src="chest.image || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&q=80'" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              
              <!-- Out of Stock Overlay -->
              <div v-if="chest.is_out_of_stock" class="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                <Icon name="lucide:ban" class="w-8 h-8 text-rose-400 mb-1" />
                <span class="font-black text-sm text-rose-400">สินค้าหมดชั่วคราว</span>
                <span class="text-[10px] text-slate-300 font-semibold mt-0.5">รอแอดมินเติมของรางวัล</span>
              </div>

              <!-- Price badge -->
              <div class="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg">
                ฿{{ chest.price }}
              </div>

              <!-- Realtime Prize Count Badge on Cover -->
              <div class="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-white/10 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="chest.is_out_of_stock ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'"></span>
                <Icon name="lucide:boxes" class="w-3.5 h-3.5 text-pink-400" />
                <span v-if="chest.is_out_of_stock" class="text-rose-300">สินค้าหมด (0)</span>
                <span v-else>{{ chest.prize_count }} สินค้าพร้อมสุ่ม</span>
              </div>
            </div>

            <!-- Title & desc -->
            <div class="mt-4 flex-1 flex flex-col">
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-lg font-black text-slate-800 dark:text-white group-hover:text-pink-600 transition">{{ chest.name }}</h3>
              </div>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium line-clamp-2 leading-relaxed flex-1">{{ chest.description }}</p>
              
              <!-- Footer Real-time Stock Info -->
              <div class="mt-4 pt-3 border-t border-slate-200/50 dark:border-[#212327] flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <div class="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-black">
                  <Icon name="lucide:package-check" class="w-4 h-4 text-emerald-500" />
                  <span>คงเหลือ:</span>
                  <span
                    class="font-black text-xs px-2 py-0.5 rounded-lg border"
                    :class="chest.is_out_of_stock
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'"
                  >
                    <template v-if="chest.is_out_of_stock">0 ชิ้น</template>
                    <template v-else-if="chest.unlimited_count > 0">ไม่จำกัด</template>
                    <template v-else>{{ chest.total_stock }} ชิ้น</template>
                  </span>
                </div>
                <span v-if="!chest.is_out_of_stock" class="text-pink-500 group-hover:translate-x-1 transition flex items-center gap-1 font-black">
                  เลือกสุ่มตู้นี้ <Icon name="lucide:chevron-right" class="w-4 h-4" />
                </span>
                <span v-else class="text-rose-500 font-bold text-xs">
                  หมดแล้ว
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW 2: CHEST PLAY -->
      <div v-else class="bg-white dark:bg-[#191919] rounded-3xl shadow-xl border border-slate-200 dark:border-[#212327] p-6 md:p-12 transition-colors duration-300">
        
        <!-- Back button -->
        <button
          @click="goBack"
          :disabled="isRolling"
          class="mb-6 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition disabled:opacity-50"
        >
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
          <span>กลับไปหน้าเลือกตู้</span>
        </button>

        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2 flex-wrap mb-3">
            <span class="bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-pink-200 dark:border-pink-800/50">
              DIP &amp; DRIP GACHA
            </span>
            <span class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-black text-xs px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <Icon name="lucide:boxes" class="w-4 h-4 text-emerald-500" />
              <span>พร้อมสุ่ม {{ totalAvailableItems }} รายการ</span>
              <span v-if="!totalPoolStock.hasUnlimited" class="font-normal text-emerald-600 dark:text-emerald-400">(รวม {{ totalPoolStock.count }} ชิ้น)</span>
            </span>
          </div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Icon name="lucide:dice-5" class="w-8 h-8 text-pink-500" />
            <span>{{ selectedChest.name }}</span>
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{{ selectedChest.description }}</p>
        </div>

        <!-- Loading Pool -->
        <div v-if="loadingPool" class="flex flex-col items-center justify-center py-20 space-y-4">
          <Icon name="lucide:loader-2" class="w-8 h-8 text-blue-500 animate-spin" />
          <p class="text-slate-500 dark:text-slate-400 text-xs font-bold">กำลังโหลดรางวัลในตู้นี้...</p>
        </div>

        <div v-else-if="itemsPool.length === 0" class="border border-dashed border-slate-200 dark:border-[#212327] rounded-2xl p-14 text-center">
          <div class="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Icon name="lucide:package-open" class="w-8 h-8" />
          </div>
          <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">ยังไม่มีของรางวัลในตู้นี้ หรือสินค้าถูกสุ่มหมดแล้ว</p>
          <p class="text-slate-400 dark:text-slate-500 text-xs mt-2">โปรดเลือกตู้สุ่มอื่นๆ</p>
        </div>

        <div v-else>
          <!-- Gacha display box -->
          <div class="max-w-sm mx-auto aspect-square bg-slate-50 dark:bg-[#0a0a0a] border-4 border-slate-200 dark:border-[#212327] rounded-3xl overflow-hidden relative mb-8 shadow-inner">
            <img :src="currentDisplayImg" class="w-full h-full object-cover transition-opacity duration-100" :class="isRolling ? 'opacity-80' : 'opacity-100'" alt="Gacha display">
            <div v-if="isRolling" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm">
              <Icon name="lucide:dices" class="w-10 h-10 text-white animate-bounce" />
              <div class="text-white font-black text-sm mt-1">กำลังสุ่ม...</div>
            </div>
          </div>

          <!-- Roll button -->
          <div class="flex flex-col items-center gap-3 mb-8">
            <button
              @click="startGacha"
              :disabled="isRolling || totalAvailableItems === 0"
              class="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-12 py-4 rounded-2xl text-base shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all duration-300 active:scale-95 flex items-center gap-2"
            >
              <Icon v-if="isRolling" name="lucide:loader-2" class="w-5 h-5 animate-spin" />
              <Icon v-else-if="totalAvailableItems === 0" name="lucide:ban" class="w-5 h-5" />
              <Icon v-else name="lucide:dice-5" class="w-5 h-5" />
              <span>{{ isRolling ? 'กำลังสุ่ม...' : totalAvailableItems === 0 ? 'สินค้าหมดแล้ว' : `สุ่มเลย! (${selectedChest.price} บาท)` }}</span>
            </button>
            <p v-if="authStore.isLoggedIn" class="text-xs font-bold text-slate-500 dark:text-slate-400">
              ยอดเงินคงเหลือของคุณ: <span class="text-pink-600">฿{{ authStore.balance }}</span>
            </p>
          </div>

          <!-- Prize won -->
          <div v-if="prizeWon" class="mb-8 p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl max-w-sm mx-auto text-center animate-fade-in">
            <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <Icon name="lucide:sparkles" class="w-6 h-6" />
            </div>
            <p class="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">ยินดีด้วย! คุณได้รับ</p>
            <h3 class="text-slate-900 dark:text-white font-black text-sm leading-snug">{{ prizeWon.name }}</h3>
            <p class="text-slate-400 dark:text-slate-500 text-[10px] mt-2">รางวัลนี้ถูกบันทึกลงประวัติการสั่งซื้อของคุณเรียบร้อยแล้ว!</p>
          </div>

          <!-- Prize pool with Realtime Stock -->
          <div class="border-t border-slate-200 dark:border-[#212327] pt-8">
            <div class="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h4 class="font-black text-slate-700 dark:text-slate-300 text-sm tracking-wide flex items-center gap-1.5">
                <Icon name="lucide:package" class="w-4 h-4 text-pink-500" />
                <span>ของรางวัลภายในตู้นี้ ({{ itemsPool.length }} รายการ):</span>
              </h4>
              <span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>อัปเดตสต็อกเรียลไทม์</span>
              </span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div
                v-for="(item, idx) in itemsPool"
                :key="idx"
                class="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl p-2.5 text-center hover:border-pink-300 dark:hover:border-pink-700/60 transition duration-200 relative flex flex-col justify-between"
                :class="item.stock === 0 ? 'opacity-50 grayscale' : ''"
              >
                <div>
                  <div class="relative">
                    <img :src="item.img" class="w-full aspect-square object-cover rounded-xl mb-2.5" alt="">
                    <!-- Stock overlay if 0 -->
                    <span v-if="item.stock === 0" class="absolute inset-0 bg-slate-950/70 rounded-xl flex items-center justify-center text-[10px] font-black text-rose-300">
                      หมดแล้ว
                    </span>
                  </div>
                  <p class="text-[9px] font-bold text-slate-600 dark:text-slate-400 leading-tight truncate">{{ item.name }}</p>
                </div>

                <div class="mt-2 flex flex-wrap items-center justify-center gap-1 pt-1.5 border-t border-slate-200/50 dark:border-[#212327]/50">
                  <div v-if="item.chance !== undefined" class="inline-flex items-center gap-1 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 text-[9px] font-black px-2 py-0.5 rounded-full">
                    <Icon name="lucide:target" class="w-3 h-3" />
                    <span>{{ item.chance }}%</span>
                  </div>
                  
                  <!-- Realtime Stock Pill -->
                  <div
                    v-if="item.stock !== null && item.stock !== undefined"
                    :class="item.stock > 3
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                      : item.stock > 0
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 animate-pulse'
                        : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50'"
                    class="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border"
                  >
                    <Icon name="lucide:package" class="w-3 h-3" />
                    <span>{{ item.stock > 0 ? `เหลือ ${item.stock}` : 'หมดแล้ว' }}</span>
                  </div>
                  <div v-else class="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/50">
                    <Icon name="lucide:infinity" class="w-3 h-3" />
                    <span>ไม่จำกัด</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>