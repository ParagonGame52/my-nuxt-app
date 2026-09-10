<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AdminReview } from '~/types/admin'

const props = defineProps<{
  reviews: AdminReview[]
}>()

const emit = defineEmits<{
  (e: 'delete-review', id: number): void
}>()

const search = ref('')
const ratingFilter = ref<number | 'all'>('all')

const filteredReviews = computed(() => {
  return props.reviews.filter(r => {
    const matchRating = ratingFilter.value === 'all' || r.rating === Number(ratingFilter.value)
    const matchSearch = !search.value.trim() ||
      (r.product_name || '').toLowerCase().includes(search.value.toLowerCase()) ||
      (r.user_name || '').toLowerCase().includes(search.value.toLowerCase()) ||
      (r.title || '').toLowerCase().includes(search.value.toLowerCase()) ||
      (r.body || '').toLowerCase().includes(search.value.toLowerCase())
    return matchRating && matchSearch
  })
})

function formatPromoDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-5">
    <!-- Filters Bar -->
    <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl p-4 shadow-sm">
      <!-- Search -->
      <div class="relative flex-1">
        <Icon name="lucide:search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          type="text"
          placeholder="ค้นหาชื่อสินค้า, ชื่อลูกค้า หรือข้อความรีวิว..."
          class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      <!-- Rating Filter -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-500 whitespace-nowrap">คะแนนดาว:</span>
        <select
          v-model="ratingFilter"
          class="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] text-xs font-bold rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="all">ทั้งหมด ({{ reviews.length }})</option>
          <option :value="5">5 ดาว (ดีเยี่ยม)</option>
          <option :value="4">4 ดาว (ดีมาก)</option>
          <option :value="3">3 ดาว (ปานกลาง)</option>
          <option :value="2">2 ดาว (พอใช้)</option>
          <option :value="1">1 ดาว (ต้องปรับปรุง)</option>
        </select>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredReviews.length === 0" class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-14 text-center shadow-sm">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
        <Icon name="lucide:message-square" class="w-8 h-8" />
      </div>
      <p class="text-slate-600 dark:text-slate-400 font-black text-sm">ไม่พบรายการรีวิวสินค้า</p>
      <p class="text-slate-400 dark:text-slate-500 text-xs mt-1">รีวิวจากลูกค้าจะปรากฏที่นี่โดยอัตโนมัติ</p>
    </div>

    <!-- Reviews Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="rev in filteredReviews"
        :key="rev.id"
        class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
      >
        <div class="space-y-3">
          <!-- Header: Product Name + Rating -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <span class="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md inline-block mb-1 truncate max-w-full">
                {{ rev.product_name }}
              </span>
              <h4 class="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
                {{ rev.title || 'ไม่มีหัวข้อ' }}
              </h4>
            </div>
            <!-- Stars -->
            <div class="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2 py-1 rounded-xl text-amber-500 flex-shrink-0">
              <span class="text-xs font-black">{{ rev.rating }}</span>
              <Icon name="lucide:star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>

          <!-- Review Body -->
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 whitespace-pre-line bg-slate-50/60 dark:bg-[#0a0a0a] p-3 rounded-xl border border-slate-200 dark:border-[#212327]">
            {{ rev.body || '(ไม่มีข้อความเพิ่มเติม)' }}
          </p>
        </div>

        <!-- Footer: User info + Date + Delete -->
        <div class="pt-3 border-t border-slate-200 dark:border-[#212327] flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img v-if="rev.user_avatar" :src="rev.user_avatar" class="w-full h-full object-cover" />
              <span v-else>{{ (rev.user_name || 'U').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{{ rev.user_name }}</p>
              <p class="text-[9px] text-slate-400">{{ formatPromoDate(rev.created_at) }}</p>
            </div>
          </div>

          <!-- Delete Button -->
          <button
            @click="emit('delete-review', rev.id)"
            class="flex items-center gap-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 px-3 py-1.5 rounded-xl font-bold text-[10px] transition cursor-pointer"
          >
            <Icon name="lucide:trash-2" class="w-3 h-3" />
            <span>ลบรีวิว</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
