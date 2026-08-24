<script setup lang="ts">
definePageMeta({ middleware: "auth" })

import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
const toast = useToast()
const { confirm } = useConfirm()

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const uploadingAvatar = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref('')

// ─── Withdrawal ────────────────────────────────────
const showWithdrawModal = ref(false)
const withdrawing = ref(false)
const withdrawForm = reactive({ amount: '', bank_name: '', bank_account: '' })
const withdrawals = ref<any[]>([])
const loadingWithdrawals = ref(false)

async function loadWithdrawals() {
  loadingWithdrawals.value = true
  try {
    const data = await $fetch<any>('/api/wallet/withdrawals')
    withdrawals.value = data.withdrawals || []
  } catch { withdrawals.value = [] } finally {
    loadingWithdrawals.value = false
  }
}

function openWithdrawModal() {
  withdrawForm.amount = ''
  withdrawForm.bank_name = ''
  withdrawForm.bank_account = ''
  showWithdrawModal.value = true
}

async function submitWithdraw() {
  const amount = Number(withdrawForm.amount)
  if (!amount || amount <= 0) {
    toast.warning('จำนวนเงินไม่ถูกต้อง', 'กรุณาระบุจำนวนเงินที่ต้องการถอน')
    return
  }
  if (amount < 1) {
    toast.warning('ถอนขั้นต่ำ ฿1')
    return
  }
  if (!withdrawForm.bank_name || !withdrawForm.bank_account) {
    toast.warning('กรุณากรอกข้อมูลธนาคาร')
    return
  }
  if (amount > Number((authStore.user as any)?.balance || 0)) {
    toast.error('ยอดเงินไม่เพียงพอ')
    return
  }

  const ok = await confirm({
    title: 'ยืนยันถอนเงิน',
    message: `ถอนเงิน ฿${amount.toLocaleString()} เข้าบัญชี ${withdrawForm.bank_name} เลขที่ ${withdrawForm.bank_account}`,
    confirmText: 'ยืนยันถอนเงิน',
    type: 'warning'
  })
  if (!ok) return

  withdrawing.value = true
  try {
    const res = await $fetch<any>('/api/wallet/request-withdrawal', {
      method: 'POST',
      body: { amount, bank_name: withdrawForm.bank_name, bank_account: withdrawForm.bank_account }
    })
    await authStore.fetchMe()
    await loadWithdrawals()
    showWithdrawModal.value = false
    toast.success('ส่งคำขอถอนเงินสำเร็จ!', 'คำขอของคุณอยู่ระหว่างรอการอนุมัติจากแอดมิน')
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  } finally {
    withdrawing.value = false
  }
}

// ─── Active Web Sessions ───────────────────────────
interface SessionItem {
  id: number
  is_current: boolean
  created_at: string
  expires_at: string
  user_agent: string
  ip_address: string
}

const activeSessions = ref<SessionItem[]>([])
const loadingSessions = ref(false)
const revokingSessions = ref(false)

async function loadActiveSessions() {
  if (!authStore.isLoggedIn) return
  loadingSessions.value = true
  try {
    const data = await $fetch<{ sessions: SessionItem[] }>('/api/auth/sessions')
    activeSessions.value = data.sessions || []
  } catch (e) {
    console.error('Failed to load active sessions', e)
  } finally {
    loadingSessions.value = false
  }
}

async function revokeOtherSessions() {
  const ok = await confirm({
    title: 'ออกจากระบบอุปกรณ์อื่น',
    message: 'คุณต้องการออกจากระบบจากทุกอุปกรณ์อื่นหรือไม่? (อุปกรณ์ปัจจุบันนี้จะยังคงใช้งานได้ต่อเนื่อง)',
    confirmText: 'ยืนยันออกจากระบบอุปกรณ์อื่น',
    type: 'warning'
  })

  if (!ok) return

  revokingSessions.value = true
  try {
    await $fetch('/api/auth/sessions', { method: 'DELETE' })
    toast.success('สำเร็จ', 'ออกจากระบบอุปกรณ์อื่นทั้งหมดเรียบร้อยแล้ว')
    await loadActiveSessions()
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || 'ไม่สามารถยกเลิกเซสชันได้')
  } finally {
    revokingSessions.value = false
  }
}

function parseBrowserInfo(ua: string) {
  if (!ua || ua === 'เว็บเบราว์เซอร์') return { name: 'Web Browser', icon: 'lucide:globe' }
  if (ua.includes('Chrome')) return { name: 'Google Chrome', icon: 'lucide:chrome' }
  if (ua.includes('Firefox')) return { name: 'Mozilla Firefox', icon: 'lucide:globe' }
  if (ua.includes('Safari')) return { name: 'Apple Safari', icon: 'lucide:compass' }
  if (ua.includes('Edge')) return { name: 'Microsoft Edge', icon: 'lucide:globe' }
  return { name: 'Web Browser', icon: 'lucide:laptop' }
}

// ─── Delete Account ────────────────────────────────
const showDeleteAccountModal = ref(false)
const deletePassword = ref('')
const showDeletePassword = ref(false)
const deletingAccount = ref(false)

function openDeleteAccountModal() {
  deletePassword.value = ''
  showDeletePassword.value = false
  showDeleteAccountModal.value = true
}

async function handleConfirmDeleteAccount() {
  if (!deletePassword.value) {
    toast.warning('กรุณากรอกรหัสผ่าน', 'กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการลบบัญชี')
    return
  }

  deletingAccount.value = true
  try {
    const res = await authStore.deleteAccount(deletePassword.value)
    if (res && res.success) {
      showDeleteAccountModal.value = false
      toast.success('ลบบัญชีสำเร็จ', 'ข้อมูลบัญชีของคุณถูกลบออกจากระบบเรียบร้อยแล้ว')
      navigateTo('/')
    }
  } catch (e: any) {
    toast.error('ลบบัญชีไม่สำเร็จ', e.data?.statusMessage || 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
  } finally {
    deletingAccount.value = false
  }
}

const form = reactive({
  name: '',
  email: '',
  newPassword: '',
  confirmPassword: '',
  shippingName: '',
  shippingPhone: '',
  shippingAddress: ''
})

const currentAvatar = computed(() => avatarPreview.value || (authStore.user as any)?.avatar || '')
const userInitials = computed(() => authStore.user?.name?.charAt(0)?.toUpperCase() || '?')

// ─── Membership Computeds ──────────────────────────
const userTier = computed(() => ((authStore.user as any)?.tier || 'bronze').toLowerCase())
const userPoints = computed(() => Number((authStore.user as any)?.points || 0))
const userTotalSpent = computed(() => Number((authStore.user as any)?.total_spent || 0))

const tierBadgeInfo = computed(() => {
  switch (userTier.value) {
    case 'platinum':
      return { name: 'Platinum', icon: 'lucide:gem', color: 'from-amber-400 to-yellow-600', nextTier: null, nextTarget: 0, discount: '15%', multiplier: '5x' }
    case 'gold':
      return { name: 'Gold', icon: 'lucide:medal', color: 'from-yellow-400 to-amber-500', nextTier: 'Platinum', nextTarget: 15000, discount: '10%', multiplier: '3x' }
    case 'silver':
      return { name: 'Silver', icon: 'lucide:medal', color: 'from-slate-300 to-slate-400', nextTier: 'Gold', nextTarget: 5000, discount: '5%', multiplier: '2x' }
    default:
      return { name: 'Bronze', icon: 'lucide:medal', color: 'from-amber-700 to-amber-900', nextTier: 'Silver', nextTarget: 1000, discount: '0%', multiplier: '1x' }
  }
})

const tierProgress = computed(() => {
  if (!tierBadgeInfo.value.nextTarget) return 100
  const progress = (userTotalSpent.value / tierBadgeInfo.value.nextTarget) * 100
  return Math.min(Math.round(progress), 100)
})

const redeeming = ref(false)
async function redeemPoints() {
  if (userPoints.value < 100) {
    toast.info('แต้มสะสมไม่เพียงพอ', 'ต้องมีอย่างน้อย 100 แต้มเพื่อแลกเงิน ฿10 เข้ากระเป๋า (100 แต้ม = ฿10)')
    return
  }

  const redeemableBlocks = Math.floor(userPoints.value / 100)
  const maxBonus = redeemableBlocks * 10
  const maxPoints = redeemableBlocks * 100

  const ok = await confirm({
    title: 'แลกแต้มสะสม',
    message: `คุณมี ${userPoints.value} แต้ม สามารถแลกได้ ${maxPoints} แต้ม เป็นเงิน ฿${maxBonus} เข้ากระเป๋าเงิน`,
    confirmText: `ยืนยันแลก ฿${maxBonus}`,
    type: 'info'
  })

  if (ok) {
    redeeming.value = true
    try {
      const res = await $fetch<any>('/api/auth/redeem', {
        method: 'POST',
        body: { points: maxPoints }
      })
      await authStore.fetchMe()
      toast.success('แลกแต้มสำเร็จ!', `คุณได้รับ ฿${res.bonusBalance} เข้าสู่กระเป๋าเงินเรียบร้อยแล้ว`)
    } catch (e: any) {
      toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
    } finally {
      redeeming.value = false
    }
  }
}

onMounted(async () => {
  loadActiveSessions()
  if (!authStore.isLoggedIn) {
    router.push('/login?redirect=/profile')
    return
  }
  await authStore.fetchMe()
  form.name = authStore.user?.name || ''
  form.email = authStore.user?.email || ''
  form.shippingName = (authStore.user as any)?.shipping_name || ''
  form.shippingPhone = (authStore.user as any)?.shipping_phone || ''
  form.shippingAddress = (authStore.user as any)?.shipping_address || ''
  avatarPreview.value = (authStore.user as any)?.avatar || ''
  await loadWithdrawals()
})

// ─── Avatar Upload ─────────────────────────────────
function triggerAvatarPick() {
  avatarInput.value?.click()
}

async function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => { avatarPreview.value = ev.target?.result as string }
  reader.readAsDataURL(file)

  uploadingAvatar.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await $fetch<any>('/api/auth/avatar', { method: 'POST', body: formData })
    if (res.url) {
      avatarPreview.value = res.url
      if (authStore.user) (authStore.user as any).avatar = res.url
      toast.success('อัปโหลดสำเร็จ!', 'รูปโปรไฟล์ของคุณได้รับการอัปเดตแล้ว')
    }
  } catch (e: any) {
    avatarPreview.value = (authStore.user as any)?.avatar || ''
    toast.error('อัปโหลดไม่สำเร็จ', e.data?.statusMessage || 'เกิดข้อผิดพลาด')
  } finally {
    uploadingAvatar.value = false
  }
}

// ─── Save Profile ──────────────────────────────────
async function saveProfile() {
  if (!form.name || !form.email) {
    toast.warning('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและอีเมล')
    return
  }
  if (form.newPassword && form.newPassword.length < 6) {
    toast.warning('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    return
  }
  if (form.newPassword && form.newPassword !== form.confirmPassword) {
    toast.error('รหัสผ่านไม่ตรงกัน', 'กรุณากรอกรหัสผ่านใหม่ให้ตรงกัน')
    return
  }

  loading.value = true
  try {
    await $fetch<any>('/api/auth/profile', {
      method: 'PUT',
      body: {
        name: form.name,
        email: form.email,
        newPassword: form.newPassword || undefined,
        shipping_name: form.shippingName,
        shipping_phone: form.shippingPhone,
        shipping_address: form.shippingAddress
      }
    })
    if (authStore.user) {
      authStore.user.name = form.name
      authStore.user.email = form.email
      ;(authStore.user as any).shipping_name = form.shippingName
      ;(authStore.user as any).shipping_phone = form.shippingPhone
      ;(authStore.user as any).shipping_address = form.shippingAddress
    }
    form.newPassword = ''
    form.confirmPassword = ''
    toast.success('บันทึกสำเร็จ!', 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว')
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || 'ไม่สามารถบันทึกข้อมูลได้')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen py-8 px-4 md:px-8 transition-colors duration-300">
    <div class="max-w-6xl mx-auto">

      <!-- Page title -->
      <div class="mb-8">
        <span class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-blue-200 dark:border-blue-800/50">My Account</span>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight flex items-center gap-2">
          <Icon name="lucide:user" class="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span>โปรไฟล์ของฉัน</span>
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">แก้ไขข้อมูลส่วนตัวและตรวจสอบระดับสมาชิกของคุณ</p>
      </div>

      <!-- Profile Loading Skeleton -->
      <div v-if="authStore.loading" class="grid grid-cols-1 xl:grid-cols-5 gap-6 animate-pulse">
        <div class="xl:col-span-2 space-y-6">
          <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-6 flex flex-col items-center space-y-4">
            <AppSkeleton width="96px" height="96px" variant="avatar" />
            <AppSkeleton width="140px" height="20px" />
            <AppSkeleton width="180px" height="14px" />
            <AppSkeleton width="100%" height="40px" rounded="xl" />
          </div>
          <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-6 space-y-3">
            <AppSkeleton width="100px" height="18px" />
            <AppSkeleton width="100%" height="12px" />
            <AppSkeleton width="100%" height="36px" rounded="xl" />
          </div>
        </div>
        <div class="xl:col-span-3 space-y-6">
          <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-6 space-y-4">
            <AppSkeleton width="120px" height="20px" />
            <AppSkeleton width="100%" height="42px" rounded="xl" />
            <AppSkeleton width="100%" height="42px" rounded="xl" />
            <AppSkeleton width="100%" height="42px" rounded="xl" />
            <AppSkeleton width="120px" height="42px" rounded="xl" />
          </div>
        </div>
      </div>

      <!-- Not logged in -->
      <div v-else-if="!authStore.isLoggedIn" class="bg-white dark:bg-[#191919] rounded-3xl p-14 text-center shadow-sm border border-slate-200 dark:border-[#212327]">
        <div class="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Icon name="lucide:lock" class="w-8 h-8" />
        </div>
        <p class="text-slate-500 dark:text-slate-400 font-bold">กรุณาเข้าสู่ระบบก่อน</p>
        <NuxtLink to="/login?redirect=/profile" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl text-sm transition">
          เข้าสู่ระบบ
        </NuxtLink>
      </div>

      <!-- Logged in Profile Content -->
      <div v-else class="grid grid-cols-1 xl:grid-cols-5 gap-6">

        <!-- ─── LEFT COLUMN (Avatar + Membership + Web Session) ─── -->
        <div class="xl:col-span-2 space-y-6">

          <!-- Profile Hero Card -->
          <div class="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
            <div class="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />

            <div class="relative flex items-center gap-5">
              <!-- Avatar -->
              <div class="relative flex-shrink-0">
                <div class="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg">
                  <img v-if="currentAvatar" :src="currentAvatar" alt="avatar" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-white/20 flex items-center justify-center text-3xl font-black">
                    {{ userInitials }}
                  </div>
                </div>
                <button
                  @click="triggerAvatarPick"
                  :disabled="uploadingAvatar"
                  class="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                  title="เปลี่ยนรูปโปรไฟล์"
                >
                  <div v-if="uploadingAvatar" class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <Icon v-else name="lucide:camera" class="w-4 h-4 text-blue-600" />
                </button>
                <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-xl font-black truncate">{{ authStore.user?.name }}</h2>
                  <span class="text-sm font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center gap-1">
                    <Icon :name="tierBadgeInfo.icon" class="w-3.5 h-3.5 text-amber-300" />
                    <span>{{ tierBadgeInfo.name }}</span>
                  </span>
                </div>
                <p class="text-blue-200 text-xs mt-0.5 truncate">{{ authStore.user?.email }}</p>
                <div class="flex items-center gap-2 mt-3 flex-wrap">
                  <span class="bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
                    ฿{{ authStore.balance?.toLocaleString() }} คงเหลือ
                  </span>
                  <span v-if="authStore.isAdmin" class="bg-yellow-400/30 text-yellow-200 rounded-full px-3 py-1 text-xs font-black flex items-center gap-1">
                    <Icon name="lucide:shield-check" class="w-3.5 h-3.5" />
                    <span>ADMIN</span>
                  </span>
                </div>
              </div>
            </div>

            <p class="relative text-[10px] text-blue-200/70 mt-4 text-center flex items-center justify-center gap-1">
              <Icon name="lucide:camera" class="w-3 h-3" />
              <span>คลิกที่ไอคอนกล้องเพื่อเปลี่ยนรูปโปรไฟล์</span>
            </p>
          </div>

          <!-- ─── Web Session & Active Devices Card ─── -->
          <div class="bg-white dark:bg-[#191919] rounded-3xl p-6 border border-slate-200 dark:border-[#212327] shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <span class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">Web Session</span>
                <h3 class="text-base font-black text-slate-800 dark:text-white mt-1.5 flex items-center gap-1.5">
                  <Icon name="lucide:shield-check" class="w-4 h-4 text-emerald-500" />
                  <span>เซสชัน & อุปกรณ์ที่เข้าสู่ระบบ</span>
                </h3>
              </div>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" title="เซสชันทำงานอยู่"></span>
            </div>

            <p class="text-xs text-slate-500 dark:text-slate-400">ตรวจสอบและจัดการอุปกรณ์ที่กำลังเข้าสู่ระบบบัญชีนี้</p>

            <!-- Loading Sessions -->
            <div v-if="loadingSessions" class="space-y-2.5">
              <AppSkeleton v-for="i in 2" :key="i" width="100%" height="56px" rounded="2xl" />
            </div>

            <!-- Sessions List -->
            <div v-else class="space-y-2.5">
              <div
                v-for="s in activeSessions"
                :key="s.id"
                :class="s.is_current ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10' : 'border-slate-200 dark:border-[#212327] bg-slate-50/50 dark:bg-[#0a0a0a]'"
                class="p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div :class="s.is_current ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-[#1a1c20] text-slate-500'" class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon :name="parseBrowserInfo(s.user_agent).icon" class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="text-xs font-black text-slate-800 dark:text-white truncate">{{ parseBrowserInfo(s.user_agent).name }}</p>
                      <span v-if="s.is_current" class="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-2 py-0.2 rounded-full border border-emerald-500/30">
                        อุปกรณ์นี้
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">เข้าใช้งานเมื่อ: {{ new Date(s.created_at).toLocaleString('th-TH') }}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              v-if="activeSessions.length > 1"
              @click="revokeOtherSessions"
              :disabled="revokingSessions"
              class="w-full text-xs font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-950/50 transition flex items-center justify-center gap-1.5"
            >
              <Icon name="lucide:log-out" class="w-3.5 h-3.5" />
              <span>{{ revokingSessions ? 'กำลังยกเลิก...' : 'ออกจากระบบอุปกรณ์อื่นทั้งหมด' }}</span>
            </button>
          </div>

          <!-- ─── Points Redemption Card ─── -->
          <div class="bg-white dark:bg-[#191919] rounded-3xl p-6 border border-slate-200 dark:border-[#212327] shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <span class="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">Rewards</span>
                <h3 class="text-base font-black text-slate-800 dark:text-white mt-1.5 flex items-center gap-1.5">
                  <Icon name="lucide:coins" class="w-4 h-4 text-amber-500" />
                  <span>แต้มสะสม & แลกเงิน</span>
                </h3>
              </div>
              <div class="text-right">
                <span class="text-2xl font-black text-amber-500">{{ userPoints.toLocaleString() }}</span>
                <span class="text-[10px] font-bold text-slate-400 block">แต้มปัจจุบัน</span>
              </div>
            </div>

            <p class="text-xs text-slate-500 dark:text-slate-400">ทุกการซื้อสินค้า ฿100 รับ 1 แต้ม (100 แต้ม = ฿10)</p>

            <button
              @click="redeemPoints"
              :disabled="redeeming || userPoints < 100"
              class="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <div v-if="redeeming" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <template v-else>
                <Icon name="lucide:sparkles" class="w-4 h-4" />
                <span>{{ userPoints >= 100 ? `แลกแต้มเป็นเงิน (฿${Math.floor(userPoints / 100) * 10})` : 'แต้มยังไม่ถึง 100 แต้ม' }}</span>
              </template>
            </button>
          </div>

          <!-- ─── Membership Tier Card ─── -->
          <div class="bg-white dark:bg-[#191919] rounded-3xl p-6 border border-slate-200 dark:border-[#212327] shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <span class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">Tier Level</span>
                <h3 class="text-base font-black text-slate-800 dark:text-white mt-1.5 flex items-center gap-1.5">
                  <Icon :name="tierBadgeInfo.icon" class="w-4 h-4 text-indigo-500" />
                  <span>ระดับสมาชิก {{ tierBadgeInfo.name }}</span>
                </h3>
              </div>
              <span class="text-xs font-bold text-slate-400">ยอดสะสม ฿{{ userTotalSpent.toLocaleString() }}</span>
            </div>

            <!-- Tier Perks -->
            <div class="grid grid-cols-2 gap-2 text-center text-xs">
              <div class="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#1a1c20] border border-slate-200 dark:border-[#212327]">
                <p class="text-[10px] font-bold text-slate-400">ส่วนลดพิเศษ</p>
                <p class="font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{{ tierBadgeInfo.discount }}</p>
              </div>
              <div class="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#1a1c20] border border-slate-200 dark:border-[#212327]">
                <p class="text-[10px] font-bold text-slate-400">ตัวคูณแต้ม</p>
                <p class="font-black text-amber-500 mt-0.5">{{ tierBadgeInfo.multiplier }}</p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div v-if="tierBadgeInfo.nextTier" class="bg-slate-50 dark:bg-[#1a1c20] p-4 rounded-2xl border border-slate-200 dark:border-[#212327]">
              <div class="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                <span class="flex items-center gap-1.5">
                  <Icon name="lucide:trending-up" class="w-3.5 h-3.5 text-blue-500" />
                  <span>สะสมอีก ฿{{ (tierBadgeInfo.nextTarget - userTotalSpent).toLocaleString() }}</span>
                  <Icon name="lucide:arrow-right" class="w-3 h-3 text-slate-400" />
                  <span>{{ tierBadgeInfo.nextTier }}</span>
                </span>
                <span class="text-blue-500 font-black">{{ tierProgress }}%</span>
              </div>
              <div class="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 rounded-full"
                  :style="{ width: `${tierProgress}%` }"
                />
              </div>
            </div>
            <div v-else class="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-center text-xs font-black text-amber-600 dark:text-amber-300 flex items-center justify-center gap-1.5">
              <Icon name="lucide:sparkles" class="w-4 h-4" />
              <span>คุณอยู่ในระดับสูงสุด (Platinum) รับสิทธิ์เต็มที่!</span>
            </div>
          </div>

        </div>

        <!-- ─── RIGHT COLUMN (Edit Form + Withdrawal + Danger Zone) ─── -->
        <div class="xl:col-span-3 space-y-6">

          <!-- Edit Profile Form -->
          <div class="bg-white dark:bg-[#191919] rounded-3xl shadow-sm border border-slate-200 dark:border-[#212327] p-6 md:p-8">
            <h2 class="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Icon name="lucide:pencil" class="w-5 h-5 text-blue-500" />
              <span>แก้ไขข้อมูลส่วนตัว</span>
            </h2>
            <form @submit.prevent="saveProfile" class="space-y-5">

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ชื่อ-นามสกุล</label>
                  <input v-model="form.name" type="text" placeholder="กรอกชื่อของคุณ"
                    class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div>
                  <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">อีเมล</label>
                  <input v-model="form.email" type="email" placeholder="example@email.com"
                    class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>

              <!-- Shipping Info -->
              <div class="border-t border-slate-200 dark:border-[#212327] pt-5">
                <div class="flex items-center justify-between mb-4">
                  <p class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="lucide:map-pin" class="w-4 h-4 text-blue-500" />
                    <span>ที่อยู่จัดส่งเริ่มต้น</span>
                  </p>
                  <span v-if="!authStore.hasCompletedAddress" class="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700/50 animate-pulse">
                    <Icon name="lucide:alert-triangle" class="w-3 h-3" />
                    <span>ยังไม่ครบถ้วน</span>
                  </span>
                  <span v-else class="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700/50">
                    <Icon name="lucide:check-circle-2" class="w-3 h-3" />
                    <span>ครบถ้วนแล้ว</span>
                  </span>
                </div>

                <!-- Incomplete address reminder box -->
                <div v-if="!authStore.hasCompletedAddress" class="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 flex items-start gap-3">
                  <Icon name="lucide:map-pin" class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-xs font-black text-amber-800 dark:text-amber-300 mb-0.5">กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน</p>
                    <p class="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">เพื่อความสะดวกรวดเร็วเมื่อสั่งซื้อสินค้า ระบบจะดึงข้อมูลที่อยู่นี้มากรอกให้อัตโนมัติ ไม่ต้องกรอกซ้ำทุกครั้ง</p>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ชื่อผู้รับ</label>
                      <input v-model="form.shippingName" type="text" placeholder="ชื่อผู้รับสินค้า"
                        class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <div>
                      <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">เบอร์โทรศัพท์</label>
                      <input v-model="form.shippingPhone" type="tel" placeholder="0812345678"
                        class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ที่อยู่จัดส่งเริ่มต้น</label>
                    <ThaiAddressPicker v-model="form.shippingAddress" />
                  </div>
                </div>
              </div>

              <!-- Change Password -->
              <div class="border-t border-slate-200 dark:border-[#212327] pt-5">
                <p class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Icon name="lucide:lock" class="w-4 h-4 text-slate-400" />
                  <span>เปลี่ยนรหัสผ่าน (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">รหัสผ่านใหม่</label>
                    <input v-model="form.newPassword" type="password" placeholder="อย่างน้อย 6 ตัวอักษร"
                      class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                  <div>
                    <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ยืนยันรหัสผ่านใหม่</label>
                    <input v-model="form.confirmPassword" type="password" placeholder="กรอกซ้ำอีกครั้ง"
                      class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                </div>
              </div>

              <button type="submit" :disabled="loading"
                class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl text-sm transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                <div v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <template v-else>
                  <Icon name="lucide:save" class="w-4 h-4" />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </template>
              </button>
            </form>
          </div>

          <!-- ─── Withdrawal Card ─── -->
          <div class="bg-white dark:bg-[#191919] rounded-3xl shadow-sm border border-slate-200 dark:border-[#212327] p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="lucide:banknote" class="w-4 h-4 text-rose-500" />
                  <span>ถอนเงิน</span>
                </p>
                <h3 class="text-base font-black text-slate-800 dark:text-white mt-0.5">ยอดคงเหลือ ฿{{ Number((authStore.user as any)?.balance || 0).toLocaleString() }}</h3>
              </div>
              <button
                @click="openWithdrawModal"
                class="bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-lg shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Icon name="lucide:arrow-up-right" class="w-4 h-4" />
                <span>ถอนเงิน</span>
              </button>
            </div>

            <!-- Withdrawal History -->
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">ประวัติการถอนเงิน</p>
              <div v-if="loadingWithdrawals" class="space-y-2">
                <div v-for="i in 2" :key="i" class="h-12 bg-slate-100 dark:bg-[#0a0a0a] rounded-2xl animate-pulse" />
              </div>
              <div v-else-if="withdrawals.length === 0" class="text-center py-6 text-slate-400 text-xs font-bold">
                ยังไม่มีประวัติการถอนเงิน
              </div>
              <div v-else class="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div
                  v-for="w in withdrawals"
                  :key="w.id"
                  class="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl text-xs border border-slate-100 dark:border-[#212327]"
                >
                  <div>
                    <span class="font-black text-slate-800 dark:text-white">฿{{ Number(w.amount).toLocaleString() }}</span>
                    <span class="text-slate-400 text-[10px] ml-2">({{ w.bank_name }})</span>
                  </div>
                  <div class="text-right">
                    <span
                      class="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                      :class="w.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : w.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'"
                    >
                      <span>{{ w.status === 'pending' ? 'รอดำเนินการ' : w.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ' }}</span>
                    </span>
                    <p class="text-[10px] text-slate-400 mt-1">{{ new Date(w.created_at).toLocaleDateString('th-TH') }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ─── DANGER ZONE (ลบบัญชีผู้ใช้ถาวร) ─── -->
          <div class="bg-red-50/40 dark:bg-[#191919] border border-red-200 dark:border-red-950/60 rounded-3xl p-6 shadow-sm space-y-4">
            <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Icon name="lucide:alert-octagon" class="w-5 h-5 flex-shrink-0" />
              <h3 class="text-sm font-black uppercase tracking-wider">พื้นที่อันตราย (Danger Zone)</h3>
            </div>
            <div>
              <h4 class="text-sm font-black text-slate-800 dark:text-white">ลบบัญชีผู้ใช้ถาวร</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                เมื่อลบบัญชี ข้อมูลส่วนตัว ประวัติการสั่งซื้อ ยอดเงินคงเหลือในกระเป๋า และแต้มสะสมทั้งหมดจะถูกลบออกจากระบบอย่างถาวร ไม่สามารถกู้คืนได้
              </p>
            </div>
            <button
              @click="openDeleteAccountModal"
              type="button"
              class="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-5 py-3 rounded-2xl transition shadow-lg shadow-red-600/20 flex items-center gap-2"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
              <span>ลบบัญชีของฉัน</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  </div>

  <!-- ─── Withdraw Modal ─── -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showWithdrawModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="showWithdrawModal = false">
        <div class="bg-white dark:bg-[#191919] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-[#212327]">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Icon name="lucide:banknote" class="w-5 h-5 text-rose-500" />
              <span>ถอนเงิน</span>
            </h3>
            <button @click="showWithdrawModal = false" class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <Icon name="lucide:x" class="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">จำนวนเงินที่ต้องการถอน (ขั้นต่ำ ฿1)</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">฿</span>
                <input
                  v-model="withdrawForm.amount"
                  type="number"
                  min="1"
                  :max="(authStore.user as any)?.balance || 0"
                  placeholder="0"
                  class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl pl-8 pr-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>
              <p class="text-[10px] text-slate-400 mt-1">ยอดคงเหลือ: ฿{{ Number((authStore.user as any)?.balance || 0).toLocaleString() }}</p>
            </div>

            <div>
              <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ธนาคาร</label>
              <select
                v-model="withdrawForm.bank_name"
                class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
              >
                <option value="" disabled>เลือกธนาคาร</option>
                <option>ธนาคารกสิกรไทย (KBank)</option>
                <option>ธนาคารไทยพาณิชย์ (SCB)</option>
                <option>ธนาคารกรุงไทย (KTB)</option>
                <option>ธนาคารกรุงเทพ (BBL)</option>
                <option>ธนาคารกรุงศรีอยุธยา (BAY)</option>
                <option>ธนาคารออมสิน (GSB)</option>
                <option>ธนาคารทหารไทยธนชาต (TTB)</option>
                <option>พร้อมเพย์ (PromptPay)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">เลขบัญชี / เลขพร้อมเพย์</label>
              <input
                v-model="withdrawForm.bank_account"
                type="text"
                placeholder="xxx-x-xxxxx-x"
                class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
              />
            </div>

            <div class="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-3.5 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2">
              <Icon name="lucide:alert-triangle" class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p class="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-relaxed">ยอดเงินจะถูกหักออกจากกระเป๋าทันที และจะคืนหากแอดมินปฏิเสธคำขอ</p>
            </div>

            <button
              @click="submitWithdraw"
              :disabled="withdrawing"
              class="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl text-sm transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
            >
              <div v-if="withdrawing" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <template v-else>
                <Icon name="lucide:check" class="w-4 h-4" />
                <span>ยืนยันถอนเงิน</span>
              </template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ─── Delete Account Password Confirmation Modal ─── -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showDeleteAccountModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="showDeleteAccountModal = false">
        <div class="bg-white dark:bg-[#191919] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-red-200 dark:border-red-950/60 space-y-5 animate-scale-up">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 text-red-600 dark:text-red-400">
              <div class="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
                <Icon name="lucide:alert-triangle" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-black text-slate-800 dark:text-white">ยืนยันการลบบัญชี</h3>
                <p class="text-[10px] text-red-500 font-bold">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <button @click="showDeleteAccountModal = false" class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <Icon name="lucide:x" class="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div class="bg-red-50 dark:bg-red-950/30 rounded-2xl p-4 border border-red-100 dark:border-red-900/40">
            <p class="text-xs text-red-700 dark:text-red-300 font-bold leading-relaxed">
              ⚠️ เพื่อความปลอดภัยสูงสุด กรุณากรอกรหัสผ่านปัจจุบันของคุณเพื่อยืนยันว่าคุณคือเจ้าของบัญชี
            </p>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-black text-slate-600 dark:text-slate-300">รหัสผ่านปัจจุบันของคุณ</label>
            <div class="relative">
              <input
                v-model="deletePassword"
                :type="showDeletePassword ? 'text' : 'password'"
                placeholder="กรอกรหัสผ่านเพื่อยืนยัน"
                class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl pl-4 pr-11 py-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                @keyup.enter="handleConfirmDeleteAccount"
              />
              <button
                type="button"
                @click="showDeletePassword = !showDeletePassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <Icon :name="showDeletePassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex gap-2.5 pt-2">
            <button
              @click="showDeleteAccountModal = false"
              type="button"
              class="flex-1 bg-slate-100 dark:bg-[#1a1c20] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-black py-3 rounded-2xl text-xs transition"
            >
              ยกเลิก
            </button>
            <button
              @click="handleConfirmDeleteAccount"
              :disabled="!deletePassword || deletingAccount"
              class="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-xs transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-1.5"
            >
              <div v-if="deletingAccount" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <template v-else>
                <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                <span>ยืนยันลบบัญชีถาวร</span>
              </template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
