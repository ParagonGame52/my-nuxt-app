<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GachaChestItem } from '~/types/admin'

const props = defineProps<{
  modelValue: boolean
  isChestEdit: boolean
  chestForm: {
    name: string
    price: number
    image: string
    description: string
    is_active: number
  }
  chestItems: GachaChestItem[]
  actionLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit'): void
  (e: 'add-item'): void
  (e: 'remove-item', idx: number): void
}>()

const toast = useToast()
const chestImageMode = ref<'link' | 'local'>('link')
const chestFileInputRef = ref<HTMLInputElement | null>(null)
const isChestUploading = ref(false)

const totalChestOdds = computed(() => props.chestItems.reduce((s, p) => s + (Number(p.odds) || 0), 0))

function getItemChance(odds: number) {
  if (!totalChestOdds.value) return '0%'
  return (Math.round(((Number(odds) || 0) / totalChestOdds.value) * 1000) / 10).toFixed(1) + '%'
}

function close() {
  emit('update:modelValue', false)
}

async function handleChestImageUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  isChestUploading.value = true
  const formData = new FormData()
  formData.append('file', target.files[0] as File)

  try {
    const res = await $fetch<{ success: boolean; urls: string[] }>('/api/admin/upload', {
      method: 'POST',
      body: formData
    })
    if (res.success && res.urls.length > 0) {
      props.chestForm.image = res.urls[0]!
      toast.success('อัปโหลดสำเร็จ!', 'อัปโหลดรูปตู้สุ่มเรียบร้อย')
    }
  } catch (err: any) {
    toast.error('เกิดข้อผิดพลาด', err.data?.statusMessage || err.message)
  } finally {
    isChestUploading.value = false
    if (chestFileInputRef.value) {
      chestFileInputRef.value.value = ''
    }
  }
}

async function handleItemImageUpload(e: Event, index: number) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const formData = new FormData()
  formData.append('file', target.files[0] as File)

  try {
    const res = await $fetch<{ success: boolean; urls: string[] }>('/api/admin/upload', {
      method: 'POST',
      body: formData
    })
    if (res.success && res.urls.length > 0) {
      if (props.chestItems[index]) {
        props.chestItems[index]!.image = res.urls[0]!
      }
    }
  } catch (err: any) {
    toast.error('เกิดข้อผิดพลาด', err.data?.statusMessage || err.message)
  }
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/75 backdrop-blur-md">
    <div class="flex min-h-full items-start justify-center p-4 sm:p-6 py-8">
      <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl w-full max-w-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative">
        
        <!-- Modal Header -->
        <div class="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-[#212327]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Icon :name="isChestEdit ? 'lucide:dices' : 'lucide:plus-circle'" class="w-5 h-5" />
            </div>
            <h2 class="text-xl font-black text-slate-800 dark:text-white">{{ isChestEdit ? 'แก้ไขตู้สุ่ม' : 'เพิ่มตู้สุ่มใหม่' }}</h2>
          </div>
          <button @click="close" class="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition p-1 cursor-pointer">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="emit('submit')" class="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <!-- Name -->
          <div class="space-y-1.5">
            <label class="block font-bold">ชื่อตู้สุ่ม *</label>
            <input v-model="chestForm.name" type="text" placeholder="เช่น ตู้สุ่มของขวัญแฟชั่นนำเข้า" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          <!-- Price -->
          <div class="space-y-1.5">
            <label class="block font-bold">ราคาต่อการสุ่ม (บาท) *</label>
            <input v-model="chestForm.price" type="number" min="0" placeholder="99" class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <label class="block font-bold">รายละเอียด/คำอธิบาย *</label>
            <textarea v-model="chestForm.description" rows="2" placeholder="อธิบายกติกาหรือของรางวัลในตู้นี้..." class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" />
          </div>

          <!-- Image Selection -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block font-bold">รูปภาพหน้าปกตู้สุ่ม</label>
              <!-- Toggle Tab -->
              <div class="flex bg-slate-100 dark:bg-[#0a0a0a] p-0.5 rounded-lg border border-slate-200/50 dark:border-[#212327] text-[9px]">
                <button type="button" @click="chestImageMode = 'link'" :class="chestImageMode === 'link' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'" class="px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer">
                  <Icon name="lucide:link" class="w-3 h-3" /> ลิงก์รูปภาพ
                </button>
                <button type="button" @click="chestImageMode = 'local'" :class="chestImageMode === 'local' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'" class="px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer">
                  <Icon name="lucide:upload" class="w-3 h-3" /> อัปโหลดจากเครื่อง
                </button>
              </div>
            </div>

            <!-- Mode 1: Link Mode -->
            <div v-show="chestImageMode === 'link'">
              <input v-model="chestForm.image" type="text" placeholder="https://..." class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>

            <!-- Mode 2: Local Upload Mode -->
            <div v-show="chestImageMode === 'local'" class="space-y-3">
              <div @click="chestFileInputRef?.click()" class="border-2 border-dashed border-slate-200 dark:border-[#212327] hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-[#0a0a0a] rounded-xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1">
                <Icon name="lucide:image-plus" class="w-6 h-6 text-slate-400 dark:text-slate-500" />
                <span class="text-[10px] font-bold text-slate-600 dark:text-slate-400">คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่</span>
                <input ref="chestFileInputRef" type="file" accept="image/*" class="hidden" @change="handleChestImageUpload" />
              </div>
              <!-- Uploading indicator -->
              <div v-if="isChestUploading" class="flex items-center justify-center gap-2 py-1 text-blue-500 text-[10px] font-bold">
                <div class="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>กำลังอัปโหลดรูปภาพ...</span>
              </div>
            </div>

            <!-- Image preview -->
            <div v-if="chestForm.image" class="mt-2 h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#191919] border border-slate-200 dark:border-[#212327]">
              <img :src="chestForm.image" alt="preview" class="w-full h-full object-cover" />
            </div>
          </div>

          <!-- Custom Prize Items Builder -->
          <div class="space-y-3 pt-2 border-t border-slate-200 dark:border-[#212327]">
            <div class="flex items-center justify-between">
              <div>
                <label class="block font-black text-slate-800 dark:text-white text-xs">รายการของรางวัลในตู้นี้ ({{ chestItems.length }} รายการ)</label>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">เพิ่มของรางวัลเฉพาะตู้สุ่มนี้โดยตรง ไม่เกี่ยวกับสินค้าในร้านค้า</p>
              </div>
              <button
                type="button"
                @click="emit('add-item')"
                class="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
              >
                <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                <span>เพิ่มของรางวัล</span>
              </button>
            </div>

            <!-- Empty state -->
            <div v-if="chestItems.length === 0" class="border border-dashed border-slate-200 dark:border-[#212327] rounded-2xl p-6 text-center">
              <p class="text-xs text-slate-400 font-bold">ยังไม่มีของรางวัลในตู้นี้</p>
              <button type="button" @click="emit('add-item')" class="mt-2 text-xs font-bold text-blue-500 hover:underline cursor-pointer">
                + คลิกเพื่อเพิ่มของรางวัลชิ้นแรก
              </button>
            </div>

            <!-- Items list -->
            <div v-else class="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div
                v-for="(item, idx) in chestItems"
                :key="idx"
                class="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-2xl p-3 space-y-2.5 relative"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">รางวัลที่ #{{ idx + 1 }}</span>
                    <!-- Image mini preview -->
                    <img v-if="item.image" :src="item.image" class="w-6 h-6 object-cover rounded-md border border-slate-200 dark:border-[#212327]" />
                  </div>
                  <button
                    type="button"
                    @click="emit('remove-item', idx)"
                    class="text-red-400 hover:text-red-600 transition text-[10px] font-bold flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-lg cursor-pointer"
                  >
                    <Icon name="lucide:trash-2" class="w-3 h-3" /> ลบรางวัลนี้
                  </button>
                </div>

                <!-- Inputs grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <!-- Item Name -->
                  <div class="space-y-1">
                    <span class="block font-bold text-slate-600 dark:text-slate-400 text-[10px]">ชื่อของรางวัล *</span>
                    <input
                      v-model="item.name"
                      type="text"
                      placeholder="เช่น เสื้อฮู้ดแขนยาวสีขาว"
                      class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <!-- Item Image URL / Upload -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="block font-bold text-slate-600 dark:text-slate-400 text-[10px]">รูปภาพของรางวัล</span>
                      <label class="text-[9px] font-bold text-blue-500 cursor-pointer hover:underline">
                        อัปโหลดรูป
                        <input type="file" accept="image/*" class="hidden" @change="handleItemImageUpload($event, idx)" />
                      </label>
                    </div>
                    <input
                      v-model="item.image"
                      type="text"
                      placeholder="https://..."
                      class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
                  <!-- Tier/Tag -->
                  <div class="space-y-1">
                    <span class="block font-bold text-slate-600 dark:text-slate-400 text-[10px]">ระดับ/แท็ก</span>
                    <input
                      v-model="item.tier"
                      type="text"
                      placeholder="Normal, SSR, Rare"
                      class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-2.5 py-1.5 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <!-- Estimated Price -->
                  <div class="space-y-1">
                    <span class="block font-bold text-slate-600 dark:text-slate-400 text-[10px]">มูลค่า (฿)</span>
                    <input
                      v-model.number="item.price"
                      type="number"
                      min="0"
                      placeholder="150"
                      class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-2.5 py-1.5 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <!-- Weight / Odds -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="block font-bold text-slate-600 dark:text-slate-400 text-[10px]">น้ำหนัก (Odds)</span>
                      <span class="text-[9px] font-black text-pink-500">{{ getItemChance(item.odds) }}</span>
                    </div>
                    <input
                      v-model.number="item.odds"
                      type="number"
                      min="1"
                      max="9999"
                      placeholder="100"
                      class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-2.5 py-1.5 font-black text-pink-600 dark:text-pink-400 text-center focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                    />
                  </div>

                  <!-- Stock / จำนวนจำกัด -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="block font-bold text-slate-600 dark:text-slate-400 text-[10px]">จำนวน (Stock)</span>
                      <span class="text-[9px] font-black text-emerald-500">{{ item.stock === null || item.stock === undefined ? '∞' : item.stock + ' ชิ้น' }}</span>
                    </div>
                    <input
                      :value="item.stock === null || item.stock === undefined ? '' : item.stock"
                      @input="(e: any) => { const v = e.target.value; item.stock = v === '' ? null : Number(v) }"
                      type="number"
                      min="0"
                      placeholder="ไม่จำกัด"
                      class="w-full bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-xl px-2.5 py-1.5 font-black text-emerald-600 dark:text-emerald-400 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
            <!-- Legend -->
            <p class="text-[9px] text-slate-400 dark:text-slate-500 font-medium px-1">
              โอกาสออกคำนวณจากสัดส่วน "น้ำหนัก" อัตโนมัติ (เช่น 10 : 90 = โอกาส 10% : 90%)
            </p>
          </div>

          <!-- Active toggle -->
          <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-[#212327]">
            <div class="space-y-0.5">
              <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">แสดงตู้สุ่มนี้</p>
              <p class="text-xs text-slate-400 dark:text-slate-500">ปิดเพื่อซ่อนตู้สุ่มนี้จากหน้าสุ่มสำหรับลูกค้า</p>
            </div>
            <button
              type="button"
              @click="chestForm.is_active = chestForm.is_active ? 0 : 1"
              :class="chestForm.is_active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-200 dark:bg-[#191919] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#212327]'"
              class="px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <span :class="chestForm.is_active ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'" class="w-2.5 h-2.5 rounded-full inline-block"></span>
              <span>{{ chestForm.is_active ? 'แสดงอยู่ (เปิด)' : 'ซ่อนอยู่ (ปิด)' }}</span>
            </button>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="close" class="px-5 py-2.5 bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer">
              <Icon name="lucide:x" class="w-4 h-4" />
              <span>ยกเลิก</span>
            </button>
            <button type="submit" :disabled="actionLoading" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-60 cursor-pointer">
              {{ actionLoading ? 'กำลังบันทึก...' : isChestEdit ? 'บันทึกการแก้ไข' : 'สร้างตู้สุ่ม' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
