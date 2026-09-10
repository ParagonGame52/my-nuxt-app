<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

if (authStore.isLoggedIn) {
  router.replace('/')
}

const form = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

async function handleRegister() {
  if (!form.name || !form.email || !form.password || !form.confirmPassword) {
    error.value = 'กรุณากรอกข้อมูลให้ครบถ้วน'
    toast.warning('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }
  if (form.password.length < 6) {
    error.value = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    toast.warning('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    return
  }
  if (form.password !== form.confirmPassword) {
    error.value = 'รหัสผ่านไม่ตรงกัน'
    toast.error('รหัสผ่านไม่ตรงกัน', 'กรุณากรอกรหัสผ่านให้ตรงกัน')
    return
  }
  error.value = ''
  loading.value = true
  try {
    await authStore.register(form.name, form.email, form.password)
    toast.success('ยินดีต้อนรับสู่ DIP & DRIP!', 'สมัครสมาชิกสำเร็จ')
    router.push('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    toast.error('สมัครสมาชิกไม่สำเร็จ', error.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">

    <!-- Background ambient blobs -->
    <div class="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md relative z-10">

      <!-- Logo -->
      <div class="text-center mb-8 flex flex-col items-center">
        <AppLogo size="lg" :showTagline="true" linkTo="/" />
        <p class="text-slate-500 dark:text-slate-400 text-xs font-medium mt-3 flex items-center justify-center gap-1">
          <span>เริ่มต้นการเดินทางสตรีทแฟชั่น &amp; กล่องสุ่ม</span>
          <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-blue-500" />
        </p>
      </div>

      <!-- Card -->
      <div class="bg-white dark:bg-[#191919] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl dark:shadow-2xl">

        <h1 class="text-xl font-black text-slate-900 dark:text-white mb-1">สมัครสมาชิก</h1>
        <p class="text-slate-500 dark:text-slate-400 text-xs font-medium mb-7">
          มีบัญชีอยู่แล้ว?
          <NuxtLink to="/login" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold transition">เข้าสู่ระบบ</NuxtLink>
        </p>

        <form @submit.prevent="handleRegister" class="space-y-4">

          <!-- Name -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              ชื่อ-นามสกุล
            </label>
            <div class="relative">
              <Icon name="lucide:user" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-name"
                v-model="form.name"
                type="text"
                required
                autocomplete="name"
                placeholder="สมชาย ใจดี"
                class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              อีเมล
            </label>
            <div class="relative">
              <Icon name="lucide:mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-email"
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                placeholder="your@email.com"
                class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              รหัสผ่าน
            </label>
            <div class="relative">
              <Icon name="lucide:lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                class="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              ยืนยันรหัสผ่าน
            </label>
            <div class="relative">
              <Icon name="lucide:lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-confirm-password"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                class="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <Icon :name="showConfirmPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Password match indicator -->
          <div v-if="form.confirmPassword" class="flex items-center space-x-2">
            <Icon
              :name="form.password === form.confirmPassword ? 'lucide:check-circle-2' : 'lucide:x-circle'"
              class="w-3.5 h-3.5"
              :class="form.password === form.confirmPassword ? 'text-emerald-500' : 'text-red-500'"
            />
            <p :class="form.password === form.confirmPassword ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'" class="text-[11px] font-bold">
              {{ form.password === form.confirmPassword ? 'รหัสผ่านตรงกัน' : 'รหัสผ่านไม่ตรงกัน' }}
            </p>
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center space-x-2">
            <Icon name="lucide:alert-circle" class="w-4 h-4 text-red-550 dark:text-red-400 flex-shrink-0" />
            <p class="text-red-650 dark:text-red-400 text-xs font-bold">{{ error }}</p>
          </div>

          <!-- Submit -->
          <button
            id="register-submit"
            type="submit"
            :disabled="loading"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl text-sm transition duration-200 shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 mt-2"
          >
            <Icon v-if="loading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:user-plus" class="w-4 h-4" />
            <span>{{ loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิกฟรี' }}</span>
          </button>

        </form>
      </div>

      <!-- Back link -->
      <p class="text-center mt-6">
        <NuxtLink to="/" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 text-xs font-medium transition flex items-center justify-center gap-1">
          <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
          กลับหน้าหลัก
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
