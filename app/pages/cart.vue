<script setup lang="ts">
definePageMeta({ middleware: "auth" })

import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

const toast = useToast()
const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.replace('/login?redirect=/cart')
    return
  }
  await cartStore.fetchCart()

  // Auto-fill from user profile
  shippingName.value = (authStore.user as any)?.shipping_name || ''
  shippingPhone.value = (authStore.user as any)?.shipping_phone || ''
  shippingAddress.value = (authStore.user as any)?.shipping_address || ''
})

const checkoutSuccess = ref(false)
const orderId = ref<number | null>(null)
const loading = ref(false)

// ===== QR Payment State =====
const paymentMethod = ref<'wallet' | 'qr'>('wallet')
const showQRModal = ref(false)
const qrDataUrl = ref('')
const qrAmount = ref(0)
const loadingQR = ref(false)
const slipImage = ref('')
const slipFile = ref<File | null>(null)
const slipPreview = ref('')
const slipInputMode = ref<'upload' | 'url'>('upload')
const submittingQR = ref(false)

// ===== Shipping Address State =====
const shippingName = ref('')
const shippingPhone = ref('')
const shippingAddress = ref('')

const checkingOut = computed(() => loading.value || loadingQR.value)

function validateShipping() {
  if (!shippingName.value.trim()) {
    toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อผู้รับสินค้า')
    return false
  }
  if (!shippingPhone.value.trim()) {
    toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุเบอร์โทรศัพท์ผู้รับ')
    return false
  }
  if (!shippingAddress.value.trim()) {
    toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุที่อยู่สำหรับจัดส่งสินค้า')
    return false
  }
  return true
}

// ===== Generate QR Code =====
async function openQRModal() {
  if (cartStore.items.length === 0) return
  if (!validateShipping()) return
  loadingQR.value = true
  showQRModal.value = true
  qrAmount.value = cartStore.totalPrice
  slipImage.value = ''
  slipPreview.value = ''
  slipFile.value = null

  try {
    const res = await $fetch<any>('/api/orders/qr', {
      method: 'POST',
      body: { amount: cartStore.totalPrice }
    })
    qrDataUrl.value = res.qrDataUrl
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || 'ไม่สามารถสร้าง QR Code ได้')
    showQRModal.value = false
  } finally {
    loadingQR.value = false
  }
}

// ===== Slip Upload =====
function onSlipFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  slipFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    slipPreview.value = ev.target?.result as string
    slipImage.value = slipPreview.value
  }
  reader.readAsDataURL(file)
}

async function uploadSlipFile() {
  if (!slipFile.value) return
  const formData = new FormData()
  formData.append('file', slipFile.value)
  try {
    const res = await $fetch<any>('/api/admin/upload', { method: 'POST', body: formData })
    slipImage.value = res.url
    slipPreview.value = res.url
  } catch (e: any) {
    // Use base64 fallback from FileReader
  }
}

// ===== Submit QR Order =====
async function handleQRCheckout() {
  if (!slipImage.value) {
    toast.warning('กรุณาอัปโหลดสลิป', 'กรุณาอัปโหลดหลักฐานการโอนเงินก่อนยืนยัน')
    return
  }
  submittingQR.value = true

  if (slipFile.value && slipPreview.value.startsWith('data:')) {
    await uploadSlipFile()
  }

  try {
    const res = await $fetch<any>('/api/orders', {
      method: 'POST',
      body: { 
        payment_method: 'qr', 
        slip_image: slipImage.value,
        shipping_name: shippingName.value,
        shipping_phone: shippingPhone.value,
        shipping_address: shippingAddress.value
      }
    })
    if (res && res.success) {
      showQRModal.value = false
      orderId.value = res.orderId
      checkoutSuccess.value = true
      toast.success('สั่งซื้อสินค้าสำเร็จ!', 'หมายเลขคำสั่งซื้อ #' + res.orderId)
      await cartStore.fetchCart()
      if (authStore.user) authStore.user.balance = res.newBalance
    }
  } catch (e: any) {
    toast.error('สั่งซื้อไม่สำเร็จ', e.data?.statusMessage || e.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ')
  } finally {
    submittingQR.value = false
  }
}

// ===== Wallet Checkout =====
async function handleCheckout() {
  if (cartStore.items.length === 0) return
  if (!validateShipping()) return
  loading.value = true
  try {
    const res = await $fetch<any>('/api/orders', {
      method: 'POST',
      body: { 
        payment_method: 'wallet',
        shipping_name: shippingName.value,
        shipping_phone: shippingPhone.value,
        shipping_address: shippingAddress.value
      }
    })
    if (res && res.success) {
      orderId.value = res.orderId
      checkoutSuccess.value = true
      toast.success('สั่งซื้อสินค้าสำเร็จ!', 'หมายเลขคำสั่งซื้อ #' + res.orderId)
      await cartStore.fetchCart()
      if (authStore.user) authStore.user.balance = res.newBalance
    }
  } catch (e: any) {
    toast.error('สั่งซื้อไม่สำเร็จ', e.data?.statusMessage || e.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ')
  } finally {
    loading.value = false
  }
}

async function checkout() {
  if (paymentMethod.value === 'qr') {
    await openQRModal()
  } else {
    await handleCheckout()
  }
}
</script>

<template>
  <div class="min-h-screen py-8 px-4 md:px-8 transition-colors duration-300">
    <div class="max-w-7xl mx-auto">
      
      <!-- Checkout Success state -->
      <div v-if="checkoutSuccess" class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-8 md:p-12 text-center shadow-xl space-y-6">
        <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <Icon name="lucide:check-circle-2" class="w-12 h-12" />
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">สั่งซื้อสินค้าสำเร็จ!</h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm font-semibold">หมายเลขคำสั่งซื้อของคุณคือ #{{ orderId }}</p>
          <p v-if="paymentMethod === 'qr'" class="text-amber-500 text-xs font-semibold mt-1">
            <Icon name="lucide:clipboard" class="w-4 h-4 inline-block align-middle" /> รอแอดมินตรวจสอบสลิปและยืนยันคำสั่งซื้อ
          </p>
          <p v-else class="text-slate-400 dark:text-slate-500 text-xs">ระบบกำลังเตรียมจัดส่งสินค้าด่วนให้คุณภายใน 24 ชั่วโมง</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <NuxtLink to="/history" class="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl text-xs md:text-sm transition duration-200 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
            <Icon name="lucide:package" class="w-4 h-4" />
            <span>ดูประวัติการสั่งซื้อ</span>
          </NuxtLink>
          <NuxtLink to="/products" class="bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-6 py-3 rounded-2xl text-xs md:text-sm transition duration-200 flex items-center justify-center gap-2">
            <Icon name="lucide:shopping-bag" class="w-4 h-4" />
            <span>ช้อปสินค้าต่อ</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Main Cart flow -->
      <div v-else class="space-y-8">
        <div class="text-center md:text-left space-y-2">
          <h1 class="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
            <Icon name="lucide:shopping-cart" class="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span>ตะกร้าสินค้าของคุณ</span>
          </h1>
          <p class="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400">
            รายการสินค้าที่คุณเลือกซื้อทั้งหมด
          </p>
        </div>

        <!-- Cart Loading Skeleton -->
        <div v-if="cartStore.loading" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-4">
            <div v-for="i in 3" :key="i" class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-4 flex items-center gap-4 animate-pulse">
              <AppSkeleton width="80px" height="96px" rounded="2xl" />
              <div class="space-y-2 flex-1">
                <AppSkeleton width="70%" height="18px" />
                <AppSkeleton width="40%" height="14px" />
                <AppSkeleton width="60px" height="20px" />
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-6 space-y-4 h-fit animate-pulse">
            <AppSkeleton width="50%" height="20px" />
            <AppSkeleton width="100%" height="14px" />
            <AppSkeleton width="100%" height="14px" />
            <AppSkeleton width="100%" height="46px" rounded="2xl" />
          </div>
        </div>

        <div v-else-if="cartStore.items.length === 0" class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-12 text-center shadow-sm">
          <div class="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mx-auto mb-4">
            <Icon name="lucide:shopping-bag" class="w-10 h-10" />
          </div>
          <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">ยังไม่มีสินค้าในตะกร้าของคุณ</p>
          <p class="text-slate-400 dark:text-slate-500 text-xs mt-2 mb-6">เริ่มเลือกช้อปชุดแฟชั่นสไตล์สตรีท/มินิมอลยอดนิยมเลย!</p>
          <NuxtLink to="/products" class="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl text-xs md:text-sm transition duration-200 shadow-lg shadow-blue-600/20 inline-flex items-center gap-2">
            <Icon name="lucide:shirt" class="w-4 h-4" />
            <span>ดูสินค้าทั้งหมด</span>
          </NuxtLink>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Items List -->
          <div class="lg:col-span-2 space-y-4">
            <div 
              v-for="item in cartStore.items" 
              :key="item.product_id"
              class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-slate-850 rounded-3xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition duration-200"
            >
              <!-- Image -->
              <div class="w-20 h-24 bg-slate-100 dark:bg-[#0a0a0a] rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200 dark:border-[#212327]">
                <img :src="item.product_img" class="w-full h-full object-cover" :alt="item.product_name">
              </div>

              <!-- Details -->
              <div class="flex-1 min-w-0 space-y-2">
                <h3 class="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-4">
                  {{ item.product_name }}
                </h3>
                <p class="text-sm font-black text-blue-600 dark:text-blue-400">
                  ฿{{ item.product_price }}
                </p>

                <!-- Qty adjuster & delete -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-1 p-0.5 rounded-xl border border-slate-200 dark:border-[#212327] bg-slate-50 dark:bg-[#0a0a0a]">
                    <button 
                      @click="cartStore.updateQty(item.product_id, item.quantity - 1)" 
                      :disabled="item.quantity <= 1"
                      class="w-7 h-7 font-black text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-[#212327] rounded-lg transition disabled:opacity-30 flex items-center justify-center"
                    >
                      <Icon name="lucide:minus" class="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      :value="item.quantity"
                      min="1"
                      :max="item.stock_quantity || undefined"
                      @change="(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value)
                        if (!isNaN(val) && val >= 1) {
                          cartStore.updateQty(item.product_id, val)
                        } else {
                          (e.target as HTMLInputElement).value = String(item.quantity)
                        }
                      }"
                      class="w-8 text-center text-xs font-black text-slate-800 dark:text-slate-200 bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button 
                      @click="cartStore.updateQty(item.product_id, item.quantity + 1)"
                      :disabled="item.stock_quantity > 0 && item.quantity >= item.stock_quantity"
                      class="w-7 h-7 font-black text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-[#212327] rounded-lg transition disabled:opacity-30 flex items-center justify-center"
                    >
                      <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                    </button>
                  </div>


                  <button 
                    @click="cartStore.removeItem(item.product_id)"
                    class="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="ลบออกจากตะกร้า"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Shipping Form -->
            <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 class="text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Icon name="lucide:truck" class="w-4 h-4 text-blue-500" />
                <span>ข้อมูลที่อยู่จัดส่งสินค้า</span>
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">ชื่อผู้รับ</label>
                  <input
                    v-model="shippingName"
                    type="text"
                    placeholder="ชื่อ-นามสกุล ของผู้รับ"
                    class="w-full text-xs bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    v-model="shippingPhone"
                    type="tel"
                    placeholder="เช่น 0897654321"
                    class="w-full text-xs bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
              
              <div class="space-y-1 pt-2 border-t border-slate-200 dark:border-[#212327]">
                <label class="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">ที่อยู่จัดส่งสินค้า</label>
                <ThaiAddressPicker v-model="shippingAddress" />
              </div>
            </div>

          </div>

          <!-- Checkout Summary -->
          <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm h-fit space-y-6">
            <h2 class="text-sm font-black text-slate-800 dark:text-slate-200">สรุปคำสั่งซื้อ</h2>
            
            <div class="space-y-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#212327] pb-4">
              <div class="flex justify-between">
                <span>จำนวนสินค้าทั้งหมด</span>
                <span class="text-slate-700 dark:text-slate-200 font-bold">{{ cartStore.totalItems }} ชิ้น</span>
              </div>
              <div class="flex justify-between">
                <span>รวมค่าสินค้า</span>
                <span class="text-slate-700 dark:text-slate-200 font-bold">฿{{ cartStore.subtotal }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="flex items-center gap-1.5">
                  <Icon name="lucide:truck" class="w-3.5 h-3.5 text-blue-500" />
                  <span>ค่าจัดส่ง</span>
                </span>
                <span class="text-slate-700 dark:text-slate-200 font-bold">฿{{ cartStore.baseShippingFee }}</span>
              </div>
              <div v-if="cartStore.shippingDiscount > 0" class="flex justify-between items-center text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <span class="flex items-center gap-1 font-black text-[11px]">
                  <Icon name="lucide:gift" class="w-3.5 h-3.5" />
                  <span>{{ cartStore.activeShippingPromo?.title || 'ส่วนลดค่าจัดส่ง' }}</span>
                </span>
                <span class="font-black text-xs">-฿{{ cartStore.shippingDiscount }}</span>
              </div>
            </div>

            <div class="flex justify-between items-baseline pt-2">
              <span class="text-xs font-black text-slate-800 dark:text-slate-200">ยอดชำระสุทธิ</span>
              <span class="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">฿{{ cartStore.totalPrice }}</span>
            </div>

            <!-- Payment Method Toggle -->
            <div class="space-y-2">
              <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">วิธีชำระเงิน</p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  id="payment-wallet"
                  @click="paymentMethod = 'wallet'"
                  :class="paymentMethod === 'wallet'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border-blue-600'
                    : 'bg-slate-50 dark:bg-[#191919] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#212327] hover:border-blue-400'"
                  class="flex flex-col items-center gap-1 py-3 rounded-2xl text-[10px] font-black border-2 transition-all duration-200"
                >
                  <Icon name="lucide:wallet" class="w-4 h-4" />
                  <span>กระเป๋าเงิน</span>
                </button>
                <button
                  id="payment-qr"
                  @click="paymentMethod = 'qr'"
                  :class="paymentMethod === 'qr'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border-emerald-600'
                    : 'bg-slate-50 dark:bg-[#191919] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#212327] hover:border-emerald-400'"
                  class="flex flex-col items-center gap-1 py-3 rounded-2xl text-[10px] font-black border-2 transition-all duration-200"
                >
                  <Icon name="lucide:qr-code" class="w-4 h-4" />
                  <span>PromptPay QR</span>
                </button>
              </div>
            </div>

            <button 
              @click="checkout" 
              :disabled="checkingOut"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-sm transition duration-200 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <span v-if="checkingOut" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>ยืนยันการสั่งซื้อ</span>
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- ===== QR Payment Modal ===== -->
    <div v-if="showQRModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" @click.self="showQRModal = false">
      <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-black text-base flex items-center gap-2">
                <Icon name="lucide:credit-card" class="w-5 h-5" />
                <span>ชำระผ่าน PromptPay</span>
              </h2>
              <p class="text-emerald-100 text-xs mt-0.5">สแกนแล้วอัปโหลดสลิปยืนยัน</p>
            </div>
            <button @click="showQRModal = false" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <!-- QR Code -->
          <div class="flex flex-col items-center space-y-3">
            <div v-if="loadingQR" class="w-52 h-52 bg-slate-100 dark:bg-[#191919] rounded-2xl flex items-center justify-center">
              <Icon name="lucide:loader-2" class="w-8 h-8 text-slate-400 animate-spin" />
            </div>
            <div v-else class="p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
              <img :src="qrDataUrl" alt="QR PromptPay" class="w-48 h-48 object-contain" />
            </div>
            <div class="text-center space-y-1">
              <p class="text-[10px] text-slate-400 dark:text-slate-500">PromptPay เบอร์</p>
              <p class="font-black text-slate-800 dark:text-white text-sm tracking-widest">0808264523</p>
              <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl px-4 py-2">
                <p class="text-[10px] text-amber-600 dark:text-amber-400 font-bold">ยอดชำระ</p>
                <p class="text-xl font-black text-amber-600 dark:text-amber-400">฿{{ qrAmount }}</p>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="relative flex items-center">
            <div class="flex-grow border-t border-slate-200 dark:border-[#212327]"></div>
            <span class="flex-shrink mx-3 text-[10px] text-slate-400 font-bold">อัปโหลดสลิปหลังโอนเงิน</span>
            <div class="flex-grow border-t border-slate-200 dark:border-[#212327]"></div>
          </div>

          <!-- Slip Input Toggle -->
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="slipInputMode = 'upload'; slipImage = ''; slipPreview = ''"
              :class="slipInputMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-[#191919] text-slate-600 dark:text-slate-300'"
              class="py-2 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1.5"
            >
              <Icon name="lucide:folder-up" class="w-3.5 h-3.5" />
              <span>อัปโหลดจากเครื่อง</span>
            </button>
            <button
              @click="slipInputMode = 'url'; slipImage = ''; slipPreview = ''"
              :class="slipInputMode === 'url' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-[#191919] text-slate-600 dark:text-slate-300'"
              class="py-2 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1.5"
            >
              <Icon name="lucide:link-2" class="w-3.5 h-3.5" />
              <span>ใส่ลิงก์รูป</span>
            </button>
          </div>

          <!-- Upload Mode -->
          <div v-if="slipInputMode === 'upload'">
            <label
              for="slip-upload"
              class="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-2xl cursor-pointer transition"
              :class="slipPreview ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-[#212327] bg-slate-50 dark:bg-[#191919] hover:border-blue-400'"
            >
              <img v-if="slipPreview" :src="slipPreview" class="h-full w-full object-contain rounded-2xl p-1" />
              <div v-else class="flex flex-col items-center gap-1 text-slate-400">
                <Icon name="lucide:upload-cloud" class="w-7 h-7" />
                <p class="text-[10px] font-bold">คลิกเลือกรูปสลิป</p>
              </div>
            </label>
            <input id="slip-upload" type="file" accept="image/*" class="hidden" @change="onSlipFileChange" />
          </div>

          <!-- URL Mode -->
          <div v-else class="space-y-2">
            <input
              v-model="slipImage"
              type="url"
              placeholder="วางลิงก์รูปภาพสลิปที่นี่..."
              class="w-full text-xs bg-slate-50 dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              @input="slipPreview = slipImage"
            />
            <div v-if="slipImage" class="w-full h-24 bg-slate-100 dark:bg-[#191919] rounded-xl overflow-hidden">
              <img :src="slipImage" class="w-full h-full object-contain" @error="slipPreview = ''" />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            id="qr-confirm-btn"
            @click="handleQRCheckout"
            :disabled="submittingQR || (!slipImage && !slipFile)"
            class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Icon v-if="submittingQR" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else name="lucide:check-circle-2" class="w-4 h-4" />
            <span>{{ submittingQR ? 'กำลังส่งคำสั่งซื้อ...' : 'ยืนยันการชำระเงิน' }}</span>
          </button>

          <p class="text-center text-[10px] text-slate-400 dark:text-slate-500">
            หลังยืนยันแอดมินจะตรวจสอบสลิปและอนุมัติคำสั่งซื้อภายใน 5-15 นาที
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
