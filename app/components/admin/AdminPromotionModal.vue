<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
  isPromoEdit: boolean
  promoForm: {
    title: string
    description: string
    image: string
    badge: string
    discount_mode: 'percent' | 'fixed' | 'free'
    discount_val: number
    discount_text: string
    start_date: string
    end_date: string
    is_active: number
    target_category: string
    promo_type: 'product' | 'shipping'
    min_spend: number
  }
  actionLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit'): void
  (e: 'sync-discount'): void
  (e: 'set-duration', minutes: number): void
}>()

const toast = useToast()
const showMediaModal = ref(false)
const imageInputMode = ref<'library' | 'upload' | 'link'>('library')
const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function close() {
  emit('update:modelValue', false)
}

function handleSelectFromLibrary(url: string | string[]) {
  if (typeof url === 'string') {
    props.promoForm.image = url
  } else if (Array.isArray(url) && url.length > 0) {
    props.promoForm.image = url[0]!
  }
  toast.success('เลือกรูปภาพแล้ว!', 'นำเข้ารูปภาพจากคลังเรียบร้อย')
}

async function handleDirectUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  isUploading.value = true
  const formData = new FormData()
  formData.append('files', target.files[0] as File)

  try {
    const res = await $fetch<{ success: boolean; urls: string[] }>('/api/admin/upload', {
      method: 'POST',
      body: formData
    })
    if (res.success && res.urls.length > 0) {
      props.promoForm.image = res.urls[0]!
      toast.success('อัปโหลดสำเร็จ!', 'รูปภาพโปรโมชั่นถูกอัปโหลดเรียบร้อย')
    }
  } catch (err: any) {
    toast.error('เกิดข้อผิดพลาด', err.data?.statusMessage || err.message || 'ไม่สามารถอัปโหลดรูปภาพได้')
  } finally {
    isUploading.value = false
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
    <!-- Large, Spacious Modal Container -->
    <div class="bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#26282c] rounded-3xl w-full max-w-4xl lg:max-w-5xl shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto space-y-6 my-auto">
      
      <!-- Modal Header -->
      <div class="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-[#26282c]">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Icon :name="isPromoEdit ? 'lucide:file-edit' : 'lucide:gift'" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
              {{ isPromoEdit ? 'แก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่นใหม่' }}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              กำหนดรายละเอียดส่วนลด เงื่อนไข วันเวลา และแบนเนอร์โปรโมชั่น
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="close"
          class="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#222] hover:bg-slate-200 dark:hover:bg-[#2c2c2c] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="emit('submit')" class="space-y-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
        
        <!-- Main 2-Column Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- LEFT COLUMN (Info & Settings) -->
          <div class="lg:col-span-7 space-y-5">
            
            <!-- Title & Badge in 1 row -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2 space-y-1.5">
                <label class="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">หัวข้อโปรโมชั่น *</label>
                <input
                  v-model="promoForm.title"
                  type="text"
                  placeholder="เช่น Flash Sale ลด 30% ต้อนรับสิ้นเดือน!"
                  class="w-full bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#26282c] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition font-bold"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">ป้ายกำกับ (Badge)</label>
                <select
                  v-model="promoForm.badge"
                  class="w-full bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#26282c] rounded-2xl px-3.5 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition cursor-pointer"
                >
                  <option>Flash Sale</option>
                  <option>โปรโมชั่น</option>
                  <option>Buy 2 Get 1</option>
                  <option>New Collection</option>
                  <option>Clearance</option>
                  <option>Limited</option>
                </select>
              </div>
            </div>

            <!-- Description -->
            <div class="space-y-1.5">
              <label class="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">รายละเอียดโปรโมชั่น *</label>
              <textarea
                v-model="promoForm.description"
                rows="3"
                placeholder="อธิบายเงื่อนไขและรายละเอียดโปรโมชั่นอย่างละเอียดสำหรับลูกค้า..."
                class="w-full bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#26282c] rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition resize-none leading-relaxed"
              />
            </div>

            <!-- Promo Type, Target Category & Min Spend -->
            <div class="p-4 sm:p-5 bg-slate-50 dark:bg-[#0d0d0d] rounded-2xl border border-slate-200 dark:border-[#26282c] space-y-4">
              <h3 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">เงื่อนไขการใช้งานโปรโมชั่น</h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div class="space-y-1.5">
                  <label class="block font-bold text-xs text-slate-700 dark:text-slate-300">ประเภทโปรโมชั่น</label>
                  <select
                    v-model="promoForm.promo_type"
                    class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 transition cursor-pointer"
                  >
                    <option value="product">ส่วนลดสินค้า</option>
                    <option value="shipping">ลดค่าจัดส่ง / ฟรีค่าส่ง</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="block font-bold text-xs text-slate-700 dark:text-slate-300">หมวดหมู่สินค้าที่ลด</label>
                  <select
                    :disabled="promoForm.promo_type === 'shipping'"
                    v-model="promoForm.target_category"
                    class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 transition disabled:opacity-40 cursor-pointer"
                  >
                    <option value="ALL">ทุกหมวดหมู่ (ALL)</option>
                    <option value="STREETWEAR">STREETWEAR</option>
                    <option value="MINIMAL">MINIMAL</option>
                    <option value="KOREAN">KOREAN</option>
                    <option value="VINTAGE">VINTAGE</option>
                    <option value="ACCESSORIES">ACCESSORIES</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="block font-bold text-xs text-slate-700 dark:text-slate-300">ยอดซื้อขั้นต่ำ (฿)</label>
                  <input
                    v-model.number="promoForm.min_spend"
                    type="number"
                    min="0"
                    placeholder="0 = ไม่มีขั้นต่ำ"
                    class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                  />
                </div>
              </div>
            </div>

            <!-- Date and Time range with Quick Presets -->
            <div class="p-4 sm:p-5 bg-slate-50 dark:bg-[#0d0d0d] rounded-2xl border border-slate-200 dark:border-[#26282c] space-y-3.5">
              <h3 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">ระยะเวลาโปรโมชั่น</h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div class="space-y-1.5">
                  <label class="block font-bold text-xs">วันและเวลาเริ่มต้น</label>
                  <input
                    v-model="promoForm.start_date"
                    type="datetime-local"
                    class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 transition text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="block font-bold text-xs">วันและเวลาสิ้นสุด (หมดอายุ)</label>
                  <input
                    v-model="promoForm.end_date"
                    type="datetime-local"
                    class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500 transition text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <!-- Quick Duration Presets -->
              <div class="pt-2 border-t border-slate-200/60 dark:border-[#26282c] space-y-2">
                <span class="text-[11px] text-slate-500 dark:text-slate-400 font-bold block">ปุ่มลัดตั้งเวลาด่วน (นับจากเวลานี้):</span>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    @click="emit('set-duration', 10)"
                    class="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    ⚡ 10 นาที (Flash)
                  </button>
                  <button
                    type="button"
                    @click="emit('set-duration', 30)"
                    class="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/30 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    30 นาที
                  </button>
                  <button
                    type="button"
                    @click="emit('set-duration', 60)"
                    class="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    1 ชั่วโมง
                  </button>
                  <button
                    type="button"
                    @click="emit('set-duration', 60 * 24)"
                    class="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    1 วัน
                  </button>
                  <button
                    type="button"
                    @click="emit('set-duration', 60 * 24 * 3)"
                    class="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    3 วัน
                  </button>
                  <button
                    type="button"
                    @click="emit('set-duration', 60 * 24 * 7)"
                    class="px-3 py-1.5 bg-slate-200 dark:bg-[#222] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    7 วัน
                  </button>
                </div>
              </div>
            </div>

            <!-- Active toggle -->
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0d0d0d] rounded-2xl border border-slate-200 dark:border-[#26282c]">
              <div class="space-y-0.5">
                <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">สถานะการแสดงผลโปรโมชั่น</p>
                <p class="text-xs text-slate-400 dark:text-slate-500">เปิดเพื่อให้ลูกค้ามองเห็นและใช้งานโปรโมชั่นนี้ได้ทันที</p>
              </div>
              <button
                type="button"
                @click="promoForm.is_active = promoForm.is_active ? 0 : 1"
                :class="promoForm.is_active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'bg-slate-200 dark:bg-[#222] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#26282c]'"
                class="px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <span :class="promoForm.is_active ? 'bg-white animate-pulse' : 'bg-slate-400'" class="w-2.5 h-2.5 rounded-full inline-block"></span>
                <span>{{ promoForm.is_active ? 'แสดงอยู่ (เปิด)' : 'ซ่อนอยู่ (ปิด)' }}</span>
              </button>
            </div>
          </div>

          <!-- RIGHT COLUMN (Discount Setup & Media Banner) -->
          <div class="lg:col-span-5 space-y-5">
            
            <!-- Large Image Banner Section -->
            <div class="p-4 sm:p-5 bg-slate-50 dark:bg-[#0d0d0d] rounded-2xl border border-slate-200 dark:border-[#26282c] space-y-4">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <label class="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">รูปภาพแบนเนอร์โปรโมชั่น</label>
                <!-- Switcher -->
                <div class="flex bg-slate-200/70 dark:bg-[#181818] p-0.5 rounded-xl border border-slate-200 dark:border-[#26282c] text-[11px]">
                  <button
                    type="button"
                    @click="imageInputMode = 'library'"
                    :class="imageInputMode === 'library' ? 'bg-pink-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                    class="px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Icon name="lucide:image" class="w-3 h-3" />
                    <span>คลังภาพ</span>
                  </button>
                  <button
                    type="button"
                    @click="imageInputMode = 'upload'"
                    :class="imageInputMode === 'upload' ? 'bg-pink-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                    class="px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Icon name="lucide:upload" class="w-3 h-3" />
                    <span>อัปโหลด</span>
                  </button>
                  <button
                    type="button"
                    @click="imageInputMode = 'link'"
                    :class="imageInputMode === 'link' ? 'bg-pink-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                    class="px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Icon name="lucide:link" class="w-3 h-3" />
                    <span>URL</span>
                  </button>
                </div>
              </div>

              <!-- Mode 1: Library Mode -->
              <div v-show="imageInputMode === 'library'" class="space-y-2">
                <button
                  type="button"
                  @click="showMediaModal = true"
                  class="w-full py-3.5 px-4 bg-white dark:bg-[#181818] hover:bg-pink-50 dark:hover:bg-pink-950/30 border-2 border-dashed border-pink-300 dark:border-pink-900/60 hover:border-pink-500 rounded-2xl text-pink-600 dark:text-pink-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Icon name="lucide:folder-open" class="w-4 h-4" />
                  <span>เปิดคลังรูปภาพ (เลือกรูปภาพที่มีอยู่)</span>
                </button>
              </div>

              <!-- Mode 2: Upload Mode -->
              <div v-show="imageInputMode === 'upload'" class="space-y-2">
                <div
                  @click="fileInputRef?.click()"
                  class="border-2 border-dashed border-slate-300 dark:border-[#26282c] hover:border-pink-500 bg-white dark:bg-[#181818] rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
                >
                  <Icon name="lucide:upload-cloud" class="w-7 h-7 text-pink-500" />
                  <span class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง</span>
                  <span class="text-[10px] text-slate-400">รองรับ PNG, JPG, JPEG, WEBP, GIF</span>
                  <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleDirectUpload" />
                </div>

                <!-- Uploading Spinner -->
                <div v-if="isUploading" class="flex items-center justify-center gap-2 py-2 text-pink-500 text-xs font-bold">
                  <div class="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังอัปโหลดรูปภาพ...</span>
                </div>
              </div>

              <!-- Mode 3: Link URL Mode -->
              <div v-show="imageInputMode === 'link'" class="space-y-1">
                <div class="flex gap-2">
                  <input
                    v-model="promoForm.image"
                    type="text"
                    placeholder="https://..."
                    class="flex-1 bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                  />
                  <button
                    type="button"
                    @click="showMediaModal = true"
                    title="เลือกจากคลัง"
                    class="px-3 py-2 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800/40 rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <Icon name="lucide:image" class="w-3.5 h-3.5" />
                    <span>คลัง</span>
                  </button>
                </div>
              </div>

              <!-- Large Image Preview Card with Banner Aspect Ratio -->
              <div
                v-if="promoForm.image"
                class="relative group rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] shadow-md h-44 sm:h-52"
              >
                <img :src="promoForm.image" alt="preview" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                
                <!-- Discount overlay preview badge -->
                <div v-if="promoForm.discount_text" class="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg">
                  {{ promoForm.discount_text }}
                </div>

                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 backdrop-blur-xs">
                  <button
                    type="button"
                    @click="showMediaModal = true"
                    class="px-4 py-2 bg-white text-slate-900 text-xs font-black rounded-xl shadow-lg transition hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" />
                    <span>เปลี่ยนรูปภาพ</span>
                  </button>
                  <button
                    type="button"
                    @click="promoForm.image = ''"
                    class="px-4 py-2 bg-rose-600 text-white text-xs font-black rounded-xl shadow-lg transition hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                    <span>ลบรูป</span>
                  </button>
                </div>

                <div class="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-lg font-mono truncate">
                  {{ promoForm.image }}
                </div>
              </div>
            </div>

            <!-- Discount Calculation Settings -->
            <div class="p-4 sm:p-5 bg-slate-50 dark:bg-[#0d0d0d] rounded-2xl border border-slate-200 dark:border-[#26282c] space-y-4">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <label class="block font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  กำหนดมูลค่าส่วนลด
                </label>
                <!-- Unit Selector Tabs -->
                <div class="flex bg-slate-200/70 dark:bg-[#181818] p-1 rounded-xl border border-slate-200 dark:border-[#26282c] text-xs">
                  <button
                    type="button"
                    @click="promoForm.discount_mode = 'percent'; emit('sync-discount')"
                    :class="promoForm.discount_mode === 'percent' ? 'bg-pink-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                    class="px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>% เปอร์เซ็นต์</span>
                  </button>
                  <button
                    type="button"
                    @click="promoForm.discount_mode = 'fixed'; emit('sync-discount')"
                    :class="promoForm.discount_mode === 'fixed' ? 'bg-pink-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                    class="px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>฿ บาท</span>
                  </button>
                  <button
                    v-if="promoForm.promo_type === 'shipping'"
                    type="button"
                    @click="promoForm.discount_mode = 'free'; emit('sync-discount')"
                    :class="promoForm.discount_mode === 'free' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                    class="px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>ฟรีค่าส่ง</span>
                  </button>
                </div>
              </div>

              <!-- Value Input and Quick Presets -->
              <div v-if="promoForm.discount_mode !== 'free'" class="space-y-2.5">
                <div class="relative">
                  <input
                    v-model.number="promoForm.discount_val"
                    @input="emit('sync-discount')"
                    type="number"
                    min="1"
                    :max="promoForm.discount_mode === 'percent' ? 100 : 99999"
                    :placeholder="promoForm.discount_mode === 'percent' ? 'ระบุตัวเลข % เช่น 20, 30, 50' : 'ระบุจำนวนเงิน เช่น 30, 50, 100'"
                    class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-2xl pl-4 pr-16 py-3 text-sm font-black text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                  />
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-pink-500">
                    {{ promoForm.discount_mode === 'percent' ? '%' : 'บาท' }}
                  </span>
                </div>

                <!-- Quick Presets -->
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                  <span class="text-[11px] text-slate-400 font-bold mr-1">ลัด:</span>
                  <template v-if="promoForm.discount_mode === 'percent'">
                    <button
                      v-for="pct in [5, 10, 15, 20, 25, 30, 50, 70]"
                      :key="pct"
                      type="button"
                      @click="promoForm.discount_val = pct; emit('sync-discount')"
                      :class="promoForm.discount_val === pct ? 'bg-pink-500 text-white font-black' : 'bg-white dark:bg-[#181818] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#26282c]'"
                      class="px-2.5 py-1 rounded-xl text-xs font-bold transition hover:border-pink-400 cursor-pointer"
                    >
                      {{ pct }}%
                    </button>
                  </template>
                  <template v-else>
                    <button
                      v-for="amt in [20, 30, 50, 100, 200, 500]"
                      :key="amt"
                      type="button"
                      @click="promoForm.discount_val = amt; emit('sync-discount')"
                      :class="promoForm.discount_val === amt ? 'bg-pink-500 text-white font-black' : 'bg-white dark:bg-[#181818] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#26282c]'"
                      class="px-2.5 py-1 rounded-xl text-xs font-bold transition hover:border-pink-400 cursor-pointer"
                    >
                      ฿{{ amt }}
                    </button>
                  </template>
                </div>
              </div>

              <!-- Custom Text Input -->
              <div class="pt-3 border-t border-slate-200/60 dark:border-[#26282c] space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-slate-500 dark:text-slate-400">ข้อความบนป้ายโปรโมชั่น (แก้ไขได้)</label>
                  <span class="text-xs font-black text-pink-500 bg-pink-50 dark:bg-pink-950/40 px-2.5 py-0.5 rounded-lg border border-pink-200/50">
                    {{ promoForm.discount_text || '-' }}
                  </span>
                </div>
                <input
                  v-model="promoForm.discount_text"
                  type="text"
                  class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                />
              </div>
            </div>

          </div>
        </div>

        <!-- Action Buttons Footer -->
        <div class="flex justify-end items-center gap-3 pt-4 border-t border-slate-200 dark:border-[#26282c]">
          <button
            type="button"
            @click="close"
            class="px-6 py-3 bg-slate-100 dark:bg-[#222] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Icon name="lucide:x" class="w-4 h-4" />
            <span>ยกเลิก</span>
          </button>
          <button
            type="submit"
            :disabled="actionLoading"
            class="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl transition shadow-xl shadow-pink-600/30 disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            <Icon v-if="!actionLoading" name="lucide:check" class="w-4 h-4" />
            <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{{ actionLoading ? 'กำลังบันทึก...' : isPromoEdit ? 'บันทึกการแก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่นใหม่' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Media Library Modal Integration -->
    <AdminMediaLibraryModal
      v-model="showMediaModal"
      title="เลือกรูปภาพโปรโมชั่น"
      @select="handleSelectFromLibrary"
    />
  </div>
</template>
