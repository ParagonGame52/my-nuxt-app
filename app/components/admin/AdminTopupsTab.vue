<script setup lang="ts">
import type { TopupRequest } from '~/types/admin'

defineProps<{
  topupRequests: TopupRequest[]
}>()

const emit = defineEmits<{
  (e: 'approve', id: number): void
  (e: 'reject', id: number): void
  (e: 'preview-image', url: string): void
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl overflow-hidden shadow-sm">
    <div v-if="topupRequests.length === 0" class="p-12 text-center text-slate-500">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-3 text-slate-400">
        <Icon name="lucide:wallet" class="w-7 h-7" />
      </div>
      <p class="font-bold text-sm">ไม่มีคำขอเติมเงิน</p>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 dark:bg-[#0a0a0a] text-slate-500 font-bold border-b border-slate-200 dark:border-[#212327]">
            <th class="p-4">ผู้ใช้</th>
            <th class="p-4">จำนวนเงิน</th>
            <th class="p-4">สลิป</th>
            <th class="p-4">วันที่แจ้ง</th>
            <th class="p-4">สถานะ</th>
            <th class="p-4 text-right">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr v-for="req in topupRequests" :key="req.id" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1c20]/20 transition">
            <td class="p-4">
              <p class="font-bold text-slate-800 dark:text-slate-200">{{ req.user_name }}</p>
              <p class="text-[10px] text-slate-400">{{ req.user_email }}</p>
            </td>
            <td class="p-4 font-black text-slate-800 dark:text-white">฿{{ req.amount }}</td>
            <td class="p-4">
              <template v-if="(req as any).slip_url">
                <button type="button" @click="emit('preview-image', (req as any).slip_url)" class="block group cursor-zoom-in">
                  <img
                    :src="(req as any).slip_url"
                    alt="slip"
                    class="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-[#212327] group-hover:scale-105 transition-transform"
                  />
                </button>
              </template>
              <span v-else class="text-slate-400 text-[10px]">ไม่มีสลิป</span>
            </td>
            <td class="p-4 text-slate-500 dark:text-slate-400">{{ formatDate(req.created_at) }}</td>
            <td class="p-4">
              <span
                :class="req.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : req.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'"
                class="text-[10px] font-black px-2 py-0.5 rounded-md"
              >
                {{ req.status === 'pending' ? 'รอดำเนินการ' : req.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ' }}
              </span>
            </td>
            <td class="p-4 text-right">
              <div v-if="req.status === 'pending'" class="flex justify-end gap-2">
                <button @click="emit('approve', req.id)" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer">
                  <Icon name="lucide:check" class="w-3.5 h-3.5" />
                  <span>อนุมัติ</span>
                </button>
                <button @click="emit('reject', req.id)" class="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer">
                  <Icon name="lucide:x" class="w-3.5 h-3.5" />
                  <span>ปฏิเสธ</span>
                </button>
              </div>
              <span v-else class="text-slate-400 text-xs">ดำเนินการแล้ว</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
