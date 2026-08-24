<script setup lang="ts">
definePageMeta({ middleware: "auth" })

import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { formatAddress } from '~/utils/formatAddress'

const authStore = useAuthStore()
const router = useRouter()

const orders = ref<any[]>([])
const loading = ref(false)

onMounted(async () => {
  if (!authStore.isLoggedIn) return
  loading.value = true
  try {
    const data = await $fetch('/api/orders') as any
    orders.value = data.orders || []
  } catch (e: any) {
    console.error('Failed to load order history', e)
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusLabel(status: string) {
  const map: any = {
    pending: { text: 'รอดำเนินการ', cls: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' },
    pending_payment: { text: 'รอยืนยัน QR', cls: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400' },
    processing: { text: 'กำลังเตรียมสินค้า', cls: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400' },
    shipping: { text: 'กำลังจัดส่ง', cls: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400' },
    completed: { text: 'จัดส่งสำเร็จ', cls: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' },
    success: { text: 'ชำระเงินสำเร็จ', cls: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' },
    cancelled: { text: 'ยกเลิกแล้ว', cls: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400' },
  }
  return map[status] || { text: status, cls: 'bg-slate-100 text-slate-600' }
}

function printReceipt(order: any) {
  const itemRows = order.items.map((item: any) =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px">${item.product_name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px">×${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;font-size:13px">฿${(item.product_price * item.quantity).toLocaleString()}</td>
    </tr>`).join('')

  const receiptHtml = `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><title>ใบเสร็จรับเงิน #${order.id}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;max-width:480px;margin:40px auto;padding:0 20px;color:#1e293b}
  .logo{font-weight:900;font-size:22px;letter-spacing:-0.5px;color:#db2777}
  .divider{border:none;border-top:1px dashed #cbd5e1;margin:16px 0}
  table{width:100%;border-collapse:collapse}
  .total{font-size:18px;font-weight:900;color:#2563eb}
  .badge{display:inline-block;background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700}
  @media print{body{margin:0}}
</style></head>
<body>
  <div class="logo">DIP & DRIP</div>
  <p style="font-size:12px;color:#94a3b8;margin:4px 0 0">ใบเสร็จรับเงิน / Receipt</p>
  <hr class="divider">
  <p style="font-size:12px"><strong>เลขที่:</strong> #${order.id}</p>
  <p style="font-size:12px"><strong>วันที่:</strong> ${formatDate(order.created_at)}</p>
  <p style="font-size:12px"><strong>สถานะ:</strong> <span class="badge">จัดส่งสำเร็จ</span></p>
  <hr class="divider">
  <table>
    <thead><tr>
      <th style="text-align:left;font-size:11px;color:#94a3b8;padding-bottom:8px;font-weight:700;text-transform:uppercase">รายการสินค้า</th>
      <th style="text-align:center;font-size:11px;color:#94a3b8;padding-bottom:8px;font-weight:700">จำนวน</th>
      <th style="text-align:right;font-size:11px;color:#94a3b8;padding-bottom:8px;font-weight:700">ราคา</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <hr class="divider">
  <div style="display:flex;justify-content:space-between;align-items:baseline">
    <span style="font-size:13px;color:#64748b;font-weight:600">ยอดรวมทั้งสิ้น</span>
    <span class="total">฿${order.total_price.toLocaleString()}</span>
  </div>
  <hr class="divider">
  <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px">ขอบคุณที่ใช้บริการ DIP & DRIP<br>สอบถามข้อมูลเพิ่มเติมที่ support@dipdrip.com</p>
  <script>window.onload=function(){window.print()}<\/script>
</body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(receiptHtml)
    win.document.close()
  }
}
</script>

<template>
  <div class="min-h-screen py-10 transition-colors duration-300">
    <div class="max-w-4xl mx-auto px-4">
      <div class="bg-white dark:bg-[#191919] rounded-3xl shadow-sm border border-slate-200 dark:border-[#212327] p-6 md:p-8 transition-colors duration-300">

        <h1 class="text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight flex items-center gap-2">
          <Icon name="lucide:package" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>ประวัติการสั่งซื้อ</span>
        </h1>
        <p class="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">ตรวจสอบรายการสั่งซื้อและสถานะการจัดส่ง</p>

        <!-- Not logged in -->
        <div v-if="!authStore.isLoggedIn" class="border border-dashed border-slate-200 dark:border-[#212327] rounded-2xl bg-slate-50 dark:bg-[#0a0a0a] p-14 text-center">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Icon name="lucide:lock" class="w-7 h-7" />
          </div>
          <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">กรุณาเข้าสู่ระบบด้วยบัญชีของคุณ</p>
          <NuxtLink to="/login?redirect=/history" class="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl text-sm transition">
            <Icon name="lucide:log-in" class="w-4 h-4" />
            <span>เข้าสู่ระบบเลย</span>
          </NuxtLink>
        </div>

        <!-- Loading Skeleton -->
        <div v-else-if="loading" class="space-y-4">
          <TableSkeleton :rows="4" />
        </div>

        <!-- Empty -->
        <div v-else-if="orders.length === 0" class="border border-dashed border-slate-200 dark:border-[#212327] rounded-2xl bg-slate-50 dark:bg-[#0a0a0a] p-14 text-center">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Icon name="lucide:package-open" class="w-7 h-7" />
          </div>
          <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">คุณยังไม่มีประวัติการสั่งซื้อ</p>
          <NuxtLink to="/products" class="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl text-sm transition">
            <Icon name="lucide:shopping-bag" class="w-4 h-4" />
            <span>ไปหน้าร้านค้า</span>
          </NuxtLink>
        </div>

        <!-- Orders List -->
        <div v-else class="space-y-6">
          <div v-for="order in orders" :key="order.id" class="border border-slate-200 dark:border-[#212327] rounded-3xl overflow-hidden bg-slate-50/50 dark:bg-[#0a0a0a]/30">

            <!-- Order Header -->
            <div class="bg-slate-100/50 dark:bg-[#0a0a0a] px-5 py-4 border-b border-slate-200 dark:border-[#212327] flex flex-wrap justify-between items-center gap-3">
              <div>
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">เลขที่คำสั่งซื้อ</span>
                <span class="text-xs font-black text-slate-700 dark:text-slate-200">#{{ order.id }}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">วันที่สั่งซื้อ</span>
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">{{ formatDate(order.created_at) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span :class="statusLabel(order.status).cls" class="text-[10px] font-black px-3 py-1 rounded-full">
                  {{ statusLabel(order.status).text }}
                </span>
                <button v-if="order.status === 'completed'" @click="printReceipt(order)"
                  class="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-3 py-1 rounded-full transition flex items-center gap-1">
                  <Icon name="lucide:printer" class="w-3 h-3" />
                  <span>ใบเสร็จ</span>
                </button>
              </div>
            </div>

            <!-- Order Items -->
            <div class="p-5 divide-y divide-slate-200 dark:divide-slate-800">
              <div v-for="item in order.items" :key="item.product_id" class="py-3 first:pt-0 last:pb-0 flex flex-wrap justify-between items-center gap-2 text-xs">
                <div class="min-w-0 pr-4 flex-1">
                  <p class="font-bold text-slate-700 dark:text-slate-200 truncate">{{ item.product_name }}</p>
                  <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">฿{{ item.product_price }} × {{ item.quantity }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-black text-slate-800 dark:text-white flex-shrink-0">฿{{ item.product_price * item.quantity }}</span>
                  <NuxtLink
                    v-if="order.status !== 'cancelled' && order.status !== 'pending_payment'"
                    :to="`/products/${item.product_id}`"
                    class="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900/50 px-2.5 py-1 rounded-xl transition cursor-pointer shadow-sm"
                  >
                    <Icon name="lucide:star" class="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>รีวิวสินค้า</span>
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- Shipping Info -->
            <div v-if="order.shipping_name" class="px-5 py-3 border-t border-slate-200 dark:border-[#212327] bg-slate-100/10 dark:bg-[#0a0a0a]/10 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <p class="font-black text-[9px] text-blue-500 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Icon name="lucide:truck" class="w-3 h-3" /> ข้อมูลที่อยู่จัดส่งสินค้า
              </p>
              <p><strong>ชื่อผู้รับ:</strong> {{ order.shipping_name }}</p>
              <p><strong>เบอร์โทรศัพท์:</strong> {{ order.shipping_phone }}</p>
              <p><strong>ที่อยู่จัดส่ง:</strong> {{ formatAddress(order.shipping_address) }}</p>
            </div>

            <!-- Order Breakdown & Footer -->
            <div class="bg-slate-50/20 dark:bg-[#0a0a0a]/20 px-5 py-4 border-t border-slate-200 dark:border-[#212327] space-y-2">
              <div v-if="Number(order.tier_discount) > 0" class="flex justify-between items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span class="flex items-center gap-1">
                  <Icon name="lucide:gem" class="w-3.5 h-3.5" />
                  <span>ส่วนลดระดับสมาชิก ({{ (order.tier_name || 'Platinum').toUpperCase() }})</span>
                </span>
                <span>-฿{{ Number(order.tier_discount).toLocaleString() }}</span>
              </div>
              <div class="flex justify-between items-baseline pt-1">
                <span class="text-xs font-bold text-slate-400 dark:text-slate-500">ยอดรวมทั้งสิ้น</span>
                <span class="text-base font-black text-blue-600 dark:text-blue-400">฿{{ Number(order.total_price).toLocaleString() }}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
</template>