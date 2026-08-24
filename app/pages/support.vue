<script setup lang="ts">
definePageMeta({ middleware: "auth" })

import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
const toast = useToast()

const authStore = useAuthStore()
const router = useRouter()

// ─── State ─────────────────────────────────────────
const tickets = ref<any[]>([])
const selectedTicket = ref<any>(null)
const messages = ref<any[]>([])
const loadingTickets = ref(false)
const loadingMessages = ref(false)
const sending = ref(false)
const newMessage = ref('')
const showNewTicketModal = ref(false)
const submittingTicket = ref(false)
const chatBottom = ref<HTMLElement | null>(null)
const pollingTimer = ref<any>(null)

// Chat Image State
const chatFileInputRef = ref<HTMLInputElement | null>(null)
const chatImageFile = ref<File | null>(null)
const chatImagePreview = ref<string>('')

// Modal Image State
const modalFileInputRef = ref<HTMLInputElement | null>(null)
const modalImageFile = ref<File | null>(null)
const modalImagePreview = ref<string>('')

// Lightbox Preview State
const previewModalImage = ref<string | null>(null)

const form = ref({ title: '', category: 'การชำระเงิน', message: '', image_url: '' })
const categories = ['การชำระเงิน', 'การถอนเงิน', 'สินค้าชำรุด', 'ระบบขัดข้อง', 'การจัดส่ง', 'อื่นๆ']

// ─── Computed ──────────────────────────────────────
const sortedTickets = computed(() =>
  [...tickets.value].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
)

// ─── Image Helpers ─────────────────────────────────
function onChatImageSelected(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (file) {
    chatImageFile.value = file
    chatImagePreview.value = URL.createObjectURL(file)
  }
}

function removeChatImage() {
  chatImageFile.value = null
  chatImagePreview.value = ''
  if (chatFileInputRef.value) chatFileInputRef.value.value = ''
}

function onModalImageSelected(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (file) {
    modalImageFile.value = file
    modalImagePreview.value = URL.createObjectURL(file)
  }
}

function removeModalImage() {
  modalImageFile.value = null
  modalImagePreview.value = ''
  if (modalFileInputRef.value) modalFileInputRef.value.value = ''
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await $fetch<{ success: boolean; urls: string[] }>('/api/upload', {
    method: 'POST',
    body: formData
  })
  if (res.success && res.urls.length > 0) {
    return res.urls[0]!
  }
  throw new Error('อัปโหลดรูปภาพไม่สำเร็จ')
}

// ─── Load tickets ──────────────────────────────────
async function loadTickets() {
  if (!authStore.isLoggedIn) return
  loadingTickets.value = true
  try {
    const data = await $fetch('/api/tickets') as any
    tickets.value = data.tickets || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingTickets.value = false
  }
}

// ─── Select ticket & load messages ────────────────
async function selectTicket(ticket: any) {
  selectedTicket.value = ticket
  await loadMessages()
  startPolling()
}

async function loadMessages(silent = false) {
  if (!selectedTicket.value) return
  if (!silent) loadingMessages.value = true
  try {
    const data = await $fetch(`/api/tickets/${selectedTicket.value.id}/messages`) as any
    messages.value = data.messages || []
    selectedTicket.value = data.ticket || selectedTicket.value
    await scrollToBottom()
  } catch (e) {
    console.error(e)
  } finally {
    loadingMessages.value = false
  }
}

// ─── Polling ────────────────────────────────────────
function startPolling() {
  stopPolling()
  pollingTimer.value = setInterval(() => loadMessages(true), 3000)
}
function stopPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

// ─── Send message ───────────────────────────────────
async function sendMessage() {
  const msg = newMessage.value.trim()
  if ((!msg && !chatImageFile.value) || !selectedTicket.value || sending.value) return
  sending.value = true

  let imageUrl: string | null = null
  const localPreview = chatImagePreview.value

  try {
    if (chatImageFile.value) {
      imageUrl = await uploadFile(chatImageFile.value)
    }

    const optimistic = {
      id: Date.now(),
      sender: 'user',
      message: msg,
      image_url: imageUrl || localPreview || null,
      created_at: new Date().toISOString()
    }
    messages.value.push(optimistic)
    newMessage.value = ''
    removeChatImage()
    await scrollToBottom()

    await $fetch(`/api/tickets/${selectedTicket.value.id}/messages`, {
      method: 'POST',
      body: { message: msg, image_url: imageUrl }
    })
    await loadMessages(true)
    await loadTickets()
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message || 'ส่งข้อความไม่สำเร็จ')
  } finally {
    sending.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ─── New ticket ─────────────────────────────────────
async function submitNewTicket() {
  if (!form.value.title || (!form.value.message && !modalImageFile.value)) {
    toast.warning('ข้อมูลไม่ครบ', 'กรุณากรอกหัวข้อและรายละเอียดหรือแนบรูปภาพ')
    return
  }
  submittingTicket.value = true
  try {
    let uploadedImageUrl: string | null = null
    if (modalImageFile.value) {
      uploadedImageUrl = await uploadFile(modalImageFile.value)
    }

    await $fetch('/api/tickets', {
      method: 'POST',
      body: {
        title: form.value.title,
        category: form.value.category,
        message: form.value.message,
        image_url: uploadedImageUrl
      }
    })

    form.value = { title: '', category: 'การชำระเงิน', message: '', image_url: '' }
    removeModalImage()
    showNewTicketModal.value = false
    toast.success('สร้างรายการแจ้งปัญหาสำเร็จ!', 'เจ้าหน้าที่จะตอบกลับโดยเร็วที่สุด')
    await loadTickets()
    // เลือก ticket ใหม่ที่เพิ่งสร้าง
    if (sortedTickets.value.length > 0) {
      await selectTicket(sortedTickets.value[0])
    }
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message || 'ไม่สามารถสร้างการสนทนาได้')
  } finally {
    submittingTicket.value = false
  }
}

// ─── Helpers ────────────────────────────────────────
async function scrollToBottom() {
  await nextTick()
  chatBottom.value?.scrollIntoView({ behavior: 'smooth' })
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function categoryIcon(cat: string) {
  const map: any = {
    'การชำระเงิน': 'lucide:credit-card',
    'การถอนเงิน': 'lucide:banknote',
    'สินค้าชำรุด': 'lucide:package',
    'ระบบขัดข้อง': 'lucide:settings',
    'การจัดส่ง': 'lucide:truck',
    'อื่นๆ': 'lucide:message-circle'
  }
  return map[cat] || 'lucide:message-circle'
}
function statusBadge(status: string) {
  return status === 'resolved'
    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
}

onMounted(() => {
  if (!authStore.isLoggedIn) { router.push('/login?redirect=/support'); return }
  loadTickets()
})
onUnmounted(() => stopPolling())
</script>

<template>
  <div class="min-h-screen transition-colors duration-300">
    <div class="max-w-6xl mx-auto px-4 py-8">

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <span class="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-orange-200 dark:border-orange-800/50">Help Center</span>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight flex items-center gap-2">
            <Icon name="lucide:message-circle" class="w-6 h-6 text-orange-500" />
            <span>แจ้งปัญหา</span>
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">แชทโดยตรงกับทีมงาน ตอบกลับภายใน 15 นาที</p>
        </div>
        <button
          v-if="authStore.isLoggedIn"
          @click="showNewTicketModal = true"
          class="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>สนทนาใหม่</span>
        </button>
      </div>

      <!-- Not logged in -->
      <div v-if="!authStore.isLoggedIn" class="bg-white dark:bg-[#191919] rounded-3xl p-14 text-center shadow-sm border border-slate-200 dark:border-[#212327]">
        <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Icon name="lucide:lock" class="w-8 h-8" />
        </div>
        <p class="text-slate-500 dark:text-slate-400 font-bold">กรุณาเข้าสู่ระบบก่อน</p>
        <NuxtLink to="/login?redirect=/support" class="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl text-sm transition">
          <Icon name="lucide:log-in" class="w-4 h-4" />
          <span>เข้าสู่ระบบ</span>
        </NuxtLink>
      </div>

      <!-- Chat Layout -->
      <div v-else class="bg-white dark:bg-[#191919] rounded-3xl shadow-sm border border-slate-200 dark:border-[#212327] overflow-hidden" style="height: calc(100vh - 220px); min-height: 520px;">
        <div class="flex h-full">

          <!-- ─── Sidebar: ticket list ─────────────────── -->
          <div class="w-72 flex-shrink-0 border-r border-slate-200 dark:border-[#212327] flex flex-col">
            <div class="p-4 border-b border-slate-200 dark:border-[#212327]">
              <p class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">การสนทนา ({{ tickets.length }})</p>
            </div>

            <div class="flex-1 overflow-y-auto">
              <div v-if="loadingTickets" class="flex justify-center py-10">
                <div class="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>

              <div v-else-if="tickets.length === 0" class="text-center py-12 px-4">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Icon name="lucide:inbox" class="w-6 h-6" />
                </div>
                <p class="text-xs text-slate-400 dark:text-slate-500 font-bold">ยังไม่มีการสนทนา</p>
                <button @click="showNewTicketModal = true" class="mt-3 text-xs text-orange-500 font-black hover:underline flex items-center gap-1 mx-auto">
                  <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                  <span>เริ่มสนทนาใหม่</span>
                </button>
              </div>

              <button
                v-for="ticket in sortedTickets"
                :key="ticket.id"
                @click="selectTicket(ticket)"
                :class="[
                  'w-full text-left px-4 py-3.5 border-b border-slate-200 dark:border-[#212327] transition-all duration-150',
                  selectedTicket?.id === ticket.id
                    ? 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-l-orange-500'
                    : 'hover:bg-slate-50 dark:hover:bg-[#212327]/40 border-l-4 border-l-transparent'
                ]"
              >
                <div class="flex items-start gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon :name="categoryIcon(ticket.category)" class="w-4 h-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{{ ticket.title }}</p>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{{ ticket.message }}</p>
                    <div class="flex items-center gap-2 mt-1.5">
                      <span :class="statusBadge(ticket.status)" class="text-[9px] font-black px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Icon v-if="ticket.status === 'resolved'" name="lucide:check-circle-2" class="w-2.5 h-2.5" />
                        <Icon v-else name="lucide:clock" class="w-2.5 h-2.5" />
                        <span>{{ ticket.status === 'resolved' ? 'ตอบแล้ว' : 'รอตอบ' }}</span>
                      </span>
                      <span class="text-[9px] text-slate-400 dark:text-slate-500">{{ formatDate(ticket.updated_at || ticket.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- ─── Chat Window ───────────────────────────── -->
          <div class="flex-1 flex flex-col min-w-0">

            <!-- Empty state -->
            <div v-if="!selectedTicket" class="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div class="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center mb-4 text-orange-500">
                <Icon name="lucide:message-square" class="w-8 h-8" />
              </div>
              <p class="font-black text-slate-700 dark:text-slate-200">เลือกการสนทนา</p>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">หรือเริ่มสนทนาใหม่กับทีมงาน</p>
              <button @click="showNewTicketModal = true" class="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2 rounded-xl transition">
                + สนทนาใหม่
              </button>
            </div>

            <template v-else>
              <!-- Chat header -->
              <div class="px-5 py-3.5 border-b border-slate-200 dark:border-[#212327] flex items-center gap-3 bg-white dark:bg-[#191919]">
                <div class="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                  <Icon :name="categoryIcon(selectedTicket.category)" class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{{ selectedTicket.title }}</p>
                  <p class="text-[10px] text-slate-400 dark:text-slate-500">{{ selectedTicket.category }}</p>
                </div>
                <span :class="statusBadge(selectedTicket.status)" class="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 inline-flex items-center gap-1">
                  <Icon v-if="selectedTicket.status === 'resolved'" name="lucide:check-circle-2" class="w-3 h-3" />
                  <Icon v-else name="lucide:clock" class="w-3 h-3" />
                  <span>{{ selectedTicket.status === 'resolved' ? 'ตอบแล้ว' : 'รอตอบ' }}</span>
                </span>
              </div>

              <!-- Messages area -->
              <div class="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50 dark:bg-[#0a0a0a]/30">
                <div v-if="loadingMessages" class="flex justify-center py-10">
                  <div class="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>

                <div v-else-if="messages.length === 0" class="text-center py-10">
                  <p class="text-xs text-slate-400 dark:text-slate-500">ยังไม่มีข้อความ</p>
                </div>

                <template v-else>
                  <div
                    v-for="msg in messages"
                    :key="msg.id"
                    :class="['flex', msg.sender === 'user' ? 'justify-end' : 'justify-start']"
                  >
                    <!-- Admin avatar -->
                    <div v-if="msg.sender === 'admin'" class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black mr-2 mt-auto flex-shrink-0">A</div>

                    <!-- Message Bubble -->
                    <div :class="['max-w-[70%]', msg.sender === 'user' ? 'items-end' : 'items-start', 'flex flex-col gap-1']">
                      <p v-if="msg.sender === 'admin'" class="text-[10px] font-black text-blue-600 dark:text-blue-400 px-1">ทีมงาน DIP & DRIP</p>
                      
                      <!-- Image Bubble (if any) -->
                      <div
                        v-if="msg.image_url"
                        @click="previewModalImage = msg.image_url"
                        class="rounded-2xl overflow-hidden cursor-pointer group relative border border-slate-200/60 dark:border-[#212327] shadow-sm bg-slate-100 dark:bg-[#191919] transition transform hover:scale-[1.01]"
                      >
                        <img :src="msg.image_url" alt="แนบรูปภาพ" class="max-w-[260px] sm:max-w-xs max-h-64 object-cover" />
                        <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <span class="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
                            <Icon name="lucide:zoom-in" class="w-3.5 h-3.5" /> ดูรูปขนาดเต็ม
                          </span>
                        </div>
                      </div>

                      <!-- Text Bubble (if any) -->
                      <div
                        v-if="msg.message"
                        :class="[
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
                          msg.sender === 'user'
                            ? 'bg-orange-500 text-white rounded-br-sm'
                            : 'bg-white dark:bg-[#191919] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#212327] rounded-bl-sm shadow-sm'
                        ]"
                      >
                        {{ msg.message }}
                      </div>
                      <p class="text-[9px] text-slate-400 dark:text-slate-500 px-1">{{ formatTime(msg.created_at) }}</p>
                    </div>

                    <!-- User avatar -->
                    <div v-if="msg.sender === 'user'" class="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-black ml-2 mt-auto flex-shrink-0">
                      {{ authStore.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
                    </div>
                  </div>
                </template>

                <div ref="chatBottom" />
              </div>

              <!-- Input bar -->
              <div class="px-4 py-3 border-t border-slate-200 dark:border-[#212327] bg-white dark:bg-[#191919]">
                <!-- Image attachment preview -->
                <div v-if="chatImagePreview" class="mb-2 p-2 bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl flex items-center gap-3">
                  <div class="relative w-12 h-12 rounded-lg overflow-hidden border border-orange-300 dark:border-orange-800/60 bg-black/5 flex-shrink-0">
                    <img :src="chatImagePreview" class="w-full h-full object-cover" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{{ chatImageFile?.name || 'แนบรูปภาพแล้ว' }}</p>
                    <p class="text-[10px] text-orange-600 dark:text-orange-400">พร้อมส่งรูปภาพ</p>
                  </div>
                  <button @click="removeChatImage" class="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-[#191919] dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs transition">
                    <Icon name="lucide:x" class="w-3 h-3" />
                  </button>
                </div>

                <div class="flex items-end gap-2">
                  <!-- Image Upload Button -->
                  <input ref="chatFileInputRef" type="file" accept="image/*" class="hidden" @change="onChatImageSelected" />
                  <button
                    type="button"
                    @click="chatFileInputRef?.click()"
                    title="แนบรูปภาพ"
                    class="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-orange-500 transition-all duration-200 flex-shrink-0"
                  >
                    <Icon name="lucide:image" class="w-4 h-4" />
                  </button>

                  <textarea
                    v-model="newMessage"
                    @keydown="onKeydown"
                    placeholder="พิมพ์ข้อความ... (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
                    rows="1"
                    class="flex-1 bg-slate-50 dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none transition"
                    style="max-height: 120px; overflow-y: auto;"
                  />
                  <button
                    @click="sendMessage"
                    :disabled="(!newMessage.trim() && !chatImageFile) || sending"
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0',
                      (newMessage.trim() || chatImageFile) && !sending
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-slate-100 dark:bg-[#191919] text-slate-400 cursor-not-allowed'
                    ]"
                  >
                    <div v-if="sending" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <Icon v-else name="lucide:send" class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 px-1 flex items-center gap-1">
                  <Icon name="lucide:refresh-cw" class="w-2.5 h-2.5 animate-spin" />
                  <span>รีเฟรชอัตโนมัติทุก 3 วินาที</span>
                </p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── New Ticket Modal ──────────────────────────── -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showNewTicketModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showNewTicketModal = false">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showNewTicketModal = false" />
          <div class="relative w-full max-w-md bg-white dark:bg-[#191919] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#212327] overflow-hidden">
            <!-- Modal header -->
            <div class="bg-gradient-to-r from-orange-500 to-amber-500 px-6 pt-6 pb-8">
              <button @click="showNewTicketModal = false" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
              <p class="text-xs font-bold text-white/80 tracking-widest uppercase">Help Center</p>
              <h2 class="text-xl font-black text-white mt-1 flex items-center gap-2">
                <span>สร้างการสนทนาใหม่</span>
                <Icon name="lucide:message-circle" class="w-5 h-5" />
              </h2>
            </div>
            <!-- Modal body -->
            <div class="px-6 py-5 -mt-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">หมวดหมู่</label>
                <select v-model="form.category" class="w-full bg-slate-50 dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ categoryIcon(cat) }} {{ cat }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">หัวข้อ</label>
                <input v-model="form.title" type="text" placeholder="เช่น ชำระเงินแล้วแต่ยอดไม่เพิ่ม หรือแจ้งปัญหาถอนเงิน" class="w-full bg-slate-50 dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
              </div>
              <div>
                <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ข้อความแรก</label>
                <textarea v-model="form.message" rows="3" placeholder="อธิบายปัญหาของคุณ..." class="w-full bg-slate-50 dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition resize-none" />
              </div>

              <!-- Attach Image in Modal -->
              <div>
                <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">แนบรูปภาพ (ถ้ามี)</label>
                <input ref="modalFileInputRef" type="file" accept="image/*" class="hidden" @change="onModalImageSelected" />
                
                <div v-if="modalImagePreview" class="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-[#212327] bg-slate-50 dark:bg-[#191919] p-2">
                  <img :src="modalImagePreview" class="max-h-40 w-full object-contain rounded-xl" />
                  <button type="button" @click="removeModalImage" class="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xs transition">
                    <Icon name="lucide:x" class="w-4 h-4" />
                  </button>
                </div>
                <button
                  v-else
                  type="button"
                  @click="modalFileInputRef?.click()"
                  class="w-full border-2 border-dashed border-slate-200 dark:border-[#212327] hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl py-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-500 flex items-center justify-center gap-2 transition"
                >
                  <Icon name="lucide:image-plus" class="w-4 h-4" />
                  <span>คลิกเพื่อแนบรูปภาพประกอบ</span>
                </button>
              </div>

              <button @click="submitNewTicket" :disabled="submittingTicket" class="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl text-sm transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                <Icon v-if="submittingTicket" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                <template v-else>
                  <Icon name="lucide:send" class="w-4 h-4" />
                  <span>เริ่มการสนทนา</span>
                </template>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ─── Image Lightbox Modal ──────────────────────── -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="previewModalImage" class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" @click.self="previewModalImage = null">
          <button @click="previewModalImage = null" class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
          <img :src="previewModalImage" class="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
