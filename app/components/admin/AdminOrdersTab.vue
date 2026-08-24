<script setup lang="ts">
import { ref } from 'vue'
import type { Order } from '~/types/admin'
import { formatAddress } from '~/utils/formatAddress'

defineProps<{
  orders: Order[]
}>()

const emit = defineEmits<{
  (e: 'change-status', id: number, status: string): void
  (e: 'delete-order', id: number): void
  (e: 'clear-orders', statusTarget: string): void
  (e: 'approve-order', id: number): void
  (e: 'reject-order', id: number): void
  (e: 'preview-image', url: string): void
}>()

const expandedOrder = ref<number | null>(null)
const deleteStatusTarget = ref('all')

const orderStatuses = [
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'processing', label: 'กำลังเตรียมสินค้า' },
  { value: 'shipping', label: 'กำลังจัดส่ง' },
  { value: 'completed', label: 'จัดส่งสำเร็จ' },
  { value: 'cancelled', label: 'ยกเลิก' },
]

const clearOrderOptions = [
  { value: 'all', label: 'ลบทุกสถานะ' },
  { value: 'completed', label: 'ลบเฉพาะ: จัดส่งสำเร็จ' },
  { value: 'cancelled', label: 'ลบเฉพาะ: ยกเลิก' },
  { value: 'pending', label: 'ลบเฉพาะ: รอดำเนินการ' },
  { value: 'pending_payment', label: 'ลบเฉพาะ: รอชำระเงิน' },
]

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    pending_payment: 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400',
    processing: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    shipping: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    completed: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    cancelled: 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400',
  }
  return map[status] || 'bg-slate-100 text-slate-600'
}

function statusText(status: string) {
  const map: Record<string, string> = {
    pending: 'รอดำเนินการ',
    pending_payment: 'รอตรวจสอบสลิป',
    processing: 'กำลังเตรียมสินค้า',
    shipping: 'กำลังจัดส่ง',
    completed: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
  }
  return map[status] || status
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header Controls -->
    <div v-if="orders.length > 0" class="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl px-5 py-3 shadow-sm">
      <span class="text-xs font-bold text-slate-500 dark:text-slate-400">คำสั่งซื้อทั้งหมด ({{ orders.length }} รายการ)</span>
      <div class="flex items-center gap-2">
        <select v-model="deleteStatusTarget" class="bg-slate-100 dark:bg-[#191919] text-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs font-bold border border-slate-200 dark:border-[#212327] cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500">
          <option v-for="opt in clearOrderOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button @click="emit('clear-orders', deleteStatusTarget)" class="bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-red-500/20 cursor-pointer">
          <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
          <span>ลบคำสั่งซื้อ</span>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="orders.length === 0" class="bg-white dark:bg-[#191919] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#212327]">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-3 text-slate-400">
        <Icon name="lucide:inbox" class="w-7 h-7" />
      </div>
      <p class="text-slate-500 font-bold text-sm">ยังไม่มีคำสั่งซื้อ</p>
    </div>

    <!-- Order Cards -->
    <div
      v-for="order in orders"
      :key="order.id"
      class="bg-white dark:bg-[#191919] border rounded-3xl overflow-hidden shadow-sm transition"
      :class="(order as any).status === 'pending_payment' ? 'border-orange-200 dark:border-orange-800' : 'border-slate-200 dark:border-[#212327]'"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-slate-50/50 dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-[#212327]">
        <div class="flex items-center gap-4">
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase">ออเดอร์</p>
            <p class="font-black text-slate-800 dark:text-white text-sm">#{{ order.id }}</p>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase">ลูกค้า</p>
            <p class="font-bold text-slate-700 dark:text-slate-200 text-xs">{{ order.user_name }}</p>
            <p class="text-[10px] text-slate-400">{{ order.user_email }}</p>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-bold uppercase">วันที่</p>
            <p class="text-xs text-slate-600 dark:text-slate-300 font-medium">{{ formatDate(order.created_at) }}</p>
          </div>
          <!-- QR Payment Badge -->
          <div v-if="(order as any).payment_method === 'qr'" class="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl px-2 py-1">
            <Icon name="lucide:qr-code" class="w-3 h-3" />
            <span class="text-[9px] font-black">QR</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span :class="statusBadge(order.status)" class="text-[10px] font-black px-3 py-1 rounded-full">{{ statusText(order.status) }}</span>
          
          <!-- Status select for non-QR pending orders -->
          <select
            v-if="(order as any).status !== 'pending_payment'"
            :value="order.status"
            @change="(e) => emit('change-status', order.id, (e.target as HTMLSelectElement).value)"
            class="bg-slate-100 dark:bg-[#191919] text-slate-800 dark:text-white rounded-xl px-3 py-1.5 text-xs font-bold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="s in orderStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>

          <!-- QR pending: Approve/Reject buttons -->
          <div v-else class="flex items-center gap-2">
            <button @click="emit('approve-order', order.id)" class="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer">
              <Icon name="lucide:check" class="w-3 h-3" />อนุมัติ
            </button>
            <button @click="emit('reject-order', order.id)" class="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer">
              <Icon name="lucide:x" class="w-3 h-3" />ปฏิเสธ
            </button>
          </div>

          <button @click="expandedOrder = expandedOrder === order.id ? null : order.id" class="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer">
            <Icon :name="expandedOrder === order.id ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-3.5 h-3.5" />
            <span>{{ expandedOrder === order.id ? 'ซ่อน' : 'ดูสินค้า' }}</span>
          </button>

          <button @click="emit('delete-order', order.id)" title="ลบคำสั่งซื้อ" class="p-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition border border-red-200 dark:border-red-900/50 flex items-center justify-center cursor-pointer">
            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Expanded Order Items -->
      <div v-if="expandedOrder === order.id" class="px-5 py-4 space-y-4">
        <!-- Slip image for QR orders -->
        <div v-if="(order as any).payment_method === 'qr' && (order as any).slip_image" class="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-2xl p-4 space-y-2">
          <p class="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
            <Icon name="lucide:image" class="w-3 h-3" /> สลิปการโอนเงิน
          </p>
          <button type="button" @click="emit('preview-image', (order as any).slip_image)" class="block cursor-zoom-in">
            <img :src="(order as any).slip_image" alt="slip" class="max-h-48 rounded-xl object-contain border border-orange-200 dark:border-orange-800 hover:opacity-90 transition" />
          </button>
          <p class="text-[10px] text-slate-400">คลิกรูปเพื่อดูขนาดเต็ม</p>
        </div>

        <!-- Shipping Address Details -->
        <div v-if="(order as any).shipping_name" class="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl p-4 space-y-2 text-xs">
          <p class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <Icon name="lucide:truck" class="w-3.5 h-3.5" /> ข้อมูลที่อยู่จัดส่งสินค้า
          </p>
          <div class="space-y-1 text-slate-700 dark:text-slate-200">
            <p><strong>ชื่อผู้รับ:</strong> {{ (order as any).shipping_name }}</p>
            <p><strong>เบอร์โทรศัพท์:</strong> {{ (order as any).shipping_phone }}</p>
            <p><strong>ที่อยู่จัดส่ง:</strong> {{ formatAddress((order as any).shipping_address) }}</p>
          </div>
        </div>

        <!-- Items Breakdown -->
        <div class="divide-y divide-slate-200 dark:divide-slate-800">
          <div v-for="item in order.items" :key="item.product_id" class="py-2 flex justify-between text-xs">
            <span class="font-bold text-slate-700 dark:text-slate-200">{{ item.product_name }} × {{ item.quantity }}</span>
            <span class="font-black text-slate-800 dark:text-white">฿{{ item.product_price * item.quantity }}</span>
          </div>
          <div class="pt-3 flex justify-between text-sm">
            <span class="font-bold text-slate-500">รวมทั้งสิ้น</span>
            <span class="font-black text-blue-600 dark:text-blue-400">฿{{ order.total_price }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
