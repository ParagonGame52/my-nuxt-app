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
const showMediaModal = ref(false)
const mediaTarget = ref<'cover' | number>('cover')
const chestImageMode = ref<'library' | 'upload' | 'link'>('library')
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

function openMediaFor(target: 'cover' | number) {
  mediaTarget.value = target
  showMediaModal.value = true
}

function handleSelectFromLibrary(url: string | string[]) {
  const singleUrl = Array.isArray(url) ? url[0] || '' : url
  if (!singleUrl) return

  if (mediaTarget.value === 'cover') {
    props.chestForm.image = singleUrl
    toast.success('เลือกรูปแล้ว!', 'เปลี่ยนรูปภาพหน้าปกตู้สุ่มเรียบร้อย')
  } else if (typeof mediaTarget.value === 'number') {
    if (props.chestItems[mediaTarget.value]) {
      props.chestItems[mediaTarget.value]!.image = singleUrl
      toast.success('เลือกรูปแล้ว!', 'เปลี่ยนรูปภาพของรางวัลเรียบร้อย')
    }
  }
}

async function handleChestImageUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  isChestUploading.value = true
  const formData = new FormData()
  formData.append('files', target.files[0] as File)

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
  formData.append('files', target.files[0] as File)

  try {
    const res = await $fetch<{ success: boolean; urls: string[] }>('/api/admin/upload', {
      method: 'POST',
      body: formData
    })
    if (res.success && res.urls.length > 0) {
      if (props.chestItems[index]) {
        props.chestItems[index]!.image = res.urls[0]!
        toast.success('อัปโหลดสำเร็จ!', 'อัปโหลดรูปภาพของรางวัลเรียบร้อย')
      }
    }
  } catch (err: any) {
    toast.error('เกิดข้อผิดพลาด', err.data?.statusMessage || err.message)
  }
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
    <!-- Large, Spacious Modal Container -->
    <div class="bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#26282c] rounded-3xl w-full max-w-5xl lg:max-w-6xl shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto space-y-6 my-auto">
      
      <!-- Modal Header -->
      <div class="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-[#26282c]">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Icon :name="isChestEdit ? 'lucide:dices' : 'lucide:box'" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
              {{ isChestEdit ? 'แก้ไขกล่องสุ่ม / ตู้สุ่ม' : 'สร้างกล่องสุ่ม / ตู้สุ่มใหม่' }}
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              กำหนดราคาต่อครั้ง รายละเอียดหน้าปก และรายการของรางวัลพร้อมอัตราสุ่ม
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
        
        <!-- TOP SECTION: 2 COLUMNS (Chest Info vs Cover Image) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left Column: Chest Details -->
          <div class="lg:col-span-7 space-y-4">
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <!-- Name -->
              <div class="sm:col-span-2 space-y-1.5">
                <label class="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">ชื่อกล่องสุ่ม / ตู้สุ่ม *</label>
                <input
                  v-model="chestForm.name"
                  type="text"
                  placeholder="เช่น Streetwear Mystery Chest #1"
                  class="w-full bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#26282c] rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition font-bold"
                />
              </div>

              <!-- Price -->
              <div class="space-y-1.5">
                <label class="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">ราคาต่อสุ่ม (฿) *</label>
                <div class="relative">
                  <input
                    v-model.number="chestForm.price"
                    type="number"
                    min="0"
                    placeholder="99"
                    class="w-full bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#26282c] rounded-2xl pl-4 pr-10 py-3 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                  <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-purple-500">บาท</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="space-y-1.5">
              <label class="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">คำอธิบาย / กติกาของตู้สุ่ม *</label>
              <textarea
                v-model="chestForm.description"
                rows="3"
                placeholder="อธิบายของรางวัลและเงื่อนไขการสุ่มสำหรับผู้เล่น..."
                class="w-full bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#26282c] rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none leading-relaxed"
              />
            </div>

            <!-- Active Status Toggle -->
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0d0d0d] rounded-2xl border border-slate-200 dark:border-[#26282c]">
              <div class="space-y-0.5">
                <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">สถานะเปิดให้บริการตู้สุ่ม</p>
                <p class="text-xs text-slate-400 dark:text-slate-500">เปิดเพื่อให้ลูกค้ามองเห็นและเล่นสุ่มตู้สุ่มนี้ได้</p>
              </div>
              <button
                type="button"
                @click="chestForm.is_active = chestForm.is_active ? 0 : 1"
                :class="chestForm.is_active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'bg-slate-200 dark:bg-[#222] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#26282c]'"
                class="px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <span :class="chestForm.is_active ? 'bg-white animate-pulse' : 'bg-slate-400'" class="w-2.5 h-2.5 rounded-full inline-block"></span>
                <span>{{ chestForm.is_active ? 'เปิดสุ่มอยู่ (Active)' : 'ปิดสุ่ม (Inactive)' }}</span>
              </button>
            </div>
          </div>

          <!-- Right Column: Cover Image Section -->
          <div class="lg:col-span-5 space-y-3 p-4 sm:p-5 bg-slate-50 dark:bg-[#0d0d0d] rounded-2xl border border-slate-200 dark:border-[#26282c]">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <label class="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">รูปภาพหน้าปกตู้สุ่ม</label>
              <!-- Switcher -->
              <div class="flex bg-slate-200/70 dark:bg-[#181818] p-0.5 rounded-xl border border-slate-200 dark:border-[#26282c] text-[11px]">
                <button
                  type="button"
                  @click="chestImageMode = 'library'"
                  :class="chestImageMode === 'library' ? 'bg-purple-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                  class="px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="lucide:image" class="w-3 h-3" />
                  <span>คลังภาพ</span>
                </button>
                <button
                  type="button"
                  @click="chestImageMode = 'upload'"
                  :class="chestImageMode === 'upload' ? 'bg-purple-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                  class="px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="lucide:upload" class="w-3 h-3" />
                  <span>อัปโหลด</span>
                </button>
                <button
                  type="button"
                  @click="chestImageMode = 'link'"
                  :class="chestImageMode === 'link' ? 'bg-purple-600 text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 font-bold'"
                  class="px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="lucide:link" class="w-3 h-3" />
                  <span>URL</span>
                </button>
              </div>
            </div>

            <!-- Mode 1: Library Mode -->
            <div v-show="chestImageMode === 'library'" class="space-y-2">
              <button
                type="button"
                @click="openMediaFor('cover')"
                class="w-full py-3.5 px-4 bg-white dark:bg-[#181818] hover:bg-purple-50 dark:hover:bg-purple-950/30 border-2 border-dashed border-purple-300 dark:border-purple-900/60 hover:border-purple-500 rounded-2xl text-purple-600 dark:text-purple-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Icon name="lucide:folder-open" class="w-4 h-4" />
                <span>เปิดคลังรูปภาพหน้าปกตู้สุ่ม</span>
              </button>
            </div>

            <!-- Mode 2: Upload Mode -->
            <div v-show="chestImageMode === 'upload'" class="space-y-2">
              <div
                @click="chestFileInputRef?.click()"
                class="border-2 border-dashed border-slate-300 dark:border-[#26282c] hover:border-purple-500 bg-white dark:bg-[#181818] rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
              >
                <Icon name="lucide:upload-cloud" class="w-7 h-7 text-purple-500" />
                <span class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง</span>
                <span class="text-[10px] text-slate-400">รองรับ PNG, JPG, JPEG, WEBP, GIF</span>
                <input ref="chestFileInputRef" type="file" accept="image/*" class="hidden" @change="handleChestImageUpload" />
              </div>
              <div v-if="isChestUploading" class="flex items-center justify-center gap-2 py-1.5 text-purple-500 text-xs font-bold">
                <div class="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span>กำลังอัปโหลดรูปภาพ...</span>
              </div>
            </div>

            <!-- Mode 3: Link URL Mode -->
            <div v-show="chestImageMode === 'link'" class="space-y-1">
              <div class="flex gap-2">
                <input
                  v-model="chestForm.image"
                  type="text"
                  placeholder="https://..."
                  class="flex-1 bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
                <button
                  type="button"
                  @click="openMediaFor('cover')"
                  class="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40 rounded-xl transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="lucide:image" class="w-3.5 h-3.5" />
                  <span>คลัง</span>
                </button>
              </div>
            </div>

            <!-- Large Cover Preview -->
            <div
              v-if="chestForm.image"
              class="relative group rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] shadow-md h-40 sm:h-44"
            >
              <img :src="chestForm.image" alt="cover preview" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 backdrop-blur-xs">
                <button
                  type="button"
                  @click="openMediaFor('cover')"
                  class="px-3.5 py-2 bg-white text-slate-900 text-xs font-black rounded-xl shadow-lg transition hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" />
                  <span>เปลี่ยนรูป</span>
                </button>
                <button
                  type="button"
                  @click="chestForm.image = ''"
                  class="px-3.5 py-2 bg-rose-600 text-white text-xs font-black rounded-xl shadow-lg transition hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                  <span>ลบรูป</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTTOM SECTION: PRIZE ITEMS BUILDER -->
        <div class="space-y-4 pt-4 border-t border-slate-200 dark:border-[#26282c]">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#0d0d0d] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#26282c]">
            <div>
              <div class="flex items-center gap-2.5">
                <h3 class="text-base sm:text-lg font-black text-slate-800 dark:text-white">รายการของรางวัลในตู้สุ่มนี้</h3>
                <span class="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {{ chestItems.length }} รายการ
                </span>
              </div>
              <p class="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                กำหนดชื่อ ระดับ (SSR/Rare), มูลค่า, น้ำหนักโอกาสออก (Odds) และจำนวนสต็อก
              </p>
            </div>
            
            <button
              type="button"
              @click="emit('add-item')"
              class="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Icon name="lucide:plus" class="w-4 h-4" />
              <span>+ เพิ่มของรางวัลใหม่</span>
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="chestItems.length === 0" class="border-2 border-dashed border-slate-200 dark:border-[#26282c] rounded-3xl p-10 text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center mx-auto">
              <Icon name="lucide:package-open" class="w-7 h-7" />
            </div>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">ยังไม่มีรายการของรางวัลในตู้สุ่มนี้</p>
            <button
              type="button"
              @click="emit('add-item')"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition cursor-pointer"
            >
              + คลิกเพื่อเพิ่มของรางวัลแรก
            </button>
          </div>

          <!-- Items list -->
          <div v-else class="space-y-4 max-h-[480px] overflow-y-auto pr-1.5">
            <div
              v-for="(item, idx) in chestItems"
              :key="idx"
              class="bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#26282c] hover:border-purple-300 dark:hover:border-purple-900/50 rounded-2xl p-4 sm:p-5 space-y-4 transition shadow-xs"
            >
              <!-- Card Header -->
              <div class="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-[#202020]">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-xl bg-purple-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                    #{{ idx + 1 }}
                  </span>
                  <span class="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate max-w-xs sm:max-w-md">
                    {{ item.name || 'ยังไม่ระบุชื่อรางวัล' }}
                  </span>
                  <!-- Calculated Chance Badge -->
                  <span class="text-xs font-black px-2.5 py-0.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                    🔥 โอกาส {{ getItemChance(item.odds) }}
                  </span>
                </div>

                <button
                  type="button"
                  @click="emit('remove-item', idx)"
                  class="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                  <span>ลบรางวัลนี้</span>
                </button>
              </div>

              <!-- Content Row: Image + Main Inputs -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                
                <!-- Item Image Box -->
                <div class="sm:col-span-3 flex flex-col items-center justify-center gap-2">
                  <div
                    class="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] shadow-xs flex-shrink-0 flex items-center justify-center"
                  >
                    <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" />
                    <div v-else class="text-slate-400 text-center p-2">
                      <Icon name="lucide:image" class="w-8 h-8 mx-auto opacity-50" />
                      <span class="text-[10px] block mt-1">ยังไม่มีรูป</span>
                    </div>

                    <!-- Overlay hover controls -->
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5">
                      <button
                        type="button"
                        @click="openMediaFor(idx)"
                        class="px-2.5 py-1 bg-white text-slate-900 text-[10px] font-black rounded-lg shadow cursor-pointer flex items-center gap-1 hover:scale-105 transition"
                      >
                        <Icon name="lucide:folder-open" class="w-3 h-3" />
                        <span>คลังภาพ</span>
                      </button>
                    </div>
                  </div>

                  <!-- Image Quick Action Links -->
                  <div class="flex items-center gap-2 text-[11px] font-bold">
                    <button
                      type="button"
                      @click="openMediaFor(idx)"
                      class="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Icon name="lucide:image" class="w-3 h-3" />
                      <span>เลือกจากคลัง</span>
                    </button>
                    <span class="text-slate-300">|</span>
                    <label class="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      อัปโหลด
                      <input type="file" accept="image/*" class="hidden" @change="handleItemImageUpload($event, idx)" />
                    </label>
                  </div>
                </div>

                <!-- Item Text & Odds Inputs -->
                <div class="sm:col-span-9 space-y-3">
                  <!-- Row 1: Name & Image URL -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อของรางวัล *</label>
                      <input
                        v-model="item.name"
                        type="text"
                        placeholder="เช่น เสื้อยืดลาย Limited หรือ หมวกแก๊ป"
                        class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                    </div>
                    <div class="space-y-1">
                      <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">ลิงก์รูปภาพ (URL)</label>
                      <input
                        v-model="item.image"
                        type="text"
                        placeholder="https://..."
                        class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                    </div>
                  </div>

                  <!-- Row 2: Tier, Estimated Price, Odds, Stock -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <!-- Tier -->
                    <div class="space-y-1">
                      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400">ระดับ (Tier / Tag)</label>
                      <input
                        v-model="item.tier"
                        type="text"
                        placeholder="SSR, Rare, Normal"
                        class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3 py-2 text-xs font-black text-slate-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                    </div>

                    <!-- Price -->
                    <div class="space-y-1">
                      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400">มูลค่าโดยประมาณ (฿)</label>
                      <input
                        v-model.number="item.price"
                        type="number"
                        min="0"
                        placeholder="290"
                        class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                    </div>

                    <!-- Odds Weight -->
                    <div class="space-y-1">
                      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400">น้ำหนัก (Odds)</label>
                      <input
                        v-model.number="item.odds"
                        type="number"
                        min="1"
                        max="9999"
                        placeholder="100"
                        class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3 py-2 text-xs font-black text-pink-600 dark:text-pink-400 text-center focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                      />
                    </div>

                    <!-- Stock -->
                    <div class="space-y-1">
                      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        สต็อก ({{ item.stock === null || item.stock === undefined ? '∞' : item.stock }})
                      </label>
                      <input
                        :value="item.stock === null || item.stock === undefined ? '' : item.stock"
                        @input="(e: any) => { const v = e.target.value; item.stock = v === '' ? null : Number(v) }"
                        type="number"
                        min="0"
                        placeholder="ไม่จำกัด (∞)"
                        class="w-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#26282c] rounded-xl px-3 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>

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
            class="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl transition shadow-xl shadow-purple-600/30 disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            <Icon v-if="!actionLoading" name="lucide:check" class="w-4 h-4" />
            <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{{ actionLoading ? 'กำลังบันทึก...' : isChestEdit ? 'บันทึกการแก้ไขตู้สุ่ม' : 'สร้างตู้สุ่มใหม่' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Media Library Modal Integration -->
    <AdminMediaLibraryModal
      v-model="showMediaModal"
      title="เลือกรูปภาพตู้สุ่ม / ของรางวัล"
      @select="handleSelectFromLibrary"
    />
  </div>
</template>
