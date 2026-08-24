<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

// Redirect if already logged in
if (authStore.isLoggedIn) {
  router.replace(route.query.redirect?.toString() || '/')
}

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  if (!form.email || !form.password) {
    error.value = 'กรุณากรอกอีเมลและรหัสผ่าน'
    toast.warning('ข้อมูลไม่ครบ', 'กรุณากรอกอีเมลและรหัสผ่าน')
    return
  }
  error.value = ''
  loading.value = true
  try {
    await authStore.login(form.email, form.password)
    toast.success('ยินดีต้อนรับกลับมา!', 'เข้าสู่ระบบสำเร็จ')
    const redirect = route.query.redirect?.toString() || '/'
    router.push(redirect)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    toast.error('เข้าสู่ระบบไม่สำเร็จ', error.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">

    <!-- Background ambient blobs -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md relative z-10">

      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block text-2xl font-black tracking-tighter text-slate-900 dark:text-white hover:opacity-80 transition">
          DIP &amp; <span class="text-blue-600 dark:text-blue-400">DRIP</span>
        </NuxtLink>
        <p class="text-slate-500 dark:text-slate-400 text-xs font-medium mt-2">ยินดีต้อนรับกลับมา</p>
      </div>

      <!-- Card -->
      <div class="bg-white dark:bg-[#191919] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl dark:shadow-2xl">

        <h1 class="text-xl font-black text-slate-900 dark:text-white mb-1">เข้าสู่ระบบ</h1>
        <p class="text-slate-500 dark:text-slate-400 text-xs font-medium mb-7">
          ยังไม่มีบัญชี?
          <NuxtLink to="/register" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold transition">สมัครสมาชิก</NuxtLink>
        </p>

        <form @submit.prevent="handleLogin" class="space-y-4">

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block">อีเมล</label>
            <div class="relative">
              <Icon name="lucide:mail" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 dark:text-slate-400" />
              <input
                id="login-email"
                v-model="form.email"
                type="email"
                placeholder="your@email.com"
                autocomplete="email"
                class="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 transition duration-200"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block">รหัสผ่าน</label>
            <div class="relative">
              <Icon name="lucide:lock" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-455 dark:text-slate-400" />
              <input
                id="login-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="รหัสผ่านของคุณ"
                autocomplete="current-password"
                class="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-10 pr-12 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/60 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 transition duration-200"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition"
              >
                <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center space-x-2">
            <Icon name="lucide:alert-circle" class="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
            <p class="text-red-600 dark:text-red-400 text-xs font-bold">{{ error }}</p>
          </div>

          <!-- Submit -->
          <button
            id="login-submit"
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl text-sm transition duration-200 shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 mt-2"
          >
            <Icon v-if="loading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:log-in" class="w-4 h-4" />
            <span>{{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}</span>
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
