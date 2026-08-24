<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SizeOption } from '~/types/admin'

const props = defineProps<{
  modelValue: boolean
  isEditMode: boolean
  form: {
    name: string
    price: number
    original_price: number
    status: string
    tag: string
    imagesText: string
    description: string
    detailsText: string
    category: string
    stock: number
  }
  selectedSizes: SizeOption[]
  actionLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit'): void
  (e: 'sync-sizes'): void
  (e: 'add-size', size: SizeOption): void
  (e: 'remove-size', index: number): void
  (e: 'update-images', images: string[]): void
}>()

const toast = useToast()
const imageInputMode = ref<'link' | 'local'>('link')
const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

const newSizeName = ref('')
const newSizeStock = ref<number>(1)

const productImages = computed({
  get() {
    return props.form.imagesText ? props.form.imagesText.split(',').map(s => s.trim()).filter(Boolean) : []
  },
  set(val: string[]) {
    emit('update-images', val)
  }
})

function close() {
  emit('update:modelValue', false)
}

function handleAddSize() {
  const name = newSizeName.value.trim().toUpperCase()
  if (!name) return
  const stock = Number(newSizeStock.value) || 0
  emit('add-size', { name, stock })
  newSizeName.value = ''
  newSizeStock.value = 1
}

async function handleImageUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  isUploading.value = true
  const formData = new FormData()
  for (let i = 0; i < target.files.length; i++) {
    formData.append('files', target.files[i] as File)
  }

  try {
    const res = await $fetch<{ success: boolean; urls: string[] }>('/api/admin/upload', {
      method: 'POST',
      body: formData
    })
    if (res.success && res.urls.length > 0) {
      productImages.value = [...productImages.value, ...res.urls]
      toast.success('อัปโหลดสำเร็จ!', `อัปโหลดรูปภาพ ${res.urls.length} รูปเรียบร้อย`)
    }
  } catch (err: any) {
    toast.error('เกิดข้อผิดพลาด', err.data?.statusMessage || err.message)
  } finally {
    isUploading.value = false
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

function removeProductImage(index: number) {
  productImages.value = productImages.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
    <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl w-full max-w-3xl sm:max-w-4xl shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto space-y-6 my-auto">
      
      <!-- Modal Header -->
      <div class="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-[#212327]">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Icon :name="isEditMode ? 'lucide:file-edit' : 'lucide:plus-circle'" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">{{ isEditMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</h2>
            <p class="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">กรอกข้อมูลรายละเอียดสินค้าเพื่อแสดงในร้านค้า</p>
          </div>
        </div>
        <button @click="close" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition p-1 cursor-pointer">
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="emit('submit')" class="space-y-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <!-- Product Name -->
        <div class="space-y-2">
          <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">ชื่อสินค้า *</label>
          <input v-model="form.name" type="text" placeholder="ระบุชื่อสินค้า..." class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
        </div>

        <!-- Price & Original Price Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div class="space-y-2">
            <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">ราคาขาย (฿) *</label>
            <input v-model="form.price" type="number" placeholder="0" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">ราคาป้าย/ราคาเดิม (฿)</label>
            <input v-model="form.original_price" type="number" placeholder="0" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
          </div>
        </div>

        <!-- Tag, Category, Stock Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div class="space-y-2">
            <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">Tag แท็กสินค้า</label>
            <input v-model="form.tag" type="text" placeholder="Hot, New, Sale" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">หมวดหมู่</label>
            <select v-model="form.category" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm">
              <option>STREETWEAR</option>
              <option>MINIMAL</option>
              <option>KOREAN</option>
              <option>VINTAGE</option>
              <option>ACCESSORIES</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
              จำนวนสต็อกรวม *
              <span v-if="selectedSizes.length > 0" class="text-[11px] text-blue-500 font-semibold block">(คำนวณจากยอดรวมทุกไซส์)</span>
            </label>
            <input v-model="form.stock" type="number" min="0" :readonly="selectedSizes.length > 0" placeholder="0" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" :class="selectedSizes.length > 0 ? 'bg-slate-100 dark:bg-[#191919] cursor-not-allowed opacity-90' : ''" />
          </div>
        </div>

        <!-- Size / Option Tag Input with Individual Stock -->
        <div class="space-y-4 p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0a0a0a] border border-slate-200/80 dark:border-[#212327]">
          <div>
            <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
              ตัวเลือกสินค้า / ไซส์ พร้อมสต็อกแต่ละไซส์
            </label>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              กำหนดจำนวนสต็อกแยกตามแต่ละไซส์ได้ เช่น Size S มี 2 ชิ้น, Size M มี 1 ชิ้น
            </p>
          </div>
          
          <!-- Size items list with inline stock editor -->
          <div v-if="selectedSizes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="(item, idx) in selectedSizes" :key="idx"
              class="flex items-center justify-between gap-2 p-3 bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl shadow-sm"
            >
              <div class="flex items-center gap-2">
                <span class="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm flex-shrink-0">
                  {{ item.name }}
                </span>
                <div>
                  <label class="text-[10px] font-bold text-slate-400 block uppercase">สต็อกไซส์นี้</label>
                  <div class="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      v-model.number="item.stock"
                      @input="emit('sync-sizes')"
                      class="w-16 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-lg px-2 py-1 text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                    />
                    <span class="text-[10px] font-bold text-slate-400">ชิ้น</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="emit('remove-size', idx)"
                class="w-7 h-7 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-500 transition cursor-pointer flex-shrink-0"
                title="ลบไซส์นี้"
              >
                <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Add new size row -->
          <div class="flex flex-col sm:flex-row gap-2.5 items-end pt-1">
            <div class="flex-1 w-full">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">ชื่อไซส์ / ตัวเลือก</label>
              <input
                v-model="newSizeName"
                type="text"
                placeholder="เช่น S, M, L, XL, FreeSize"
                @keydown.enter.prevent="handleAddSize"
                class="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div class="w-full sm:w-32">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">จำนวนสต็อก</label>
              <input
                v-model.number="newSizeStock"
                type="number"
                min="0"
                placeholder="1"
                @keydown.enter.prevent="handleAddSize"
                class="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-center"
              />
            </div>
            <button
              type="button"
              @click="handleAddSize"
              class="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl transition shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Icon name="lucide:plus" class="w-4 h-4" />
              เพิ่มไซส์นี้
            </button>
          </div>

          <p v-if="selectedSizes.length === 0" class="text-xs text-slate-400 flex items-center gap-1">
            <span>(หากไม่เพิ่มไซส์</span> ระบบจะใช้จำนวนสต็อกรวมด้านบน และลูกค้าไม่ต้องเลือกไซส์ก่อนซื้อ)
          </p>
        </div>

        <!-- Product Images Section -->
        <div class="space-y-3 p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0a0a0a] border border-slate-200/80 dark:border-[#212327]">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">รูปภาพสินค้า</label>
            <!-- Toggle Tab -->
            <div class="flex bg-slate-200/70 dark:bg-[#0a0a0a] p-1 rounded-xl border border-slate-200 dark:border-[#212327] text-xs">
              <button type="button" @click="imageInputMode = 'link'" :class="imageInputMode === 'link' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'" class="px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer">
                <Icon name="lucide:link" class="w-4 h-4" /> ลิงก์รูปภาพ
              </button>
              <button type="button" @click="imageInputMode = 'local'" :class="imageInputMode === 'local' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'" class="px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer">
                <Icon name="lucide:upload" class="w-4 h-4" /> อัปโหลดจากเครื่อง
              </button>
            </div>
          </div>

          <!-- Mode 1: Link Mode -->
          <div v-show="imageInputMode === 'link'">
            <textarea v-model="form.imagesText" placeholder="วางลิงก์รูปภาพ คั่นด้วยเครื่องหมายจุลภาค ( , )" rows="2" class="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-xs sm:text-sm text-slate-800 dark:text-white resize-none" />
          </div>

          <!-- Mode 2: Local Upload Mode -->
          <div v-show="imageInputMode === 'local'" class="space-y-4">
            <!-- Drag and drop zone -->
            <div @click="fileInputRef?.click()" class="border-2 border-dashed border-slate-300 dark:border-[#212327] hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2">
              <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500">
                <Icon name="lucide:image-plus" class="w-6 h-6" />
              </div>
              <div>
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300 block">คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่</span>
                <span class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">รองรับ PNG, JPG, JPEG, WEBP, GIF</span>
              </div>
              <input ref="fileInputRef" type="file" multiple accept="image/*" class="hidden" @change="handleImageUpload" />
            </div>

            <!-- Uploading indicator -->
            <div v-if="isUploading" class="flex items-center justify-center gap-2 py-3 text-blue-500 text-xs sm:text-sm font-bold bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>กำลังอัปโหลดรูปภาพ...</span>
            </div>

            <!-- Image previews -->
            <div v-if="productImages.length > 0" class="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <div v-for="(img, idx) in productImages" :key="idx" class="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] shadow-sm">
                <img :src="img" class="w-full h-full object-cover" />
                <button type="button" @click="removeProductImage(idx)" class="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl opacity-0 group-hover:opacity-100 transition shadow-lg cursor-pointer">
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div v-else class="text-center py-3 text-xs text-slate-400 dark:text-slate-500 italic">
              ยังไม่มีรูปภาพสินค้า
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">คำอธิบายสินค้า</label>
          <textarea v-model="form.description" rows="3" placeholder="ระบุรายละเอียด หรือคำอธิบายเพิ่มเติมเกี่ยวกับสินค้า..." class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none shadow-sm" />
        </div>

        <!-- Details Text -->
        <div class="space-y-2">
          <label class="block text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">รายละเอียดเพิ่มเติม <span class="font-normal text-slate-400 text-xs sm:text-sm">(1 บรรทัด = 1 ส่วน)</span></label>
          <textarea v-model="form.detailsText" rows="4" placeholder="เช่น&#10;เนื้อผ้า: คอตตอน 100%&#10;ทรง: โอเวอร์ไซส์&#10;น้ำหนัก: 250g" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none shadow-sm" />
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end items-center gap-3 pt-4 border-t border-slate-200 dark:border-[#212327]">
          <button type="button" @click="close" class="px-6 py-3 bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-2xl transition cursor-pointer flex items-center gap-1.5">
            <Icon name="lucide:x" class="w-4 h-4" />
            <span>ยกเลิก</span>
          </button>
          <button type="submit" :disabled="actionLoading" class="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl transition flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-60 cursor-pointer">
            <Icon v-if="!actionLoading" name="lucide:check" class="w-4 h-4" />
            <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{{ isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
