<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { Ticket } from '~/types/admin'

const props = defineProps<{
  tickets: Ticket[]
  selectedTicket: Ticket | null
  messages: any[]
  loading: boolean
  sending: boolean
}>()

const emit = defineEmits<{
  (e: 'select-ticket', ticket: Ticket): void
  (e: 'send-message', payload: { message: string; file: File | null }): void
  (e: 'preview-image', url: string): void
}>()

const chatInput = ref('')
const chatFileInputRef = ref<HTMLInputElement | null>(null)
const chatImageFile = ref<File | null>(null)
const chatImagePreview = ref<string>('')
const chatBottomRef = ref<HTMLElement | null>(null)

watch(() => props.messages, async () => {
  await nextTick()
  chatBottomRef.value?.scrollIntoView({ behavior: 'smooth' })
}, { deep: true })

function getTicketCategoryIcon(cat: string) {
  const map: Record<string, string> = {
    'การชำระเงิน': 'lucide:credit-card',
    'การถอนเงิน': 'lucide:banknote',
    'สินค้าชำรุด': 'lucide:package',
    'ระบบขัดข้อง': 'lucide:settings',
    'การจัดส่ง': 'lucide:truck',
    'อื่นๆ': 'lucide:message-circle'
  }
  return map[cat] || 'lucide:message-circle'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function onImageSelected(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  if (file) {
    chatImageFile.value = file
    chatImagePreview.value = URL.createObjectURL(file)
  }
}

function removeImage() {
  chatImageFile.value = null
  chatImagePreview.value = ''
  if (chatFileInputRef.value) chatFileInputRef.value.value = ''
}

function handleSend() {
  const msg = chatInput.value.trim()
  if ((!msg && !chatImageFile.value) || props.sending || !props.selectedTicket) return
  emit('send-message', { message: msg, file: chatImageFile.value })
  chatInput.value = ''
  removeImage()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="bg-white dark:bg-[#191919] rounded-3xl border border-slate-200 dark:border-[#212327] overflow-hidden shadow-sm" style="height: calc(100vh - 260px); min-height: 500px;">
    <div class="flex h-full">

      <!-- Sidebar -->
      <div class="w-72 flex-shrink-0 border-r border-slate-200 dark:border-[#212327] flex flex-col">
        <div class="px-4 py-3 border-b border-slate-200 dark:border-[#212327]">
          <p class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">การสนทนาทั้งหมด ({{ tickets.length }})</p>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="tickets.length === 0" class="text-center py-12">
            <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-2 text-slate-400">
              <Icon name="lucide:inbox" class="w-5 h-5" />
            </div>
            <p class="text-xs text-slate-400 font-bold">ยังไม่มีการแจ้งปัญหา</p>
          </div>
          <button
            v-for="ticket in tickets"
            :key="ticket.id"
            @click="emit('select-ticket', ticket)"
            :class="[
              'w-full text-left px-4 py-3.5 border-b border-slate-200 dark:border-[#212327] transition-all duration-150 cursor-pointer',
              selectedTicket?.id === ticket.id
                ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500'
                : 'hover:bg-slate-50 dark:hover:bg-[#212327]/40 border-l-4 border-l-transparent'
            ]"
          >
            <div class="flex items-start gap-2">
              <Icon :name="getTicketCategoryIcon(ticket.category)" class="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-1">
                  <span :class="ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'" class="text-[9px] font-black px-1.5 py-0.5 rounded-md">
                    {{ ticket.status === "resolved" ? "ตอบแล้ว" : "รอดำเนินการ" }}
                  </span>
                  <span class="text-[9px] text-slate-400 font-bold">{{ ticket.category }}</span>
                </div>
                <p class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{{ ticket.title }}</p>
                <p class="text-[10px] text-slate-400 truncate mt-0.5">{{ ticket.user_name }}</p>
                <p class="text-[9px] text-slate-400 mt-0.5">{{ formatDate(ticket.created_at) }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Chat Window -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Empty State -->
        <div v-if="!selectedTicket" class="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Icon name="lucide:message-square" class="w-7 h-7" />
          </div>
          <p class="font-black text-slate-600 dark:text-slate-300 text-sm">เลือกการสนทนา</p>
          <p class="text-xs text-slate-400 mt-1">เพื่อดูและตอบกลับลูกค้า</p>
        </div>

        <template v-else>
          <!-- Chat Header -->
          <div class="px-5 py-3 border-b border-slate-200 dark:border-[#212327] bg-white dark:bg-[#191919] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Icon :name="getTicketCategoryIcon(selectedTicket.category)" class="w-4 h-4" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{{ selectedTicket.title }}</p>
              <p class="text-[10px] text-slate-400">{{ selectedTicket.user_name }} · {{ selectedTicket.user_email }} · <span class="font-bold text-blue-500">{{ selectedTicket.category }}</span></p>
            </div>
            <span :class="selectedTicket.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'" class="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0">
              {{ selectedTicket.status === "resolved" ? "ตอบแล้ว" : "รอตอบ" }}
            </span>
          </div>

          <!-- Messages Body -->
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50 dark:bg-[#0a0a0a]/30">
            <div v-if="loading" class="flex justify-center py-10">
              <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="['flex', msg.sender === 'admin' ? 'justify-end' : 'justify-start']"
            >
              <div v-if="msg.sender === 'user'" class="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-black mr-2 mt-auto flex-shrink-0">U</div>
              <div :class="['flex flex-col gap-1', msg.sender === 'admin' ? 'items-end' : 'items-start']" style="max-width:70%">
                <p v-if="msg.sender === 'user'" class="text-[10px] font-black text-orange-500 px-1">{{ selectedTicket.user_name }}</p>

                <!-- Image Bubble (if any) -->
                <div
                  v-if="msg.image_url"
                  @click="emit('preview-image', msg.image_url)"
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
                    msg.sender === 'admin'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-[#191919] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#212327] rounded-bl-sm shadow-sm'
                  ]"
                >
                  {{ msg.message }}
                </div>
                <p class="text-[9px] text-slate-400 px-1">{{ new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) }}</p>
              </div>
              <div v-if="msg.sender === 'admin'" class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black ml-2 mt-auto flex-shrink-0">A</div>
            </div>
            <div ref="chatBottomRef" />
          </div>

          <!-- Input Controls -->
          <div class="px-4 py-3 border-t border-slate-200 dark:border-[#212327] bg-white dark:bg-[#191919]">
            <!-- Admin Image preview -->
            <div v-if="chatImagePreview" class="mb-2 p-2 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-center gap-3">
              <div class="relative w-12 h-12 rounded-lg overflow-hidden border border-blue-300 dark:border-blue-800/60 bg-black/5 flex-shrink-0">
                <img :src="chatImagePreview" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{{ chatImageFile?.name || 'แนบรูปภาพแล้ว' }}</p>
                <p class="text-[10px] text-blue-600 dark:text-blue-400">พร้อมส่งรูปภาพ</p>
              </div>
              <button @click="removeImage" class="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-[#191919] dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs transition cursor-pointer">
                <Icon name="lucide:x" class="w-3.5 h-3.5" />
              </button>
            </div>

            <div class="flex items-end gap-2">
              <!-- Attach Image Button -->
              <input ref="chatFileInputRef" type="file" accept="image/*" class="hidden" @change="onImageSelected" />
              <button
                type="button"
                @click="chatFileInputRef?.click()"
                title="แนบรูปภาพ"
                class="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-all duration-200 flex-shrink-0 cursor-pointer"
              >
                <Icon name="lucide:image" class="w-4 h-4" />
              </button>

              <textarea
                v-model="chatInput"
                @keydown="onKeydown"
                placeholder="ตอบกลับลูกค้า... (Enter ส่ง)"
                rows="1"
                class="flex-1 bg-slate-50 dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none transition"
                style="max-height:100px;overflow-y:auto"
              />
              <button
                @click="handleSend"
                :disabled="(!chatInput.trim() && !chatImageFile) || sending"
                :class="[
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 cursor-pointer',
                  (chatInput.trim() || chatImageFile) && !sending ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25' : 'bg-slate-100 dark:bg-[#191919] text-slate-400 cursor-not-allowed'
                ]"
              >
                <div v-if="sending" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <Icon v-else name="lucide:send" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[9px] text-slate-400 mt-1.5 px-1 flex items-center gap-1">
              <Icon name="lucide:refresh-cw" class="w-2.5 h-2.5 animate-spin" />
              <span>รีเฟรชอัตโนมัติทุก 3 วินาที</span>
            </p>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>
