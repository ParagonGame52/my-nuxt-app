<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const toast = useToast()
const authStore = useAuthStore()

const PROMPTPAY_ID = '0808264523'
const AMOUNT_OPTIONS = [100, 300, 500, 1000, 5000]

const qrAmount = ref<number | null>(null)
const qrDataUrl = ref('')
const qrLoading = ref(false)
const qrSubmitting = ref(false)
const qrDone = ref(false)
const qrCustomAmount = ref('')

import { detectSlipQRCode } from '~/utils/slipDetector'

const slipFile = ref<File | null>(null)
const slipPreview = ref('')
const slipUploading = ref(false)
const isScanningSlip = ref(false)

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetModal()
  }
})

function resetModal() {
  qrAmount.value = null
  qrDataUrl.value = ''
  qrCustomAmount.value = ''
  qrDone.value = false
  qrSubmitting.value = false
  slipFile.value = null
  slipPreview.value = ''
  isScanningSlip.value = false
}

function close() {
  emit('update:modelValue', false)
  resetModal()
}

async function onSlipChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  isScanningSlip.value = true
  try {
    const detection = await detectSlipQRCode(file)
    if (!detection.isValidSlip) {
      toast.warning('รูปภาพไม่ถูกต้อง', detection.error || 'กรุณาแนบรูปภาพสลิปธนาคารที่มี QR Code')
      input.value = ''
      slipFile.value = null
      slipPreview.value = ''
      return
    }
    slipFile.value = file
    slipPreview.value = URL.createObjectURL(file)
    toast.success('ตรวจสอบสลิปสำเร็จ', 'ตรวจพบ QR Code ในสลิปเรียบร้อยแล้ว')
  } catch (err) {
    toast.warning('รูปภาพไม่ถูกต้อง', 'กรุณาแนบรูปภาพสลิปธนาคารที่มี QR Code')
    input.value = ''
    slipFile.value = null
    slipPreview.value = ''
  } finally {
    isScanningSlip.value = false
  }
}

function removeSlip() {
  slipFile.value = null
  slipPreview.value = ''
}

async function generateQR(amount: number) {
  qrDataUrl.value = ''
  qrLoading.value = true
  try {
    const ppqrMod = await import('promptpay-qr')
    const generatePayload: Function = typeof ppqrMod === 'function' ? ppqrMod : (ppqrMod as any).default ?? ppqrMod
    const QRCode = (await import('qrcode'))
    const payload = generatePayload(PROMPTPAY_ID, { amount })
    qrDataUrl.value = await QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
  } catch (err) {
    console.error('QR generation error:', err)
  } finally {
    qrLoading.value = false
  }
}

async function selectAmount(amount: number) {
  qrCustomAmount.value = ''
  qrAmount.value = amount
  await generateQR(amount)
}

async function applyCustomAmount() {
  const val = Number(qrCustomAmount.value)
  if (!val || val < 1) return
  qrAmount.value = val
  await generateQR(val)
}

async function confirmPayment() {
  if (!qrAmount.value) return
  if (!slipFile.value) {
    toast.warning('กรุณาแนบสลิป', 'กรุณาอัปโหลดสลิปยืนยันการโอนเงินก่อนกดยืนยัน')
    return
  }
  qrSubmitting.value = true
  try {
    slipUploading.value = true
    const formData = new FormData()
    formData.append('file', slipFile.value)
    const uploadRes = await $fetch<{ success: boolean; urls: string[] }>('/api/upload', {
      method: 'POST',
      body: formData
    })
    slipUploading.value = false
    const slipUrl = uploadRes.urls?.[0]
    if (!slipUrl) throw new Error('Upload failed')

    await authStore.requestTopUp(qrAmount.value, slipUrl)
    qrDone.value = true
  } catch (e: any) {
    slipUploading.value = false
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  } finally {
    qrSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[999] flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

        <!-- Modal Card -->
        <div class="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#191919] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#212327]">
          
          <!-- Header -->
          <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 px-6 sm:px-8 pt-6 pb-8 text-white relative">
            <button @click="close" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 active:bg-white/50 flex items-center justify-center text-white transition z-10 cursor-pointer" aria-label="Close">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
            <div>
              <span class="bg-white/20 text-white font-black text-[10px] px-3 py-1 rounded-full tracking-widest uppercase">PROMPTPAY QR PAYMENT</span>
              <h2 class="text-2xl sm:text-3xl font-black mt-2 tracking-tight flex items-center gap-2">
                <span>เติมเงินเข้ากระเป๋า</span>
                <Icon name="lucide:wallet" class="w-7 h-7" />
              </h2>
              <p class="text-xs sm:text-sm opacity-90 mt-1">เลือกจำนวนเงิน สแกน QR แล้วแนบสลิปเพื่อยืนยันการเติมเงิน</p>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6 sm:p-8 -mt-4 bg-white dark:bg-[#191919] rounded-t-3xl">

            <!-- Success state -->
            <div v-if="qrDone" class="text-center py-10 max-w-md mx-auto">
              <div class="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Icon name="lucide:check-circle" class="w-10 h-10 text-emerald-500" />
              </div>
              <h3 class="font-black text-slate-800 dark:text-slate-100 text-xl">ส่งคำขอเติมเงินแล้ว!</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">ระบบได้รับคำขอเติมเงินจำนวน <span class="font-black text-emerald-600 dark:text-emerald-400 text-base">฿{{ qrAmount?.toLocaleString() }}</span> เรียบร้อยแล้ว แอดมินกำลังตรวจสอบสลิป กรุณารอสักครู่ ยอดเงินจะเข้ากระเป๋าของคุณ</p>
              <button @click="close" class="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-3.5 rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer">
                <Icon name="lucide:check-circle-2" class="w-4 h-4" />
                <span>รับทราบ</span>
              </button>
            </div>

            <!-- Normal flow: 2-Column Grid on md+ -->
            <template v-else>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
                
                <!-- ── Left Column: Select Amount & QR Code ── -->
                <div class="space-y-4">
                  <div>
                    <p class="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">1. เลือกจำนวนเงินที่ต้องการเติม</p>
                    
                    <!-- Amount presets -->
                    <div class="grid grid-cols-3 gap-2 mb-3">
                      <button
                        v-for="amt in AMOUNT_OPTIONS"
                        :key="amt"
                        @click="selectAmount(amt)"
                        :class="[
                          'py-3 rounded-xl text-sm font-black border-2 transition-all duration-150 cursor-pointer',
                          qrAmount === amt && !qrCustomAmount
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                            : 'bg-slate-50 dark:bg-[#1a1c20] border-slate-200 dark:border-[#212327] text-slate-700 dark:text-slate-200 hover:border-emerald-400'
                        ]"
                      >
                        ฿{{ amt.toLocaleString() }}
                      </button>
                    </div>

                    <!-- Custom amount input -->
                    <div class="flex gap-2">
                      <div class="relative flex-1">
                        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">฿</span>
                        <input
                          v-model="qrCustomAmount"
                          type="number"
                          min="1"
                          placeholder="หรือระบุจำนวนเงิน..."
                          @keyup.enter="applyCustomAmount"
                          class="w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl border-2 bg-slate-50 dark:bg-[#191919] text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none transition-all duration-150"
                          :class="qrCustomAmount ? 'border-emerald-400 dark:border-emerald-500' : 'border-slate-200 dark:border-[#212327]'"
                        />
                      </div>
                      <button
                        @click="applyCustomAmount"
                        :disabled="!qrCustomAmount || Number(qrCustomAmount) < 1"
                        class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 border-2 whitespace-nowrap cursor-pointer"
                        :class="qrCustomAmount && Number(qrCustomAmount) >= 1 ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-slate-100 dark:bg-[#191919] border-slate-200 dark:border-[#212327] text-slate-400 cursor-not-allowed'"
                      >
                        สร้าง QR
                      </button>
                    </div>
                  </div>

                  <!-- QR Code area -->
                  <div class="bg-slate-50 dark:bg-[#1a1c20] rounded-2xl border border-slate-200 dark:border-[#212327] p-5 flex flex-col items-center justify-center min-h-[260px]">
                    <template v-if="!qrAmount">
                      <Icon name="lucide:qr-code" class="w-16 h-16 text-slate-300 dark:text-slate-600 mb-3 animate-pulse" />
                      <p class="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 text-center">
                        กรุณาเลือกจำนวนเงินด้านบน<br>เพื่อสร้าง QR Code
                      </p>
                    </template>
                    <template v-else-if="qrLoading">
                      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <p class="text-xs text-slate-400">กำลังสร้าง QR Code พร้อมเพย์...</p>
                    </template>
                    <template v-else-if="qrDataUrl">
                      <div class="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200">
                        <img :src="qrDataUrl" alt="PromptPay QR" class="w-52 h-52 sm:w-56 sm:h-56 rounded-xl" />
                      </div>
                      <div class="mt-3 text-center">
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                          พร้อมเพย์: <span class="font-black text-slate-700 dark:text-slate-200">{{ PROMPTPAY_ID }}</span>
                        </p>
                        <p class="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ฿{{ qrAmount?.toLocaleString() }}
                        </p>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- ── Right Column: Slip Upload & Confirm ── -->
                <div class="space-y-4">
                  <div>
                    <p class="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      2. แนบหลักฐานการโอนเงิน (สลิป) <span class="text-red-500">*</span>
                    </p>

                    <!-- Preview -->
                    <div v-if="slipPreview" class="relative rounded-2xl overflow-hidden border-2 border-emerald-400 mb-3 shadow-md">
                      <img :src="slipPreview" class="w-full max-h-64 object-contain bg-slate-50 dark:bg-[#191919]" alt="slip preview" />
                      <button
                        @click="removeSlip"
                        class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center text-white shadow-lg transition cursor-pointer"
                        title="ลบสลิป"
                      >
                        <Icon name="lucide:x" class="w-4 h-4" />
                      </button>
                      <div class="absolute bottom-0 inset-x-0 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-black text-center py-2 flex items-center justify-center gap-1.5">
                        <Icon name="lucide:check-circle-2" class="w-4 h-4" />
                        <span>แนบรูปสลิปเรียบร้อย</span>
                      </div>
                    </div>

                    <!-- Drop zone -->
                    <label
                      v-else
                      class="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#212327] bg-slate-50 dark:bg-[#1a1c20] cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all duration-200 min-h-[200px]"
                    >
                      <input type="file" accept="image/*" class="hidden" :disabled="isScanningSlip" @change="onSlipChange" />
                      <template v-if="isScanningSlip">
                        <div class="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                          <div class="w-7 h-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div class="text-center">
                          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">กำลังตรวจสอบ QR Code ในสลิป...</p>
                          <p class="text-xs text-slate-400 mt-1">กรุณารอสักครู่ ระบบกำลังสแกน Mini QR บนสลิป</p>
                        </div>
                      </template>
                      <template v-else>
                        <div class="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                          <Icon name="lucide:image-plus" class="w-7 h-7" />
                        </div>
                        <div class="text-center">
                          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">คลิกเพื่อเลือกรูปภาพสลิป</p>
                          <p class="text-xs text-slate-400 mt-1">หรือลากและวางไฟล์ที่นี่ (ต้องมี QR Code บนสลิป)</p>
                        </div>
                      </template>
                    </label>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                      กรุณาโอนเงินตามยอดที่ระบุ และแนบรูปภาพสลิปให้ชัดเจน แอดมินจะตรวจสอบและปรับยอดเงินให้ภายใน 1-5 นาที
                    </p>
                  </div>

                  <!-- Confirm button -->
                  <button
                    @click="confirmPayment"
                    :disabled="!qrDataUrl || !slipFile || qrSubmitting"
                    :class="[
                      'w-full py-4 rounded-2xl text-sm sm:text-base font-black transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer',
                      qrDataUrl && slipFile && !qrSubmitting
                        ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white shadow-xl shadow-emerald-500/30'
                        : 'bg-slate-100 dark:bg-[#191919] text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    ]"
                  >
                    <span v-if="qrSubmitting" class="flex items-center justify-center gap-2">
                      <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {{ slipUploading ? 'กำลังอัปโหลดสลิป...' : 'กำลังส่งคำขอ...' }}
                    </span>
                    <span v-else class="flex items-center justify-center gap-1.5">
                      <Icon name="lucide:check-circle-2" class="w-5 h-5" />
                      <span>โอนแล้ว — แจ้งยืนยันการชำระเงิน</span>
                    </span>
                  </button>
                </div>

              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
