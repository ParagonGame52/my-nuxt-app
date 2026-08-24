<script setup lang="ts">
import type { GachaChest } from '~/types/admin'

defineProps<{
  gachaChests: GachaChest[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', chest: any): void
  (e: 'delete', id: number): void
  (e: 'toggle-active', chest: any): void
}>()

function getChestTotalStockText(chest: any) {
  const items = chest.items || chest.products || []
  if (items.length === 0) return '0 รายการ'
  let totalStock = 0
  let hasUnlimited = false
  for (const item of items) {
    if (item.stock === null || item.stock === undefined) hasUnlimited = true
    else totalStock += Number(item.stock)
  }
  if (hasUnlimited) return `${items.length} รายการ (ไม่จำกัด)`
  return `${items.length} รายการ (คงเหลือ ${totalStock} ชิ้น)`
}
</script>

<template>
  <div class="space-y-5">
    <!-- Empty state -->
    <div v-if="gachaChests.length === 0" class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-14 text-center shadow-sm">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
        <Icon name="lucide:dice-5" class="w-8 h-8" />
      </div>
      <p class="text-slate-600 dark:text-slate-400 font-black text-sm">ยังไม่มีตู้สุ่มในระบบ</p>
      <p class="text-slate-400 dark:text-slate-500 text-xs mt-2">กดปุ่ม "เพิ่มตู้สุ่มใหม่" เพื่อสร้างตู้แรกของคุณ</p>
      <button
        @click="emit('add')"
        class="mt-4 inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-md shadow-rose-500/20 cursor-pointer"
      >
        <Icon name="lucide:plus" class="w-3.5 h-3.5" />
        เพิ่มตู้สุ่มใหม่
      </button>
    </div>

    <!-- Gacha chests grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="chest in gachaChests"
        :key="chest.id"
        class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl overflow-hidden shadow-sm flex flex-col"
        :class="chest.is_active ? '' : 'opacity-60'"
      >
        <!-- Image -->
        <div class="relative h-44 bg-slate-100 dark:bg-[#191919] flex-shrink-0 overflow-hidden">
          <img v-if="chest.image" :src="chest.image" :alt="chest.name" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
            <Icon name="lucide:dice-5" class="w-8 h-8" />
          </div>
          
          <!-- Price badge -->
          <div class="absolute top-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black px-3 py-1 rounded-xl shadow-lg">
            ฿{{ chest.price }}
          </div>
          <!-- Item count badge on image -->
          <div class="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/10">
            <Icon name="lucide:boxes" class="w-3.5 h-3.5 text-pink-400" />
            <span>{{ (chest.items || chest.products)?.length || 0 }} สินค้าในตู้</span>
          </div>
          <!-- Active/Inactive pill -->
          <div class="absolute top-2 left-2">
            <button
              @click="emit('toggle-active', chest)"
              :class="chest.is_active ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-400 hover:bg-slate-500'"
              class="text-white text-[10px] font-black px-2.5 py-1 rounded-xl transition shadow cursor-pointer"
            >
              {{ chest.is_active ? '● Active' : '○ Inactive' }}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 flex flex-col flex-1">
          <!-- Title -->
          <p class="font-black text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-1">{{ chest.name }}</p>
          <!-- Description -->
          <p class="text-slate-400 dark:text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed flex-1">{{ chest.description }}</p>
          
          <!-- Prize count bar -->
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-[#212327] font-bold">
            <span class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-black">
              <Icon name="lucide:package-check" class="w-4 h-4 text-pink-500" />
              สินค้าทั้งหมดในตู้:
            </span>
            <span class="bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 px-2.5 py-1 rounded-lg text-xs font-black border border-pink-100 dark:border-pink-900/50">
              {{ getChestTotalStockText(chest) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-[#212327]">
            <button
              @click="emit('edit', chest)"
              class="flex-1 flex items-center justify-center gap-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-black text-[10px] py-2 rounded-xl transition cursor-pointer"
            >
              <Icon name="lucide:pencil" class="w-3 h-3" />
              <span>แก้ไข</span>
            </button>
            <button
              @click="emit('delete', chest.id)"
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
