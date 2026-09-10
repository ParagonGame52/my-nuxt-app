<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

export interface MediaItem {
  id: string
  url: string
  name: string
  source: 'uploaded' | 'products' | 'promotions' | 'gacha' | 'presets'
  size?: number
  createdAt?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    multiple?: boolean
    title?: string
  }>(),
  {
    multiple: false,
    title: 'คลังรูปภาพ (Media Library)'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'select', url: string | string[]): void
}>()

const toast = useToast()
const { confirm } = useConfirm()

const loading = ref(false)
const uploading = ref(false)
const mediaItems = ref<MediaItem[]>([])
const searchQuery = ref('')
const activeTab = ref<'all' | 'uploaded' | 'products' | 'promotions' | 'gacha' | 'presets'>('all')
const selectedUrls = ref<string[]>([])
const previewZoomUrl = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

async function fetchMedia() {
  loading.value = true
  try {
    const res = await $fetch<{ success: boolean; items: MediaItem[] }>('/api/admin/media')
    if (res.success && Array.isArray(res.items)) {
      mediaItems.value = res.items
    }
  } catch (err: any) {
    console.error('Failed to load media items:', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selectedUrls.value = []
      searchQuery.value = ''
      fetchMedia()
    }
  }
)

const filteredItems = computed(() => {
  return mediaItems.value.filter((item) => {
    // Filter by tab
    if (activeTab.value !== 'all' && item.source !== activeTab.value) {
      return false
    }
    // Filter by search
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return item.name.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
    }
    return true
  })
})

const tabCounts = computed(() => {
  const counts: Record<string, number> = {
    all: mediaItems.value.length,
    uploaded: 0,
    products: 0,
    promotions: 0,
    gacha: 0,
    presets: 0
  }
  for (const item of mediaItems.value) {
    const src = item.source
    if (src && counts[src] !== undefined) {
      counts[src] = (counts[src] || 0) + 1
    }
  }
  return counts
})

function close() {
  emit('update:modelValue', false)
}

function toggleSelect(item: MediaItem) {
  if (props.multiple) {
    const idx = selectedUrls.value.indexOf(item.url)
    if (idx >= 0) {
      selectedUrls.value.splice(idx, 1)
    } else {
      selectedUrls.value.push(item.url)
    }
  } else {
    emit('select', item.url)
    close()
  }
}

function isSelected(url: string) {
  return selectedUrls.value.includes(url)
}

function confirmMultipleSelect() {
  if (selectedUrls.value.length === 0) {
    toast.warning('ยังไม่ได้เลือกรูป', 'กรุณาคลิกเลือกรูปภาพอย่างน้อย 1 รูป')
    return
  }
  emit('select', [...selectedUrls.value])
  close()
}

async function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  uploading.value = true
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
      toast.success('อัปโหลดสำเร็จ!', `เพิ่มรูปภาพใหม่ ${res.urls.length} รูปลงในคลังแล้ว`)
      await fetchMedia()
      activeTab.value = 'uploaded'
      if (!props.multiple && res.urls[0]) {
        // Automatically select the newly uploaded single image
        emit('select', res.urls[0])
        close()
      } else if (props.multiple) {
        selectedUrls.value.push(...res.urls)
      }
    }
  } catch (err: any) {
    toast.error('อัปโหลดล้มเหลว', err.data?.statusMessage || err.message || 'ไม่สามารถอัปโหลดไฟล์ได้')
  } finally {
    uploading.value = false
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

async function deleteUploadedItem(item: MediaItem, event: Event) {
  event.stopPropagation()
  const filename = item.url.replace('/uploads/', '')
  const ok = await confirm({
    title: 'ลบรูปภาพนี้ออกจากคลัง?',
    message: `คุณกำลังจะลบไฟล์ "${item.name}" ออกจากเซิร์ฟเวอร์อย่างถาวร`,
    confirmText: 'ลบรูปนี้',
    type: 'danger'
  })
  if (!ok) return

  try {
    await $fetch(`/api/admin/media/${encodeURIComponent(filename)}`, { method: 'DELETE' })
    toast.success('ลบรูปภาพแล้ว!')
    mediaItems.value = mediaItems.value.filter((m) => m.id !== item.id)
    selectedUrls.value = selectedUrls.value.filter((u) => u !== item.url)
  } catch (err: any) {
    toast.error('ลบไม่สำเร็จ', err.data?.statusMessage || err.message)
  }
}

function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getSourceLabel(source: string) {
  switch (source) {
    case 'uploaded':
      return 'อัปโหลด'
    case 'products':
      return 'สินค้า'
    case 'promotions':
      return 'โปรโมชั่น'
    case 'gacha':
      return 'ตู้สุ่ม'
    case 'presets':
      return 'แม่แบบ'
    default:
      return source
  }
}

function getSourceBadgeClass(source: string) {
  switch (source) {
    case 'uploaded':
      return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    case 'products':
      return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
    case 'promotions':
      return 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30'
    case 'gacha':
      return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
    case 'presets':
      return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md"
      @click.self="close"
    >
      <div
        class="bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#26282c] rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all duration-200"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4.5 border-b border-slate-200 dark:border-[#26282c] flex items-center justify-between flex-shrink-0 bg-slate-50/50 dark:bg-[#181818]/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Icon name="lucide:image" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base sm:text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>{{ title }}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#26282c] text-slate-600 dark:text-slate-300">
                  {{ mediaItems.length }} รูป
                </span>
              </h2>
              <p class="text-xs text-slate-400 dark:text-slate-500">
                {{ multiple ? 'คลิกเลือกรูปภาพที่ต้องการ (เลือกได้หลายรูป)' : 'คลิกที่รูปภาพเพื่อเลือกใช้งานทันที' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Upload trigger button -->
            <button
              type="button"
              @click="fileInputRef?.click()"
              :disabled="uploading"
              class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Icon v-if="!uploading" name="lucide:upload-cloud" class="w-4 h-4" />
              <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span class="hidden sm:inline">{{ uploading ? 'กำลังอัปโหลด...' : '+ อัปโหลดรูปเข้าคลัง' }}</span>
              <span class="sm:hidden">{{ uploading ? '...' : '+ อัปโหลด' }}</span>
            </button>
            <input
              ref="fileInputRef"
              type="file"
              multiple
              accept="image/*"
              class="hidden"
              @change="handleFileUpload"
            />

            <!-- Close button -->
            <button
              type="button"
              @click="close"
              class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#222] hover:bg-slate-200 dark:hover:bg-[#2c2c2c] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Controls Bar: Search & Tabs -->
        <div class="p-4 border-b border-slate-200 dark:border-[#26282c] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between flex-shrink-0 bg-slate-50/30 dark:bg-[#121212]/30">
          <!-- Filter Tabs -->
          <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              v-for="tab in [
                { id: 'all', label: 'ทั้งหมด', icon: 'lucide:grid' },
                { id: 'uploaded', label: 'อัปโหลดแล้ว', icon: 'lucide:hard-drive' },
                { id: 'products', label: 'สินค้า', icon: 'lucide:package' },
                { id: 'promotions', label: 'โปรโมชั่น', icon: 'lucide:gift' },
                { id: 'gacha', label: 'ตู้สุ่ม', icon: 'lucide:dice-5' },
                { id: 'presets', label: 'รูปแม่แบบ', icon: 'lucide:sparkles' }
              ]"
              :key="tab.id"
              type="button"
              @click="activeTab = tab.id as any"
              :class="activeTab === tab.id
                ? 'bg-indigo-600 text-white font-black shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-[#222] font-semibold'"
              class="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Icon :name="tab.icon" class="w-3.5 h-3.5" />
              <span>{{ tab.label }}</span>
              <span
                class="text-[10px] px-1.5 py-0.2 rounded-full"
                :class="activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-[#26282c] text-slate-500 dark:text-slate-400'"
              >
                {{ tabCounts[tab.id] || 0 }}
              </span>
            </button>
          </div>

          <!-- Search Input -->
          <div class="relative sm:w-64 flex-shrink-0">
            <Icon name="lucide:search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหารูปภาพ..."
              class="w-full bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#2a2c30] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <Icon name="lucide:x" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Media Grid Area -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[300px]">
          <!-- Loading state -->
          <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            <div
              v-for="i in 10"
              :key="i"
              class="aspect-square rounded-2xl bg-slate-100 dark:bg-[#1a1a1a] animate-pulse border border-slate-200/50 dark:border-[#222]"
            />
          </div>

          <!-- Empty state -->
          <div
            v-else-if="filteredItems.length === 0"
            class="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3"
          >
            <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#1e1e1e] flex items-center justify-center text-slate-400">
              <Icon name="lucide:image-off" class="w-7 h-7" />
            </div>
            <div>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300">ไม่พบรูปภาพในหมวดหมู่นี้</p>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {{ searchQuery ? 'ลองค้นหาด้วยคำอื่น หรือกดอัปโหลดรูปภาพใหม่' : 'กดปุ่ม "+ อัปโหลดรูปเข้าคลัง" ด้านบนเพื่อเพิ่มรูปแรก' }}
              </p>
            </div>
            <button
              type="button"
              @click="fileInputRef?.click()"
              class="mt-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition border border-indigo-200 dark:border-indigo-800/60 cursor-pointer"
            >
              + อัปโหลดรูปภาพใหม่
            </button>
          </div>

          <!-- Image Grid -->
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              @click="toggleSelect(item)"
              class="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#181818] border transition duration-200 cursor-pointer select-none"
              :class="isSelected(item.url)
                ? 'ring-3 ring-indigo-500 border-transparent shadow-lg shadow-indigo-500/20'
                : 'border-slate-200 dark:border-[#26282c] hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-md'"
            >
              <!-- Thumbnail Image -->
              <img
                :src="item.url"
                :alt="item.name"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />

              <!-- Source Tag -->
              <span
                class="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-md border backdrop-blur-md shadow-sm"
                :class="getSourceBadgeClass(item.source)"
              >
                {{ getSourceLabel(item.source) }}
              </span>

              <!-- Selection Checkmark / Circle -->
              <div
                class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
                :class="isSelected(item.url)
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-black/40 text-transparent group-hover:text-white/70 group-hover:bg-black/60'"
              >
                <Icon name="lucide:check" class="w-3.5 h-3.5" />
              </div>

              <!-- Bottom Info Gradient Overlay -->
              <div class="absolute inset-x-0 bottom-0 p-2 pt-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-between opacity-90 group-hover:opacity-100 transition">
                <div class="min-w-0 flex-1 mr-1.5">
                  <p class="text-[11px] font-bold text-white truncate drop-shadow-sm">{{ item.name }}</p>
                  <p v-if="item.size" class="text-[9px] text-slate-300 font-medium drop-shadow-sm">
                    {{ formatFileSize(item.size) }}
                  </p>
                </div>

                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                  <!-- Zoom Lightbox Preview Button -->
                  <button
                    type="button"
                    @click.stop="previewZoomUrl = item.url"
                    title="ขยายรูปภาพ"
                    class="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer transition"
                  >
                    <Icon name="lucide:maximize-2" class="w-3 h-3" />
                  </button>

                  <!-- Delete button (for uploaded files only) -->
                  <button
                    v-if="item.source === 'uploaded'"
                    type="button"
                    @click="deleteUploadedItem(item, $event)"
                    title="ลบไฟล์นี้ออกจากระบบ"
                    class="w-6 h-6 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer transition"
                  >
                    <Icon name="lucide:trash-2" class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer / Action Bar for Multi-select -->
        <div class="px-6 py-3.5 border-t border-slate-200 dark:border-[#26282c] bg-slate-50 dark:bg-[#171717] flex items-center justify-between flex-shrink-0">
          <div class="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <template v-if="multiple">
              เลือกแล้ว: <span class="text-indigo-600 dark:text-indigo-400 font-black">{{ selectedUrls.length }}</span> รูป
            </template>
            <template v-else>
              คลิกรูปภาพเพื่อเลือก หรือกดปุ่ม "ยกเลิก" เพื่อปิด
            </template>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="close"
              class="px-4 py-2 bg-slate-200 dark:bg-[#26282c] hover:bg-slate-300 dark:hover:bg-[#303338] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              v-if="multiple"
              type="button"
              @click="confirmMultipleSelect"
              :disabled="selectedUrls.length === 0"
              class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Icon name="lucide:check" class="w-3.5 h-3.5" />
              <span>ยืนยันการเลือก ({{ selectedUrls.length }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Zoom Lightbox Modal -->
      <div
        v-if="previewZoomUrl"
        class="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        @click="previewZoomUrl = null"
      >
        <button
          @click="previewZoomUrl = null"
          class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
        <img
          :src="previewZoomUrl"
          class="max-w-full max-h-[88vh] rounded-2xl shadow-2xl object-contain"
          alt="preview"
        />
      </div>
    </div>
  </Teleport>
</template>
