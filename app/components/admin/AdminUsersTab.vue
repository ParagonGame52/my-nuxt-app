<script setup lang="ts">
import type { AdminUser } from '~/types/admin'
import { useAuthStore } from '~/stores/auth'

defineProps<{
  users: AdminUser[]
}>()

const emit = defineEmits<{
  (e: 'edit', user: AdminUser): void
  (e: 'delete', id: number): void
}>()

const authStore = useAuthStore()

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl overflow-hidden shadow-sm">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 dark:bg-[#0a0a0a] text-slate-500 font-bold border-b border-slate-200 dark:border-[#212327]">
            <th class="p-4">สมาชิก</th>
            <th class="p-4">ยอดเงิน</th>
            <th class="p-4">ระดับ</th>
            <th class="p-4">สิทธิ์</th>
            <th class="p-4">วันที่สมัคร</th>
            <th class="p-4 text-right">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50/50 dark:hover:bg-[#1a1c20]/20 transition">
            <td class="p-4">
              <p class="font-bold text-slate-800 dark:text-slate-200">{{ user.name }}</p>
              <p class="text-[10px] text-slate-400">{{ user.email }}</p>
            </td>
            <td class="p-4 font-black text-slate-800 dark:text-white">฿{{ user.balance.toLocaleString() }}</td>
            <td class="p-4">
              <span
                v-if="((user as any).tier || '').toLowerCase() === 'diamond'"
                class="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/50 text-cyan-500 dark:text-cyan-300 shadow-sm shadow-cyan-500/10"
              >
                <Icon name="lucide:gem" class="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Diamond</span>
              </span>
              <span
                v-else
                :class="{
                  'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800':   ((user as any).tier || 'bronze').toLowerCase() === 'platinum',
                  'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800': ((user as any).tier || 'bronze').toLowerCase() === 'gold',
                  'bg-slate-200 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600': ((user as any).tier || 'bronze').toLowerCase() === 'silver',
                  'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800': ((user as any).tier || 'bronze').toLowerCase() === 'bronze',
                }"
                class="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md"
              >
                <Icon :name="((user as any).tier || 'bronze').toLowerCase() === 'platinum' ? 'lucide:gem' : 'lucide:medal'" class="w-3.5 h-3.5" />
                <span class="capitalize">{{ (user as any).tier || 'Bronze' }}</span>
              </span>
            </td>
            <td class="p-4">
              <span
                v-if="user.is_admin >= 2"
                class="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-md"
              >
                <Icon name="lucide:crown" class="w-3 h-3 text-amber-500" />
                <span>แอดมินสูงสุด</span>
              </span>
              <span
                v-else-if="user.is_admin === 1"
                class="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-md"
              >
                <Icon name="lucide:shield" class="w-3 h-3 text-indigo-500" />
                <span>แอดมินทั่วไป</span>
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 bg-slate-100 dark:bg-[#191919] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#212327] text-[10px] font-black px-2.5 py-0.5 rounded-md"
              >
                <Icon name="lucide:user" class="w-3 h-3 text-slate-400" />
                <span>สมาชิก</span>
              </span>
            </td>
            <td class="p-4 text-slate-500 dark:text-slate-400">{{ formatDate(user.created_at) }}</td>
            <td class="p-4 text-right">
              <div class="flex justify-end gap-2 items-center">
                <!-- Edit & Delete Users (Strictly Super Admin only) -->
                <template v-if="authStore.isSuperAdmin">
                  <button
                    @click="emit('edit', user)"
                    class="p-2 border border-slate-200 dark:border-[#212327] hover:bg-slate-100 dark:hover:bg-[#212327] rounded-xl text-slate-600 dark:text-slate-300 transition flex items-center justify-center cursor-pointer"
                    title="แก้ไขข้อมูลผู้ใช้"
                  >
                    <Icon name="lucide:pencil" class="w-4 h-4" />
                  </button>
                  
                  <button
                    @click="emit('delete', user.id)"
                    :disabled="authStore.user?.id === user.id"
                    :class="authStore.user?.id === user.id ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50 dark:hover:bg-red-950/60'"
                    class="p-2 border border-red-200 dark:border-red-950/40 rounded-xl text-red-500 transition flex items-center justify-center cursor-pointer"
                    title="ลบบัญชีผู้ใช้"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </template>
                
                <div
                  v-else
                  class="p-1.5 px-2.5 bg-slate-50 dark:bg-[#1a1c20] border border-slate-200 dark:border-[#212327] rounded-xl text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5"
                  title="เฉพาะแอดมินสูงสุด (Super Admin) เท่านั้นที่สามารถแก้ไขหรือลบสมาชิกได้"
                >
                  <Icon name="lucide:lock" class="w-3.5 h-3.5 text-slate-400" />
                  <span>ดูอย่างเดียว</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
