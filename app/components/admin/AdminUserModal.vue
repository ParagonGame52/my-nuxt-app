<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

defineProps<{
  modelValue: boolean
  isUserEdit: boolean
  userForm: {
    name: string
    email: string
    password?: string
    balance: number
    is_admin: number
    tier: string
    points: number
  }
  actionLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit'): void
}>()

const authStore = useAuthStore()

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
    <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-6">
      
      <!-- Modal Header -->
      <div class="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-[#212327]">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Icon :name="isUserEdit ? 'lucide:user-cog' : 'lucide:user-plus'" class="w-5 h-5" />
          </div>
          <h2 class="text-lg sm:text-xl font-black text-slate-800 dark:text-white">{{ isUserEdit ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่' }}</h2>
        </div>
        <button @click="close" class="text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition p-2 rounded-xl cursor-pointer">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="emit('submit')" class="space-y-4 sm:space-y-5">
        <!-- Name -->
        <div>
          <label class="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">ชื่อ</label>
          <input v-model="userForm.name" type="text" placeholder="ชื่อ-นามสกุล หรือ Username" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm font-medium" />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">อีเมล</label>
          <input v-model="userForm.email" type="email" placeholder="example@email.com" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm font-medium" />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{{ isUserEdit ? 'รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน *' }}</label>
          <input v-model="userForm.password" type="password" :placeholder="isUserEdit ? 'เว้นว่างถ้าไม่ต้องการเปลี่ยนรหัสผ่าน' : 'อย่างน้อย 6 ตัวอักษร'" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm font-medium" />
        </div>

        <!-- Balance & Role -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="h-6 flex items-center text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>ยอดเงินคงเหลือ (฿)</span>
            </label>
            <input v-model="userForm.balance" type="number" min="0" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm font-bold" />
          </div>
          <div>
            <label class="h-6 flex items-center justify-between gap-1 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>สิทธิ์การใช้งาน</span>
              <span v-if="!authStore.isSuperAdmin" class="whitespace-nowrap text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                <Icon name="lucide:lock" class="w-3 h-3" />
                <span>เฉพาะ Super Admin</span>
              </span>
            </label>
            <select
              v-model="userForm.is_admin"
              :disabled="!authStore.isSuperAdmin"
              :class="!authStore.isSuperAdmin ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-[#1a1c20]' : ''"
              class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm font-medium cursor-pointer"
            >
              <option :value="0">👤 สมาชิกทั่วไป</option>
              <option :value="1">🛡️ แอดมินทั่วไป (Staff Admin)</option>
              <option :value="2">👑 แอดมินสูงสุด (Super Admin)</option>
            </select>
          </div>
        </div>

        <!-- Tier & Points -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="h-6 flex items-center justify-between gap-1 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>ระดับสมาชิก (Tier)</span>
              <span v-if="!authStore.isSuperAdmin" class="whitespace-nowrap text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                <Icon name="lucide:lock" class="w-3 h-3" />
                <span>เฉพาะ Super Admin</span>
              </span>
            </label>
            <select
              v-model="userForm.tier"
              :disabled="!authStore.isSuperAdmin"
              :class="!authStore.isSuperAdmin ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-[#1a1c20]' : ''"
              class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm capitalize font-bold cursor-pointer"
            >
              <option value="bronze">🥉 Bronze</option>
              <option value="silver">🥈 Silver</option>
              <option value="gold">🥇 Gold</option>
              <option value="platinum">💎 Platinum</option>
            </select>
          </div>
          <div>
            <label class="h-6 flex items-center text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>คะแนนสะสม (Points)</span>
            </label>
            <input v-model="userForm.points" type="number" min="0" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm font-bold" />
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end items-center gap-3 pt-3 border-t border-slate-200 dark:border-[#212327]">
          <button type="button" @click="close" class="px-6 py-3 bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-2xl transition flex items-center gap-1.5 cursor-pointer">
            <Icon name="lucide:x" class="w-4 h-4" />
            <span>ยกเลิก</span>
          </button>
          <button type="submit" :disabled="actionLoading" class="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-60 flex items-center gap-2 cursor-pointer">
            <Icon v-if="!actionLoading" name="lucide:check" class="w-4 h-4" />
            <span>{{ actionLoading ? 'กำลังบันทึก...' : isUserEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสมาชิก' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
