<script setup lang="ts">
import type { Product } from '~/types/admin'

defineProps<{
  products: Product[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', product: Product): void
  (e: 'delete', id: number): void
}>()
</script>

<template>
  <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl overflow-hidden shadow-sm">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-100/80 dark:bg-[#0a0a0a] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-[#212327]">
            <th class="p-4">สินค้า</th>
            <th class="p-4">หมวดหมู่ / Tag</th>
            <th class="p-4">ราคา</th>
            <th class="p-4 text-center">สต็อก</th>
            <th class="p-4 text-right">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr v-for="prod in products" :key="prod.id" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1c20]/20 transition">
            <td class="p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0a0a0a] flex-shrink-0">
                  <img :src="prod.images[0]" class="w-full h-full object-cover" alt="">
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{{ prod.name }}</p>
                  <p class="text-[10px] text-slate-400 truncate max-w-[200px]">{{ prod.description }}</p>
                </div>
              </div>
            </td>
            <td class="p-4">
              <div class="flex flex-col gap-1">
                <span class="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-md w-fit">{{ prod.category || 'STREETWEAR' }}</span>
                <span class="bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 text-[10px] font-black px-2 py-0.5 rounded-md w-fit">{{ prod.tag }}</span>
              </div>
            </td>
            <td class="p-4 font-bold text-slate-800 dark:text-white">
              ฿{{ prod.price }}
              <span class="text-slate-400 text-[11px] line-through ml-1">฿{{ prod.original_price }}</span>
            </td>
            <td class="p-4 text-center">
              <span :class="prod.stock === 0 ? 'text-red-500' : prod.stock <= 3 ? 'text-amber-500' : 'text-emerald-500'" class="font-black">{{ prod.stock }}</span>
            </td>
            <td class="p-4 text-right">
              <div class="flex justify-end gap-2">
                <button @click="emit('edit', prod)" class="p-2 border border-slate-200 dark:border-[#212327] hover:bg-slate-100 dark:hover:bg-[#212327] rounded-xl text-slate-600 dark:text-slate-300 transition flex items-center justify-center cursor-pointer" title="แก้ไข">
                  <Icon name="lucide:pencil" class="w-4 h-4" />
                </button>
                <button @click="emit('delete', prod.id)" class="p-2 border border-red-200 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl text-red-500 transition flex items-center justify-center cursor-pointer" title="ลบ">
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="products.length === 0">
            <td colspan="5" class="py-16 text-center">
              <div class="flex flex-col items-center gap-3">
                <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#1a1c20] flex items-center justify-center text-slate-400">
                  <Icon name="lucide:shopping-bag" class="w-7 h-7" />
                </div>
                <div class="space-y-1">
                  <p class="text-sm font-black text-slate-700 dark:text-slate-300">ยังไม่มีสินค้าในระบบ</p>
                  <p class="text-xs text-slate-400 dark:text-slate-500 font-medium">กดปุ่ม "เพิ่มสินค้าใหม่" เพื่อเริ่มเพิ่มสินค้าชิ้นแรกของคุณ</p>
                </div>
                <button
                  @click="emit('add')"
                  class="mt-1 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                  เพิ่มสินค้าใหม่
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
