<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const products = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('ทั้งหมด')
const minPrice = ref('')
const maxPrice = ref('')

const categories = ['ทั้งหมด', 'STREETWEAR', 'MINIMAL', 'KOREAN', 'VINTAGE', 'ACCESSORIES']

async function loadProducts() {
  loading.value = true
  try {
    const data = await $fetch('/api/products') as any
    products.value = data.products || []
  } catch (e: any) {
    console.error('Failed to load products', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadProducts() })

const filteredProducts = computed(() => {
  let result = [...products.value]

  // Category filter
  if (selectedCategory.value !== 'ทั้งหมด') {
    result = result.filter(p => (p.category || '').toUpperCase() === selectedCategory.value)
  }

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q))
  }

  // Price filter
  if (minPrice.value !== '') {
    result = result.filter(p => p.price >= Number(minPrice.value))
  }
  if (maxPrice.value !== '') {
    result = result.filter(p => p.price <= Number(maxPrice.value))
  }

  return result
})

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'ทั้งหมด'
  minPrice.value = ''
  maxPrice.value = ''
}

function stockColor(stock: number) {
  if (stock === 0) return 'text-red-500'
  if (stock <= 3) return 'text-amber-500'
  return 'text-emerald-500'
}

const categoryIcons: Record<string, string> = {
  'ทั้งหมด': 'lucide:layout-grid',
  'STREETWEAR': 'lucide:shirt',
  'MINIMAL': 'lucide:minus',
  'KOREAN': 'lucide:heart',
  'VINTAGE': 'lucide:clock',
  'ACCESSORIES': 'lucide:watch',
}

function getCategoryIcon(cat: string) {
  return categoryIcons[cat] || 'lucide:tag'
}
</script>

<template>
  <div class="min-h-screen py-10 px-4 transition-colors duration-300">
    <div class="max-w-7xl mx-auto space-y-8">

      <!-- Section header -->
      <div class="text-center space-y-3">
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center justify-center gap-2">
          <Icon name="lucide:shirt" class="w-8 h-8 text-pink-600 dark:text-pink-400" />
          <span>รายการสินค้าทั้งหมด</span>
        </h1>
        <p class="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          เลือกช้อปสินค้าแฟชั่นนำเข้าคุณภาพพรีเมียมจาก DIP & DRIP พร้อมรับประกันสินค้าแท้ 100%
        </p>
      </div>

      <!-- Search + Filters -->
      <div class="bg-white dark:bg-[#191919] rounded-3xl shadow-sm border border-slate-200 dark:border-[#212327] p-5 space-y-4">
        <!-- Search bar -->
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><Icon name="lucide:search" class="w-4 h-4 inline-block align-middle" /></span>
          <input v-model="searchQuery" type="text" placeholder="ค้นหาสินค้า เช่น Hoodie, Denim, Oversize..."
            class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
        </div>

        <!-- Category tabs -->
        <div class="flex flex-wrap gap-2">
          <button v-for="cat in categories" :key="cat"
            @click="selectedCategory = cat"
            :class="selectedCategory === cat ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20' : 'bg-slate-50 dark:bg-[#0a0a0a] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#212327] hover:bg-slate-100 dark:hover:bg-[#212327]'"
            class="font-black px-4 py-2 rounded-2xl text-xs transition flex items-center gap-1.5">
            <Icon :name="getCategoryIcon(cat)" class="w-3.5 h-3.5" />
            <span>{{ cat }}</span>
          </button>
        </div>

        <!-- Price range -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <span class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">ราคา</span>
          <div class="flex items-center gap-2 flex-1 sm:flex-initial">
            <input v-model="minPrice" type="number" placeholder="ต่ำสุด"
              class="w-20 sm:w-28 px-3 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
            <span class="text-slate-400 text-xs font-bold">—</span>
            <input v-model="maxPrice" type="number" placeholder="สูงสุด"
              class="w-20 sm:w-28 px-3 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
          </div>
          <button @click="resetFilters"
            class="ml-auto text-xs font-black text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 transition px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#212327] flex items-center gap-1">
            <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5" />
            <span>รีเซ็ต</span>
          </button>
        </div>

        <!-- Result count -->
        <p class="text-[11px] font-bold text-slate-400 dark:text-slate-500">
          แสดง {{ filteredProducts.length }} รายการจากทั้งหมด {{ products.length }} รายการ
        </p>
      </div>

      <!-- Loading State with Skeletons -->
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <ProductCardSkeleton v-for="i in 8" :key="i" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProducts.length === 0" class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-12 text-center shadow-sm max-w-md mx-auto">
        <div class="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Icon name="lucide:search" class="w-8 h-8" />
        </div>
        <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">ไม่พบสินค้าที่ค้นหา</p>
        <p class="text-slate-400 dark:text-slate-500 text-xs mt-2">ลองเปลี่ยนคำค้นหาหรือปรับตัวกรองดูนะครับ</p>
        <button @click="resetFilters" class="mt-4 text-xs font-black text-pink-600 hover:underline flex items-center gap-1 mx-auto">
          <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5" />
          <span>ล้างตัวกรองทั้งหมด</span>
        </button>
      </div>

      <!-- Products Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <NuxtLink
          v-for="item in filteredProducts"
          :key="item.id"
          :to="`/products/${item.id}`"
          class="group bg-white dark:bg-[#191919] border border-slate-200 dark:border-slate-900/60 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 shadow-sm hover:shadow-lg dark:hover:shadow-blue-500/5 hover:-translate-y-1 transition duration-300 relative flex flex-col justify-between"
        >
          <!-- Out of stock overlay -->
          <div v-if="item.stock === 0" class="absolute inset-0 bg-slate-900/60 rounded-3xl z-10 flex items-center justify-center">
            <span class="bg-red-600 text-white text-xs font-black px-4 py-2 rounded-xl">สินค้าหมด</span>
          </div>

          <!-- Image container -->
          <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#0a0a0a] relative mb-4">
            <img :src="item.images[0]" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" :alt="item.name">
            <span class="absolute top-3 left-3 bg-pink-600 text-white text-[9px] font-black px-2.5 py-1 rounded-xl shadow-md uppercase tracking-wider">{{ item.tag }}</span>
            
            <!-- Active Promotion Badge on Product Card -->
            <span v-if="item.has_promo" class="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-xl shadow-lg animate-pulse flex items-center gap-1 border border-white/20">
              <Icon name="lucide:zap" class="w-3 h-3" />
              <span>{{ item.promo.discount_text }}</span>
            </span>
            <span v-else-if="item.category" class="absolute top-3 right-3 bg-slate-900/60 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase">{{ item.category }}</span>
          </div>

          <!-- Info -->
          <div class="space-y-2 px-1.5 pb-1">
            <h2 class="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 min-h-[2.5rem] transition">{{ item.name }}</h2>
            
            <div class="flex items-baseline justify-between">
              <div class="flex items-baseline space-x-2">
                <span class="text-sm md:text-base font-black text-pink-600">฿{{ item.price }}</span>
                <span v-if="item.has_promo || item.original_price > item.price" class="text-[11px] font-bold text-slate-400 line-through">
                  ฿{{ item.original_price }}
                </span>
              </div>
              <span :class="stockColor(item.stock)" class="text-[10px] font-black">
                {{ item.stock === 0 ? 'หมดแล้ว' : `เหลือ ${item.stock}` }}
              </span>
            </div>

            <!-- Promo footer tag -->
            <div v-if="item.has_promo" class="pt-1.5 border-t border-slate-200 dark:border-[#212327] flex items-center justify-between text-[10px] text-rose-500 font-black">
              <span class="flex items-center gap-1">
                <Icon name="lucide:flame" class="w-3 h-3 text-rose-500" />
                {{ item.promo.badge }}
              </span>
              <span class="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded border border-rose-200/50 dark:border-rose-900/40">
                ประหยัด ฿{{ item.promo_discount }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

    </div>
  </div>
</template>