<script setup lang="ts">
definePageMeta({ middleware: "admin" })

import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import type {
  Product,
  TopupRequest,
  Order,
  AdminUser,
  Ticket,
  SalesReport,
  Promotion,
  GachaChest,
  GachaChestItem,
  WithdrawalRequest,
  AdminReview,
  SizeOption
} from '~/types/admin'

const toast = useToast()
const { confirm } = useConfirm()
const authStore = useAuthStore()

// ----- Shared State -----
const loading = ref(true)
const actionLoading = ref(false)
const activeTab = ref('products')
const adminPreviewModalImage = ref<string | null>(null)

// ----- Products Tab State -----
const products = ref<Product[]>([])
const showFormModal = ref(false)
const isEditMode = ref(false)
const currentEditId = ref<number | null>(null)
const selectedSizes = ref<SizeOption[]>([])

const form = reactive({
  name: '', price: 290, original_price: 390, status: 'มีสินค้าพร้อมส่ง',
  tag: 'New', imagesText: '', description: '', detailsText: '',
  category: 'STREETWEAR', stock: 10
})

function addSize(size: SizeOption) {
  const existing = selectedSizes.value.find(s => s.name === size.name)
  if (existing) {
    existing.stock = size.stock
  } else {
    selectedSizes.value.push(size)
  }
  syncTotalStockFromSizes()
}

function removeSize(idx: number) {
  selectedSizes.value.splice(idx, 1)
  syncTotalStockFromSizes()
}

function syncTotalStockFromSizes() {
  if (selectedSizes.value.length > 0) {
    const total = selectedSizes.value.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
    form.stock = total
  }
}

function openAddModal() {
  isEditMode.value = false
  currentEditId.value = null
  selectedSizes.value = [
    { name: 'S', stock: 5 },
    { name: 'M', stock: 5 },
    { name: 'L', stock: 5 }
  ]
  Object.assign(form, {
    name: '', price: 290, original_price: 390, status: 'มีสินค้าพร้อมส่ง',
    tag: 'New', imagesText: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    description: 'รายละเอียดสินค้า...', detailsText: '', category: 'STREETWEAR', stock: 15
  })
  showFormModal.value = true
}

function openEditModal(prod: Product) {
  isEditMode.value = true
  currentEditId.value = prod.id
  const rawSizes = prod.sizes
  if (Array.isArray(rawSizes)) {
    selectedSizes.value = rawSizes.map((s: any) => {
      if (typeof s === 'object' && s !== null) {
        return { name: String(s.name || s.size || '').toUpperCase(), stock: Number(s.stock ?? 0) }
      }
      return { name: String(s).toUpperCase(), stock: Math.max(1, Math.floor((prod.stock || 10) / rawSizes.length)) }
    })
  } else {
    selectedSizes.value = []
  }

  const rawDetails = prod.details
  const detailLines = Array.isArray(rawDetails)
    ? rawDetails.map((d: any) => typeof d === 'string' ? d : (d.label && d.value ? `${d.label}: ${d.value}` : d.label || ''))
    : []
  Object.assign(form, {
    name: prod.name, price: prod.price, original_price: prod.original_price,
    status: prod.status, tag: prod.tag, imagesText: (prod.images || []).join(', '),
    description: prod.description, detailsText: detailLines.join('\n'),
    category: prod.category || 'STREETWEAR', stock: prod.stock ?? 10
  })
  syncTotalStockFromSizes()
  showFormModal.value = true
}

async function handleProductSubmit() {
  if (!form.name || !form.price || !form.imagesText || !form.description) {
    toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน')
    return
  }
  actionLoading.value = true
  try {
    const images = form.imagesText.split(',').map(s => s.trim()).filter(Boolean)
    const details = form.detailsText.split('\n').map(s => s.trim()).filter(Boolean)
    const body = {
      name: form.name,
      price: Number(form.price),
      original_price: Number(form.original_price),
      status: form.status,
      tag: form.tag,
      images,
      description: form.description,
      details,
      category: form.category,
      stock: Number(form.stock),
      sizes: selectedSizes.value
    }
    if (isEditMode.value) {
      await $fetch(`/api/admin/products/${currentEditId.value}`, { method: 'PUT', body })
      toast.success('แก้ไขสำเร็จ!', 'แก้ไขรายละเอียดสินค้าเรียบร้อยแล้ว')
    } else {
      await $fetch('/api/admin/products', { method: 'POST', body })
      toast.success('เพิ่มสินค้าสำเร็จ!', 'สินค้าถูกลงทะเบียนเข้าสู่ร้านค้าแล้ว')
    }
    showFormModal.value = false
    await loadProducts()
  } catch (e: any) {
    toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
  } finally {
    actionLoading.value = false
  }
}

async function handleDeleteProduct(id: number) {
  const ok = await confirm({
    title: 'ลบสินค้านี้?',
    message: 'การกระทำนี้ไม่สามารถย้อนกลับได้',
    confirmText: 'ใช่, ลบเลย',
    type: 'danger'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      toast.success('ลบสำเร็จ!')
      await loadProducts()
    } catch (e: any) {
      toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
    }
  }
}

// ----- Topups Tab State -----
const topupRequests = ref<TopupRequest[]>([])
const pendingTopupCount = computed(() => topupRequests.value.filter(r => r.status === 'pending').length)

async function handleApproveTopup(id: number) {
  const ok = await confirm({
    title: 'อนุมัติคำขอเติมเงิน?',
    message: 'ยอดเงินจะถูกปรับเข้ากระเป๋าผู้ใช้ทันที',
    confirmText: 'อนุมัติ',
    type: 'info'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/topup-requests/${id}/approve`, { method: 'POST' })
      toast.success('อนุมัติเรียบร้อย!')
      await Promise.all([loadTopups(), authStore.fetchMe()])
    } catch (e: any) {
      toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
    }
  }
}

async function handleRejectTopup(id: number) {
  const ok = await confirm({
    title: 'ปฏิเสธคำขอเติมเงิน?',
    message: 'คำขอเติมเงินนี้จะถูกปฏิเสธ',
    confirmText: 'ปฏิเสธ',
    type: 'danger'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/topup-requests/${id}/reject`, { method: 'POST' })
      toast.info('ปฏิเสธเรียบร้อย')
      await loadTopups()
    } catch (e: any) {
      toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
    }
  }
}

async function handleDeleteTopup(id: number) {
  const ok = await confirm({
    title: 'ลบคำขอเติมเงินนี้?',
    message: 'รายการนี้จะถูกลบออกจากระบบอย่างถาวร',
    confirmText: 'ใช่, ลบเลย',
    type: 'danger'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/topup-requests/${id}`, { method: 'DELETE' })
      toast.success('ลบคำขอเติมเงินสำเร็จ!')
      await loadTopups()
    } catch (e: any) {
      toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
    }
  }
}

// ----- Withdrawals Tab State -----
const withdrawalRequests = ref<WithdrawalRequest[]>([])
const pendingWithdrawalCount = computed(() => withdrawalRequests.value.filter(r => r.status === 'pending').length)

async function handleApproveWithdrawal(id: number) {
  const ok = await confirm({
    title: 'อนุมัติคำขอถอนเงิน?',
    message: 'ยืนยันว่าได้โอนเงินให้ผู้ใช้เรียบร้อยแล้ว',
    confirmText: 'อนุมัติ',
    type: 'info'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/withdrawal-requests/${id}/approve`, { method: 'POST' })
      toast.success('อนุมัติเรียบร้อย!', 'ยืนยันการโอนเงินแล้ว')
      await loadWithdrawals()
    } catch (e: any) {
      toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
    }
  }
}

async function handleRejectWithdrawal(id: number) {
  const ok = await confirm({
    title: 'ปฏิเสธคำขอถอนเงิน?',
    message: 'เงินจะถูกคืนให้ผู้ใช้โดยอัตโนมัติ',
    confirmText: 'ปฏิเสธ & คืนเงิน',
    type: 'danger'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/withdrawal-requests/${id}/reject`, { method: 'POST', body: { note: '' } })
      toast.info('ปฏิเสธเรียบร้อย', 'เงินถูกคืนให้ผู้ใช้แล้ว')
      await loadWithdrawals()
    } catch (e: any) {
      toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
    }
  }
}

async function handleDeleteWithdrawal(id: number) {
  const ok = await confirm({
    title: 'ลบคำขอถอนเงินนี้?',
    message: 'รายการนี้จะถูกลบออกจากระบบอย่างถาวร',
    confirmText: 'ใช่, ลบเลย',
    type: 'danger'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/withdrawal-requests/${id}`, { method: 'DELETE' })
      toast.success('ลบคำขอถอนเงินสำเร็จ!')
      await loadWithdrawals()
    } catch (e: any) {
      toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
    }
  }
}

// ----- Orders Tab State -----
const orders = ref<Order[]>([])

async function changeOrderStatus(orderId: number, newStatus: string) {
  if (newStatus === 'delete') {
    await handleDeleteOrder(orderId)
    return
  }
  try {
    await $fetch(`/api/admin/orders/${orderId}/status`, { method: 'PATCH', body: { status: newStatus } })
    const order = orders.value.find(o => o.id === orderId)
    if (order) order.status = newStatus
    toast.success('อัปเดตสถานะสำเร็จ!')
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  }
}

async function approveOrder(orderId: number) {
  const ok = await confirm({
    title: 'อนุมัติคำสั่งซื้อ QR?',
    message: 'ยืนยันว่าตรวจสอบสลิปแล้วและรับเงินเรียบร้อย',
    confirmText: 'อนุมัติ',
    type: 'info'
  })
  if (!ok) return
  try {
    await $fetch(`/api/admin/orders/${orderId}/approve`, { method: 'POST' })
    toast.success('อนุมัติเรียบร้อย!', 'คำสั่งซื้อได้รับการยืนยันแล้ว')
    await loadOrders()
  } catch (e: any) {
    toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
  }
}

async function rejectOrder(orderId: number) {
  const ok = await confirm({
    title: 'ปฏิเสธคำสั่งซื้อ QR?',
    message: 'คำสั่งซื้อจะถูกยกเลิก และลูกค้าจะต้องสั่งซื้อใหม่',
    confirmText: 'ปฏิเสธ',
    type: 'danger'
  })
  if (!ok) return
  try {
    await $fetch(`/api/admin/orders/${orderId}/reject`, { method: 'POST' })
    toast.info('ปฏิเสธเรียบร้อย', 'คำสั่งซื้อถูกยกเลิกแล้ว')
    await loadOrders()
  } catch (e: any) {
    toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
  }
}

async function handleDeleteOrder(orderId: number) {
  const ok = await confirm({
    title: 'ลบรายการคำสั่งซื้อนี้?',
    message: 'เมื่อลบแล้วจะไม่สามารถกู้คืนได้ และสต็อกสินค้าจะถูกปรับคืนอัตโนมัติ (หากยังไม่ได้ยกเลิก)',
    confirmText: 'ลบคำสั่งซื้อ',
    type: 'danger'
  })
  if (!ok) return
  try {
    await $fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
    toast.success('ลบสำเร็จ!', 'ลบรายการคำสั่งซื้อเรียบร้อยแล้ว')
    await Promise.all([loadOrders(), loadSalesReport(), loadProducts()])
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  }
}

async function handleClearOrdersByStatus(statusTarget: string) {
  const isAll = statusTarget === 'all'
  const ok = await confirm({
    title: isAll ? 'ลบคำสั่งซื้อทั้งหมด?' : `ลบคำสั่งซื้อกลุ่ม "${statusTarget}"?`,
    message: isAll
      ? 'การดำเนินการนี้จะลบรายการคำสั่งซื้อทั้งหมดในระบบ และปรับคืนสต็อกสินค้าอัตโนมัติ แน่ใจหรือไม่?'
      : 'การดำเนินการนี้จะลบรายการคำสั่งซื้อที่เลือกเท่านั้น แน่ใจหรือไม่?',
    confirmText: isAll ? 'ลบทั้งหมดเลย' : 'ยืนยันการลบ',
    type: 'danger'
  })
  if (!ok) return
  try {
    const res = await $fetch<{ success: boolean; message: string }>('/api/admin/orders/clear-all', {
      method: 'DELETE',
      query: { status: statusTarget }
    })
    toast.success('ลบสำเร็จ!', res.message || 'ลบรายการเรียบร้อยแล้ว')
    await Promise.all([loadOrders(), loadSalesReport(), loadProducts()])
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  }
}

// ----- Users Tab State -----
const users = ref<AdminUser[]>([])
const showUserModal = ref(false)
const isUserEdit = ref(false)
const editUserId = ref<number | null>(null)
const userForm = reactive({ name: '', email: '', password: '', balance: 0, is_admin: 0, tier: 'bronze', points: 0 })

function openAddUser() {
  isUserEdit.value = false
  editUserId.value = null
  Object.assign(userForm, { name: '', email: '', password: '', balance: 0, is_admin: 0, tier: 'bronze', points: 0 })
  showUserModal.value = true
}

function openEditUser(user: AdminUser) {
  isUserEdit.value = true
  editUserId.value = user.id
  Object.assign(userForm, {
    name: user.name,
    email: user.email,
    password: '',
    balance: user.balance,
    is_admin: user.is_admin,
    tier: user.tier || 'bronze',
    points: user.points ?? 0
  })
  showUserModal.value = true
}

async function handleUserSubmit() {
  if (!userForm.name || !userForm.email) return toast.warning('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและอีเมล')
  if (!isUserEdit.value && !userForm.password) return toast.warning('ข้อมูลไม่ครบ', 'กรุณากรอกรหัสผ่าน')
  actionLoading.value = true
  try {
    if (isUserEdit.value) {
      await $fetch(`/api/admin/users/${editUserId.value}`, {
        method: 'PUT',
        body: { ...userForm, newPassword: userForm.password || undefined }
      })
      toast.success('แก้ไขสำเร็จ!')
    } else {
      await $fetch('/api/admin/users', { method: 'POST', body: userForm })
      toast.success('เพิ่มสมาชิกสำเร็จ!')
    }
    showUserModal.value = false
    await Promise.all([loadUsers(), authStore.fetchMe()])
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  } finally {
    actionLoading.value = false
  }
}

async function handleDeleteUser(id: number) {
  const ok = await confirm({
    title: 'ลบสมาชิกนี้?',
    message: 'การลบสมาชิกจะไม่สามารถกู้คืนได้',
    confirmText: 'ใช่, ลบเลย',
    type: 'danger'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      toast.success('ลบสำเร็จ!')
      await loadUsers()
    } catch (e: any) {
      toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
    }
  }
}

// ----- Tickets Tab State -----
const tickets = ref<Ticket[]>([])
const selectedAdminTicket = ref<Ticket | null>(null)
const adminChatMessages = ref<any[]>([])
const adminChatSending = ref(false)
const adminChatLoading = ref(false)
let adminPollingTimer: any = null

function startAdminPolling() {
  stopAdminPolling()
  adminPollingTimer = setInterval(() => loadAdminChat(true), 3000)
}
function stopAdminPolling() {
  if (adminPollingTimer) {
    clearInterval(adminPollingTimer)
    adminPollingTimer = null
  }
}
async function selectAdminTicket(ticket: Ticket) {
  selectedAdminTicket.value = ticket
  await loadAdminChat()
  startAdminPolling()
}
async function loadAdminChat(silent = false) {
  if (!selectedAdminTicket.value) return
  if (!silent) adminChatLoading.value = true
  try {
    const data = await $fetch(`/api/tickets/${selectedAdminTicket.value.id}/messages`) as any
    adminChatMessages.value = data.messages || []
    selectedAdminTicket.value = data.ticket || selectedAdminTicket.value
  } catch (e) {
    console.error(e)
  } finally {
    adminChatLoading.value = false
  }
}
async function handleSendAdminMessage(payload: { message: string; file: File | null }) {
  if (!selectedAdminTicket.value || adminChatSending.value) return
  adminChatSending.value = true

  let imageUrl: string | null = null
  try {
    if (payload.file) {
      const formData = new FormData()
      formData.append('file', payload.file)
      const res = await $fetch<{ success: boolean; urls: string[] }>('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (res.success && res.urls.length > 0) {
        imageUrl = res.urls[0]!
      }
    }

    const optimistic = {
      id: Date.now(),
      sender: 'admin',
      message: payload.message,
      image_url: imageUrl || (payload.file ? URL.createObjectURL(payload.file) : null),
      created_at: new Date().toISOString()
    }
    adminChatMessages.value.push(optimistic)

    await $fetch(`/api/admin/tickets/${selectedAdminTicket.value.id}/messages`, {
      method: 'POST',
      body: { message: payload.message, image_url: imageUrl }
    })
    await loadAdminChat(true)
    await loadTickets()
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message || 'ส่งข้อความไม่สำเร็จ')
  } finally {
    adminChatSending.value = false
  }
}

async function handleDeleteTicket(id: number) {
  const ok = await confirm({
    title: 'ลบตั๋วปัญหานี้?',
    message: 'บทสนทนาและประวัติตั๋วนี้จะถูกลบออกจากระบบอย่างถาวร',
    confirmText: 'ใช่, ลบเลย',
    type: 'danger'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/tickets/${id}`, { method: 'DELETE' })
      toast.success('ลบตั๋วปัญหาสำเร็จ!')
      selectedAdminTicket.value = null
      adminChatMessages.value = []
      stopAdminPolling()
      await loadTickets()
    } catch (e: any) {
      toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
    }
  }
}

// ----- Sales Report Tab State -----
const salesReport = ref<SalesReport | null>(null)

// ----- Promotions Tab State -----
const promotions = ref<Promotion[]>([])
const showPromoModal = ref(false)
const isPromoEdit = ref(false)
const editPromoId = ref<number | null>(null)
const promoForm = reactive({
  title: '',
  description: '',
  image: '',
  badge: 'Flash Sale',
  discount_mode: 'percent' as 'percent' | 'fixed' | 'free',
  discount_val: 20,
  discount_text: 'ลด 20%',
  start_date: '',
  end_date: '',
  is_active: 1,
  target_category: 'ALL',
  promo_type: 'product' as 'product' | 'shipping',
  min_spend: 0
})

function toLocalISOString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function normalizeDateTimeInput(str: string | undefined | null, isEnd = false) {
  if (!str) return ''
  if (typeof str === 'string' && str.length === 10 && !str.includes('T')) {
    return isEnd ? `${str}T23:59` : `${str}T00:00`
  }
  const d = new Date(str)
  if (isNaN(d.getTime())) return ''
  return toLocalISOString(d)
}

function setPromoDurationMinutes(mins: number) {
  const now = new Date()
  const end = new Date(now.getTime() + mins * 60 * 1000)
  promoForm.start_date = toLocalISOString(now)
  promoForm.end_date = toLocalISOString(end)
}

function syncPromoDiscount() {
  if (promoForm.promo_type === 'shipping') {
    if (promoForm.discount_mode === 'free') {
      promoForm.discount_text = 'ฟรีค่าส่ง'
    } else if (promoForm.discount_mode === 'percent') {
      promoForm.discount_text = `ลดค่าส่ง ${promoForm.discount_val || 0}%`
    } else {
      promoForm.discount_text = `ลดค่าส่ง ${promoForm.discount_val || 0} บาท`
    }
  } else {
    if (promoForm.discount_mode === 'percent') {
      promoForm.discount_text = `ลด ${promoForm.discount_val || 0}%`
    } else {
      promoForm.discount_text = `ลด ${promoForm.discount_val || 0} บาท`
    }
  }
}

function openAddPromo() {
  isPromoEdit.value = false
  editPromoId.value = null
  const now = new Date()
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000)
  Object.assign(promoForm, {
    title: '', description: '', image: '', badge: 'Flash Sale',
    discount_mode: 'percent', discount_val: 20, discount_text: 'ลด 20%',
    start_date: toLocalISOString(now), end_date: toLocalISOString(nextHour),
    is_active: 1, target_category: 'ALL', promo_type: 'product', min_spend: 0
  })
  showPromoModal.value = true
}

function openEditPromo(promo: Promotion) {
  isPromoEdit.value = true
  editPromoId.value = promo.id
  const txt = promo.discount_text || ''
  let mode: 'percent' | 'fixed' | 'free' = 'percent'
  let val = 20

  if (/(?:ส่งฟรี|ฟรีค่าส่ง|ฟรีค่าจัดส่ง|freeshipping)/i.test(txt)) {
    mode = 'free'
    val = 100
  } else if (txt.includes('%')) {
    mode = 'percent'
    const m = txt.match(/(\d+(?:\.\d+)?)/)
    if (m && m[1]) val = parseFloat(m[1])
  } else if (/(?:บาท|บ)/i.test(txt) || /\d+/.test(txt)) {
    mode = 'fixed'
    const m = txt.match(/(\d+(?:\.\d+)?)/)
    if (m && m[1]) val = parseFloat(m[1])
  }

  Object.assign(promoForm, {
    title: promo.title, description: promo.description, image: promo.image,
    badge: promo.badge, discount_mode: mode, discount_val: val, discount_text: promo.discount_text,
    start_date: normalizeDateTimeInput(promo.start_date, false),
    end_date: normalizeDateTimeInput(promo.end_date, true),
    is_active: promo.is_active, target_category: promo.target_category || 'ALL',
    promo_type: promo.promo_type || 'product', min_spend: promo.min_spend || 0
  })
  showPromoModal.value = true
}

async function handlePromoSubmit() {
  if (!promoForm.title || !promoForm.description) {
    toast.warning('ข้อมูลไม่ครบ', 'กรุณากรอกหัวข้อและรายละเอียดโปรโมชั่น')
    return
  }
  actionLoading.value = true
  try {
    const payload = {
      ...promoForm,
      start_date: promoForm.start_date ? new Date(promoForm.start_date).toISOString() : null,
      end_date: promoForm.end_date ? new Date(promoForm.end_date).toISOString() : null
    }
    if (isPromoEdit.value && editPromoId.value) {
      await $fetch(`/api/admin/promotions/${editPromoId.value}`, { method: 'PUT', body: payload })
      toast.success('อัปเดตแล้ว!', 'แก้ไขโปรโมชั่นเรียบร้อย')
    } else {
      await $fetch('/api/admin/promotions', { method: 'POST', body: payload })
      toast.success('เพิ่มแล้ว!', 'เพิ่มโปรโมชั่นใหม่เรียบร้อย')
    }
    showPromoModal.value = false
    await loadPromotions()
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  } finally {
    actionLoading.value = false
  }
}

async function deletePromo(id: number) {
  const ok = await confirm({
    title: 'ลบโปรโมชั่น?',
    message: 'ไม่สามารถกู้คืนได้',
    confirmText: 'ลบเลย',
    type: 'danger'
  })
  if (!ok) return
  try {
    await $fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
    await loadPromotions()
    toast.success('ลบแล้ว!')
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  }
}

async function togglePromoActive(promo: Promotion) {
  try {
    await $fetch(`/api/admin/promotions/${promo.id}`, {
      method: 'PUT',
      body: { ...promo, is_active: promo.is_active ? 0 : 1 }
    })
    await loadPromotions()
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  }
}

// ----- Gacha Chests Tab State -----
const gachaChests = ref<GachaChest[]>([])
const showChestModal = ref(false)
const isChestEdit = ref(false)
const currentChestId = ref<number | null>(null)
const chestForm = reactive({
  name: '', price: 99, image: '', description: '', is_active: 1
})
const chestItems = ref<GachaChestItem[]>([])

function openAddChest() {
  isChestEdit.value = false
  currentChestId.value = null
  Object.assign(chestForm, {
    name: '', price: 99,
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&q=80',
    description: 'คำอธิบายตู้สุ่ม...', is_active: 1
  })
  chestItems.value = [
    { name: 'รางวัลใหญ่ (SSR)', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80', price: 1000, tier: 'SSR', odds: 10, stock: 10 },
    { name: 'รางวัลทั่วไป (Normal)', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80', price: 150, tier: 'Normal', odds: 90, stock: 10 }
  ]
  showChestModal.value = true
}

function openEditChest(chest: any) {
  isChestEdit.value = true
  currentChestId.value = chest.id
  Object.assign(chestForm, {
    name: chest.name, price: chest.price, image: chest.image,
    description: chest.description, is_active: chest.is_active
  })
  const itemsSource = chest.items || chest.products || []
  chestItems.value = itemsSource.map((item: any) => ({
    id: item.id,
    name: item.name || 'ของรางวัล',
    image: item.image || (item.images ? (typeof item.images === 'string' ? JSON.parse(item.images)[0] : item.images[0]) : ''),
    price: item.price || 0,
    tier: item.tier || item.tag || 'Normal',
    odds: item.odds ?? 100,
    stock: item.stock ?? null
  }))
  showChestModal.value = true
}

function addChestItem() {
  chestItems.value.push({
    name: 'ของรางวัลใหม่',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    price: 100,
    tier: 'Normal',
    odds: 100,
    stock: null
  })
}

function removeChestItem(idx: number) {
  chestItems.value.splice(idx, 1)
}

async function handleChestSubmit() {
  if (!chestForm.name || chestForm.price === undefined) {
    toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อและราคาตู้สุ่ม')
    return
  }
  if (chestItems.value.length === 0) {
    toast.warning('ตู้ไม่มีของรางวัล', 'กรุณาเพิ่มของรางวัลในตู้อย่างน้อย 1 ชิ้น')
    return
  }
  for (const item of chestItems.value) {
    if (!item.name || !item.name.trim()) {
      toast.warning('ข้อมูลของรางวัลไม่ครบ', 'กรุณากรอกชื่อของรางวัลทุกชิ้นในตู้')
      return
    }
  }
  actionLoading.value = true
  try {
    const body = {
      name: chestForm.name,
      price: Number(chestForm.price),
      image: chestForm.image,
      description: chestForm.description,
      is_active: Number(chestForm.is_active),
      items: chestItems.value
    }
    if (isChestEdit.value && currentChestId.value) {
      await $fetch(`/api/admin/gacha-chests/${currentChestId.value}`, { method: 'PUT', body })
      toast.success('แก้ไขสำเร็จ!', 'อัปเดตตู้สุ่มเรียบร้อยแล้ว')
    } else {
      await $fetch('/api/admin/gacha-chests', { method: 'POST', body })
      toast.success('เพิ่มสำเร็จ!', 'สร้างตู้สุ่มใหม่เรียบร้อยแล้ว')
    }
    showChestModal.value = false
    await loadGachaChests()
  } catch (e: any) {
    toast.error('ล้มเหลว', e.data?.statusMessage || e.message)
  } finally {
    actionLoading.value = false
  }
}

async function deleteChest(id: number) {
  const ok = await confirm({
    title: 'ลบตู้สุ่มนี้?',
    message: 'การกระทำนี้จะลบตู้และข้อมูลสินค้าในตู้ ไม่สามารถกู้คืนได้',
    confirmText: 'ลบเลย',
    type: 'danger'
  })
  if (ok) {
    try {
      await $fetch(`/api/admin/gacha-chests/${id}`, { method: 'DELETE' })
      toast.success('ลบสำเร็จ!')
      await loadGachaChests()
    } catch (e: any) {
      toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
    }
  }
}

async function toggleChestActive(chest: any) {
  try {
    const body = {
      name: chest.name,
      price: chest.price,
      image: chest.image,
      description: chest.description,
      is_active: chest.is_active ? 0 : 1,
      items: chest.items || chest.products || []
    }
    await $fetch(`/api/admin/gacha-chests/${chest.id}`, { method: 'PUT', body })
    await loadGachaChests()
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  }
}

// ----- Reviews Tab State -----
const adminReviews = ref<AdminReview[]>([])

async function loadAdminReviews() {
  try {
    const data = (await $fetch('/api/admin/reviews')) as any
    adminReviews.value = data.reviews || []
  } catch (e) {
    console.error('Failed to load admin reviews', e)
  }
}

async function deleteAdminReview(id: number) {
  const ok = await confirm({
    title: 'ลบรีวิวนี้?',
    message: 'การลบรีวิวนี้จะไม่สามารถกู้คืนได้',
    confirmText: 'ลบเลย',
    type: 'danger'
  })
  if (!ok) return
  try {
    await $fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    await loadAdminReviews()
    toast.success('ลบแล้ว!', 'ลบรีวิวสินค้าเรียบร้อย')
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  }
}

// ----- Load Functions -----
async function loadProducts() {
  const data = (await $fetch('/api/products')) as any
  products.value = data.products || []
}

async function loadTopups() {
  const data = (await $fetch('/api/admin/topup-requests')) as any
  topupRequests.value = data.requests || []
}

async function loadOrders() {
  const data = (await $fetch('/api/admin/orders')) as any
  orders.value = data.orders || []
}

async function loadUsers() {
  const data = (await $fetch('/api/admin/users')) as any
  users.value = data.users || []
}

async function loadTickets() {
  const data = (await $fetch('/api/admin/tickets')) as any
  tickets.value = data.tickets || []
}

async function loadWithdrawals() {
  const data = await $fetch('/api/admin/withdrawal-requests') as any
  withdrawalRequests.value = data.requests || []
}

async function loadSalesReport() {
  const data = (await $fetch('/api/admin/sales-report')) as any
  salesReport.value = data
}

async function loadPromotions() {
  const data = (await $fetch('/api/admin/promotions')) as any
  promotions.value = data.promotions || []
}

async function loadGachaChests() {
  const data = (await $fetch('/api/admin/gacha-chests')) as any
  gachaChests.value = data.chests || []
}

// ----- Live Data Polling & Audio Notification -----
let liveSyncTimer: any = null
const isLiveSyncing = ref(false)

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

async function syncLiveAdminData() {
  if (!authStore.isAdmin || isLiveSyncing.value) return
  isLiveSyncing.value = true
  try {
    const [ordersData, topupsData, withdrawalsData, ticketsData, usersData, reviewsData, productsData, chestsData] = await Promise.all([
      $fetch('/api/admin/orders').catch(() => null) as Promise<any>,
      $fetch('/api/admin/topup-requests').catch(() => null) as Promise<any>,
      $fetch('/api/admin/withdrawal-requests').catch(() => null) as Promise<any>,
      $fetch('/api/admin/tickets').catch(() => null) as Promise<any>,
      $fetch('/api/admin/users').catch(() => null) as Promise<any>,
      $fetch('/api/admin/reviews').catch(() => null) as Promise<any>,
      $fetch('/api/products').catch(() => null) as Promise<any>,
      $fetch('/api/admin/gacha-chests').catch(() => null) as Promise<any>,
    ])

    if (ordersData?.orders) {
      if (orders.value.length > 0 && ordersData.orders.length > orders.value.length) playNotificationSound()
      orders.value = ordersData.orders
    }
    if (topupsData?.requests) {
      const oldPending = pendingTopupCount.value
      topupRequests.value = topupsData.requests
      if (pendingTopupCount.value > oldPending) playNotificationSound()
    }
    if (withdrawalsData?.requests) {
      const oldPendingWithdraw = pendingWithdrawalCount.value
      withdrawalRequests.value = withdrawalsData.requests
      if (pendingWithdrawalCount.value > oldPendingWithdraw) playNotificationSound()
    }
    if (ticketsData?.tickets) {
      const oldOpenTickets = tickets.value.filter((t: any) => t.status === 'open').length
      tickets.value = ticketsData.tickets
      const newOpenTickets = tickets.value.filter((t: any) => t.status === 'open').length
      if (newOpenTickets > oldOpenTickets) playNotificationSound()
    }
    if (usersData?.users) users.value = usersData.users
    if (reviewsData?.reviews) adminReviews.value = reviewsData.reviews
    if (productsData?.products) products.value = productsData.products
    if (chestsData?.chests) gachaChests.value = chestsData.chests
  } catch (e) {
    // silent catch
  } finally {
    isLiveSyncing.value = false
  }
}

function startLiveSync() {
  stopLiveSync()
  liveSyncTimer = setInterval(() => syncLiveAdminData(), 2500)
}

function stopLiveSync() {
  if (liveSyncTimer) {
    clearInterval(liveSyncTimer)
    liveSyncTimer = null
  }
}

async function loadAllData() {
  loading.value = true
  if (authStore.isAdmin) {
    await Promise.all([
      loadProducts(),
      loadTopups(),
      loadWithdrawals(),
      loadOrders(),
      loadUsers(),
      loadTickets(),
      loadSalesReport(),
      loadPromotions(),
      loadGachaChests(),
      loadAdminReviews()
    ])
  }
  loading.value = false
}

onMounted(() => {
  loadAllData()
  startLiveSync()
})

onUnmounted(() => {
  stopAdminPolling()
  stopLiveSync()
})
</script>

<template>
  <div class="min-h-screen py-10 px-4 transition-colors duration-300">
    <div class="max-w-6xl mx-auto space-y-8">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 dark:from-[#191919] dark:via-[#161616] dark:to-[#191919] rounded-3xl p-6 md:p-8 text-white border border-blue-500/20 dark:border-[#212327] shadow-xl">
        <div class="space-y-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-white/20 dark:bg-[#212327] text-white dark:text-slate-200 font-black text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-white/20 dark:border-[#212327]">System Console</span>
            <span
              v-if="authStore.isSuperAdmin"
              class="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1"
            >
              <Icon name="lucide:crown" class="w-3.5 h-3.5 text-amber-400" />
              <span>แอดมินสูงสุด (Super Admin)</span>
            </span>
            <span
              v-else-if="authStore.isAdmin"
              class="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1"
            >
              <Icon name="lucide:shield" class="w-3.5 h-3.5 text-indigo-400" />
              <span>แอดมินทั่วไป (Staff Admin)</span>
            </span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Icon name="lucide:shield-check" class="w-7 h-7" />
            <span>ระบบควบคุมหลังบ้าน</span>
          </h1>
          <p class="text-xs text-blue-100/90 dark:text-slate-400">
            {{ authStore.isSuperAdmin ? 'คุณมีสิทธิ์ระดับสูงสุด สามารถจัดการทุกอย่างในระบบได้ 100%' : 'คุณมีสิทธิ์ระดับแอดมินทั่วไป จัดการสินค้า, โปรโมชั่น, ตู้สุ่ม, ออเดอร์, เติม/ถอนเงิน และตอบแจ้งปัญหาได้' }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2.5">
          <button v-if="authStore.isAdmin && activeTab === 'products'" @click="openAddModal"
            class="bg-white text-blue-700 dark:bg-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-700 font-black px-6 py-3 rounded-2xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer">
            <Icon name="lucide:plus" class="w-3.5 h-3.5" />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
          <button v-if="authStore.isAdmin && activeTab === 'users'" @click="openAddUser"
            class="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer">
            <Icon name="lucide:user-plus" class="w-3.5 h-3.5" />
            <span>เพิ่มสมาชิก</span>
          </button>
          <button v-if="authStore.isAdmin && activeTab === 'promotions'" @click="openAddPromo"
            class="bg-pink-500 hover:bg-pink-600 text-white font-black px-6 py-3 rounded-2xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer">
            <Icon name="lucide:gift" class="w-3.5 h-3.5" />
            <span>เพิ่มโปรโมชั่น</span>
          </button>
          <button v-if="authStore.isAdmin && activeTab === 'gacha'" @click="openAddChest"
            class="bg-rose-500 hover:bg-rose-600 text-white font-black px-6 py-3 rounded-2xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer">
            <Icon name="lucide:dice-5" class="w-3.5 h-3.5" />
            <span>เพิ่มตู้สุ่มใหม่</span>
          </button>
        </div>
      </div>

      <!-- 1. Loading Skeleton -->
      <div v-if="authStore.loading" class="space-y-6 animate-pulse">
        <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl p-2 flex gap-2">
          <AppSkeleton v-for="i in 10" :key="i" width="100%" height="46px" rounded="xl" />
        </div>
        <TableSkeleton :rows="6" />
      </div>

      <!-- 2. Unauthorized View -->
      <div v-else-if="!authStore.isAdmin" class="bg-white dark:bg-[#191919] border-2 border-slate-300 dark:border-[#212327] rounded-3xl p-12 text-center shadow-xl space-y-6">
        <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto text-slate-400">
          <Icon name="lucide:lock" class="w-8 h-8" />
        </div>
        <div class="space-y-2 max-w-md mx-auto">
          <h2 class="text-lg font-black text-slate-800 dark:text-white">ปฏิเสธการเข้าถึง</h2>
          <p class="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">เฉพาะบัญชีผู้ดูแลระบบเท่านั้นที่สามารถใช้งานได้</p>
        </div>
        <NuxtLink to="/" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-3.5 rounded-2xl text-sm transition shadow-lg shadow-blue-600/20">
          <Icon name="lucide:home" class="w-4 h-4" />
          <span>กลับสู่หน้าหลัก</span>
        </NuxtLink>
      </div>

      <!-- 3. Authenticated Admin Console -->
      <template v-else>
        <!-- Tab Bar -->
        <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-2xl p-1.5 shadow-sm">
          <div class="flex items-center gap-1 w-full">
            <button
              v-for="tab in [
                { id: 'products',    icon: 'lucide:package',        label: 'สินค้า',       count: products.length },
                { id: 'orders',      icon: 'lucide:shopping-cart',  label: 'คำสั่งซื้อ',   count: orders.length },
                { id: 'topups',      icon: 'lucide:wallet',         label: 'เติมเงิน',     count: pendingTopupCount },
                { id: 'withdrawals', icon: 'lucide:banknote',       label: 'ถอนเงิน',     count: pendingWithdrawalCount },
                { id: 'users',       icon: 'lucide:users',          label: 'สมาชิก',       count: users.length },
                { id: 'tickets',     icon: 'lucide:message-circle', label: 'แจ้งปัญหา',   count: tickets.filter(t => t.status === 'open').length },
                { id: 'promotions',  icon: 'lucide:gift',           label: 'โปรโมชั่น',   count: promotions.length },
                { id: 'gacha',       icon: 'lucide:dice-5',         label: 'ตู้สุ่ม',     count: gachaChests.length },
                { id: 'reviews',     icon: 'lucide:star',           label: 'รีวิว',       count: adminReviews.length },
                { id: 'report',      icon: 'lucide:bar-chart-2',    label: 'รายงาน',      count: null },
              ]"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#212327]'"
              class="flex-1 py-2 rounded-xl transition flex flex-col items-center justify-center gap-1 font-bold text-[9px] xl:text-[10px] relative cursor-pointer"
            >
              <div class="relative">
                <Icon :name="tab.icon" class="w-4 h-4" />
                <span
                  v-if="tab.count !== null && tab.count > 0"
                  :class="activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'"
                  class="absolute -top-2 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[8px] font-black flex items-center justify-center transition-all"
                >
                  {{ tab.count }}
                </span>
              </div>
              <span class="leading-none">{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- Skeleton Loading when tab data is loading -->
        <div v-if="loading" class="space-y-5 animate-pulse">
          <TableSkeleton :rows="6" />
        </div>

        <template v-else>
          <!-- TAB: PRODUCTS -->
          <AdminProductsTab
            v-if="activeTab === 'products'"
            :products="products"
            @add="openAddModal"
            @edit="openEditModal"
            @delete="handleDeleteProduct"
          />

          <!-- TAB: ORDERS -->
          <AdminOrdersTab
            v-else-if="activeTab === 'orders'"
            :orders="orders"
            @change-status="changeOrderStatus"
            @delete-order="handleDeleteOrder"
            @clear-orders="handleClearOrdersByStatus"
            @approve-order="approveOrder"
            @reject-order="rejectOrder"
            @preview-image="(url) => adminPreviewModalImage = url"
          />

          <!-- TAB: TOPUPS -->
          <AdminTopupsTab
            v-else-if="activeTab === 'topups'"
            :topup-requests="topupRequests"
            @approve="handleApproveTopup"
            @reject="handleRejectTopup"
            @delete="handleDeleteTopup"
            @preview-image="(url) => adminPreviewModalImage = url"
          />

          <!-- TAB: WITHDRAWALS -->
          <AdminWithdrawalsTab
            v-else-if="activeTab === 'withdrawals'"
            :withdrawal-requests="withdrawalRequests"
            @approve="handleApproveWithdrawal"
            @reject="handleRejectWithdrawal"
            @delete="handleDeleteWithdrawal"
          />

          <!-- TAB: USERS -->
          <AdminUsersTab
            v-else-if="activeTab === 'users'"
            :users="users"
            @edit="openEditUser"
            @delete="handleDeleteUser"
          />

          <!-- TAB: TICKETS -->
          <AdminTicketsTab
            v-else-if="activeTab === 'tickets'"
            :tickets="tickets"
            :selected-ticket="selectedAdminTicket"
            :messages="adminChatMessages"
            :loading="adminChatLoading"
            :sending="adminChatSending"
            @select-ticket="selectAdminTicket"
            @send-message="handleSendAdminMessage"
            @delete-ticket="handleDeleteTicket"
            @preview-image="(url) => adminPreviewModalImage = url"
          />

          <!-- TAB: SALES REPORT -->
          <AdminReportTab
            v-else-if="activeTab === 'report'"
            :sales-report="salesReport"
          />

          <!-- TAB: PROMOTIONS -->
          <AdminPromotionsTab
            v-else-if="activeTab === 'promotions'"
            :promotions="promotions"
            @add="openAddPromo"
            @edit="openEditPromo"
            @delete="deletePromo"
            @toggle-active="togglePromoActive"
          />

          <!-- TAB: GACHA CHESTS -->
          <AdminGachaTab
            v-else-if="activeTab === 'gacha'"
            :gacha-chests="gachaChests"
            @add="openAddChest"
            @edit="openEditChest"
            @delete="deleteChest"
            @toggle-active="toggleChestActive"
          />

          <!-- TAB: REVIEWS -->
          <AdminReviewsTab
            v-else-if="activeTab === 'reviews'"
            :reviews="adminReviews"
            @delete-review="deleteAdminReview"
          />
        </template>
      </template>

    </div>

    <!-- MODALS -->
    <!-- 1. Product Form Modal -->
    <AdminProductModal
      v-model="showFormModal"
      :is-edit-mode="isEditMode"
      :form="form"
      :selected-sizes="selectedSizes"
      :action-loading="actionLoading"
      @submit="handleProductSubmit"
      @sync-sizes="syncTotalStockFromSizes"
      @add-size="addSize"
      @remove-size="removeSize"
      @update-images="(imgs) => form.imagesText = imgs.join(', ')"
    />

    <!-- 2. User Form Modal -->
    <AdminUserModal
      v-model="showUserModal"
      :is-user-edit="isUserEdit"
      :user-form="userForm"
      :action-loading="actionLoading"
      @submit="handleUserSubmit"
    />

    <!-- 3. Promotion Form Modal -->
    <AdminPromotionModal
      v-model="showPromoModal"
      :is-promo-edit="isPromoEdit"
      :promo-form="promoForm"
      :action-loading="actionLoading"
      @submit="handlePromoSubmit"
      @sync-discount="syncPromoDiscount"
      @set-duration="setPromoDurationMinutes"
    />

    <!-- 4. Gacha Chest Form Modal -->
    <AdminGachaModal
      v-model="showChestModal"
      :is-chest-edit="isChestEdit"
      :chest-form="chestForm"
      :chest-items="chestItems"
      :action-loading="actionLoading"
      @submit="handleChestSubmit"
      @add-item="addChestItem"
      @remove-item="removeChestItem"
    />

    <!-- 5. Image Lightbox Modal -->
    <AdminImageModal v-model="adminPreviewModalImage" />
  </div>
</template>
