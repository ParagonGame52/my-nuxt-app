<script setup lang="ts">
import type { Promotion } from '~/types/admin'

defineProps<{
  promotions: Promotion[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', promo: Promotion): void
  (e: 'delete', id: number): void
  (e: 'toggle-active', promo: Promotion): void
}>()

function formatPromoDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getPromoStatus(promo: Promotion): { status: 'upcoming' | 'active' | 'expiring' | 'expired'; label: string } {
  const now = new Date()
  const start = promo.start_date ? new Date(promo.start_date) : null
  const end = promo.end_date ? new Date(promo.end_date) : null
  if (end && typeof promo.end_date === 'string' && promo.end_date.length === 10) {
    end.setHours(23, 59, 59, 999)
  }
  if (start && start > now) {
    const diffMins = Math.ceil((start.getTime() - now.getTime()) / 60000)
    if (diffMins < 60) return { status: 'upcoming', label: `เริ่มใน ${diffMins} นาที` }
    return { status: 'upcoming', label: 'ยังไม่เริ่ม' }
  }
  if (end && end < now) return { status: 'expired', label: 'หมดอายุ' }
  if (end) {
    const diffMs = end.getTime() - now.getTime()
    const diffMins = Math.ceil(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins <= 60) return { status: 'expiring', label: `เหลือ ${diffMins} นาที` }
    if (diffHours < 24) return { status: 'expiring', label: `เหลือ ${diffHours} ชม. ${diffMins % 60} น.` }
    if (diffDays <= 3) return { status: 'expiring', label: `เหลือ ${diffDays} วัน` }
  }
  return { status: 'active', label: 'กำลังใช้งาน' }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Empty state -->
    <div v-if="promotions.length === 0" class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-14 text-center shadow-sm">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
        <Icon name="lucide:gift" class="w-8 h-8" />
      </div>
      <p class="text-slate-600 dark:text-slate-400 font-black text-sm">ยังไม่มีโปรโมชั่น</p>
      <p class="text-slate-400 dark:text-slate-500 text-xs mt-2">กดปุ่ม "เพิ่มโปรโมชั่น" เพื่อเริ่มต้น</p>
      <button
        @click="emit('add')"
        class="mt-4 inline-flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 active:scale-[0.98] text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-md shadow-pink-500/20 cursor-pointer"
      >
        <Icon name="lucide:plus" class="w-3.5 h-3.5" />
        เพิ่มโปรโมชั่น
      </button>
    </div>

    <!-- Promotions grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="promo in promotions"
        :key="promo.id"
        class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl overflow-hidden shadow-sm flex flex-col"
        :class="promo.is_active ? '' : 'opacity-60'"
      >
        <!-- Image -->
        <div class="relative h-40 bg-slate-100 dark:bg-[#191919] flex-shrink-0 overflow-hidden">
          <img v-if="promo.image" :src="promo.image" :alt="promo.title" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
            <Icon name="lucide:gift" class="w-8 h-8" />
          </div>
          <!-- Discount badge -->
          <div v-if="promo.discount_text" class="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg">
            {{ promo.discount_text }}
          </div>
          <!-- Active/Inactive pill -->
          <div class="absolute top-2 left-2">
            <button
              @click="emit('toggle-active', promo)"
              :class="promo.is_active ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-400 hover:bg-slate-500'"
              class="text-white text-[9px] font-black px-2 py-1 rounded-lg transition shadow cursor-pointer"
            >
              {{ promo.is_active ? '● Active' : '○ Inactive' }}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 flex flex-col flex-1">
          <!-- Badges -->
          <div class="flex flex-wrap items-center gap-1.5 mb-2">
            <span class="text-[9px] font-black px-2 py-0.5 rounded-full inline-block uppercase tracking-wider bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/50">
              {{ promo.badge }}
            </span>
            <span v-if="promo.promo_type === 'shipping'" class="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
              ส่งฟรี/ลดค่าส่ง
            </span>
            <span v-else-if="promo.target_category && promo.target_category !== 'ALL'" class="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-1">
              {{ promo.target_category }}
            </span>
            <span v-else class="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#191919] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#212327]">
              ทุกหมวด
            </span>
          </div>
          <!-- Title -->
          <p class="font-black text-slate-800 dark:text-slate-200 text-xs leading-snug line-clamp-2 flex-1">{{ promo.title }}</p>
          <!-- Description -->
          <p class="text-slate-400 dark:text-slate-500 text-[10px] mt-1 line-clamp-2 leading-relaxed">{{ promo.description }}</p>
          <!-- Dates + Status badge -->
          <div class="mt-2 space-y-1.5">
            <div class="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <Icon name="lucide:calendar" class="w-3 h-3" />
              <span>{{ formatPromoDate(promo.start_date) }} – {{ formatPromoDate(promo.end_date) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span
                :class="{
                  'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50': getPromoStatus(promo).status === 'upcoming',
                  'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50': getPromoStatus(promo).status === 'active',
                  'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50': getPromoStatus(promo).status === 'expiring',
                  'bg-slate-100 dark:bg-[#191919] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#212327]': getPromoStatus(promo).status === 'expired',
                }"
                class="text-[9px] font-black px-2 py-0.5 rounded-full border"
              >
                {{ getPromoStatus(promo).label }}
              </span>
            </div>
          </div>
          <!-- Actions -->
          <div class="flex gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-[#212327]">
            <button
              @click="emit('edit', promo)"
              class="flex-1 flex items-center justify-center gap-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-black text-[10px] py-2 rounded-xl transition cursor-pointer"
            >
              <Icon name="lucide:pencil" class="w-3 h-3" />
              <span>แก้ไข</span>
            </button>
            <button
              @click="emit('delete', promo.id)"
              class="flex-1 flex items-center justify-center gap-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/80 text-red-600 dark:text-red-400 font-black text-[10px] py-2 rounded-xl transition cursor-pointer"
            >
              <Icon name="lucide:trash-2" class="w-3 h-3" />
              <span>ลบ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
