<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'
const toast = useToast()
const { confirm } = useConfirm()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const currentProduct = ref<any>(null)
const loading = ref(true)
const selectedImage = ref('')
const selectedSize = ref('')
const quantity = ref(1)

interface NormalizedSize {
  name: string
  stock: number
}

const parsedSizes = computed<NormalizedSize[]>(() => {
  const raw = currentProduct.value?.sizes
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((item: any) => {
    if (typeof item === 'object' && item !== null) {
      return {
        name: String(item.name || item.size || '').toUpperCase(),
        stock: Number(item.stock ?? 0)
      }
    }
    return {
      name: String(item).toUpperCase(),
      stock: Number(currentProduct.value?.stock ?? 0)
    }
  })
})

const selectedSizeObj = computed<NormalizedSize | null>(() => {
  if (!selectedSize.value) return null
  return parsedSizes.value.find(s => s.name === selectedSize.value) || null
})

const currentStock = computed<number>(() => {
  if (parsedSizes.value.length > 0) {
    if (selectedSizeObj.value) {
      return selectedSizeObj.value.stock
    }
    return currentProduct.value?.stock ?? 0
  }
  return currentProduct.value?.stock ?? 0
})

function selectSize(sizeName: string) {
  selectedSize.value = sizeName
  const found = parsedSizes.value.find(s => s.name === sizeName)
  const maxStock = found ? found.stock : (currentProduct.value?.stock ?? 1)
  if (quantity.value > maxStock) {
    quantity.value = Math.max(1, maxStock)
  }
}

const increaseQty = () => {
  const max = currentStock.value
  if (quantity.value < max) quantity.value++
}
const decreaseQty = () => { if (quantity.value > 1) quantity.value-- }


// ===== Review States =====
interface ReviewItem {
  id: number
  product_id: number
  user_id: number
  rating: number
  title: string
  body: string
  created_at: string
  user_name: string
  user_avatar?: string
}

interface ReviewSummary {
  total: number
  average: number
  counts: Record<number, number>
}

const reviews = ref<ReviewItem[]>([])
const reviewSummary = ref<ReviewSummary>({ total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
const userReview = ref<ReviewItem | null>(null)
const canReview = ref(false)
const purchaseStatusMessage = ref('')
const loadingReviews = ref(false)
const showReviewForm = ref(false)
const submittingReview = ref(false)

const reviewForm = ref({
  rating: 5,
  title: '',
  body: ''
})
const hoverRating = ref(0)

function setRating(star: number) {
  reviewForm.value.rating = star
}

async function fetchProduct() {
  loading.value = true
  try {
    const id = route.params.id
    const data = await $fetch(`/api/products/${id}`) as any
    currentProduct.value = data.product
    if (data.product && data.product.images && data.product.images.length > 0) {
      selectedImage.value = data.product.images[0]
    }
    // Auto-select first available in-stock size
    const firstInStock = parsedSizes.value.find(s => s.stock > 0)
    if (firstInStock) {
      selectedSize.value = firstInStock.name
    }
  } catch (e: any) {
    console.error('Failed to load product', e)
    router.push('/products')
  } finally {
    loading.value = false
  }
}

async function fetchReviews() {
  loadingReviews.value = true
  try {
    const id = route.params.id
    const data = await $fetch(`/api/products/${id}/reviews`) as any
    reviews.value = data.reviews || []
    reviewSummary.value = data.summary || { total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
    userReview.value = data.userReview || null
    canReview.value = !!data.canReview
    purchaseStatusMessage.value = data.purchaseStatusMessage || ''

    if (userReview.value) {
      reviewForm.value = {
        rating: userReview.value.rating,
        title: userReview.value.title || '',
        body: userReview.value.body || ''
      }
    }
  } catch (e) {
    console.error('Failed to fetch reviews', e)
  } finally {
    loadingReviews.value = false
  }
}

function openReviewModal() {
  if (!authStore.isLoggedIn) {
    router.push(`/login?redirect=${route.path}`)
    return
  }
  if (userReview.value) {
    reviewForm.value = {
      rating: userReview.value.rating,
      title: userReview.value.title || '',
      body: userReview.value.body || ''
    }
  } else {
    reviewForm.value = { rating: 5, title: '', body: '' }
  }
  showReviewForm.value = true
}

async function submitReview() {
  if (!reviewForm.value.rating || reviewForm.value.rating < 1 || reviewForm.value.rating > 5) {
    toast.warning('กรุณาให้คะแนน', 'กรุณาเลือกคะแนนดาว 1-5 ดาว')
    return
  }

  submittingReview.value = true
  try {
    const id = route.params.id
    await $fetch(`/api/products/${id}/reviews`, {
      method: 'POST',
      body: reviewForm.value
    })

    toast.success(userReview.value ? 'อัปเดตรีวิวสำเร็จ!' : 'บันทึกรีวิวสำเร็จ!', 'ขอบคุณสำหรับความคิดเห็นของคุณ')

    showReviewForm.value = false
    await fetchReviews()
  } catch (e: any) {
    toast.error('ไม่สามารถบันทึกรีวิวได้', e.data?.statusMessage || e.message)
  } finally {
    submittingReview.value = false
  }
}

async function deleteReview(reviewId: number) {
  const ok = await confirm({
    title: 'ลบรีวิวนี้?',
    message: 'คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้',
    confirmText: 'ลบเลย',
    type: 'danger'
  })
  if (!ok) return

  try {
    const id = route.params.id
    await $fetch(`/api/products/${id}/reviews/${reviewId}`, {
      method: 'DELETE'
    })

    toast.success('ลบแล้ว!', 'ลบรีวิวเรียบร้อย')
    await fetchReviews()
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  }
}

function formatReviewDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getStarPercent(star: number) {
  if (!reviewSummary.value.total) return 0
  const count = reviewSummary.value.counts[star] || 0
  return Math.round((count / reviewSummary.value.total) * 100)
}

onMounted(() => {
  fetchProduct()
  fetchReviews()
})

const addingToCart = ref(false)
const buyingNow = ref(false)

async function handleAddToCart() {
  if (!authStore.isLoggedIn) {
    router.push(`/login?redirect=${route.path}`)
    return
  }
  addingToCart.value = true
  try {
    const prod = currentProduct.value
    if (!prod) return
    if (prod.sizes && prod.sizes.length > 0 && !selectedSize.value) {
      toast.warning('กรุณาเลือกไซส์', 'กรุณาเลือกขนาดสินค้าก่อนเพิ่มลงตะกร้า')
      addingToCart.value = false
      return
    }
    const cartName = selectedSize.value ? `${prod.name} (${selectedSize.value})` : prod.name
    await cartStore.addToCart({
      id: prod.id,
      name: cartName,
      price: prod.price,
      img: prod.images[0]
    }, quantity.value)
    
    toast.success('เพิ่มสินค้าลงตะกร้าแล้ว!', prod.name)
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
  } finally {
    addingToCart.value = false
  }
}

async function handleBuyNow() {
  if (!authStore.isLoggedIn) {
    router.push(`/login?redirect=${route.path}`)
    return
  }
  buyingNow.value = true
  try {
    const prod = currentProduct.value
    if (!prod) return
    if (prod.sizes && prod.sizes.length > 0 && !selectedSize.value) {
      toast.warning('กรุณาเลือกไซส์', 'กรุณาเลือกขนาดสินค้าก่อนซื้อ')
      buyingNow.value = false
      return
    }
    const cartName = selectedSize.value ? `${prod.name} (${selectedSize.value})` : prod.name
    await cartStore.addToCart({
      id: prod.id,
      name: cartName,
      price: prod.price,
      img: prod.images[0]
    }, quantity.value)
    router.push('/cart')
  } catch (e: any) {
    toast.error('เกิดข้อผิดพลาด', e.data?.statusMessage || e.message)
    buyingNow.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-10 transition-colors duration-300">
    
    <!-- Loading skeleton state -->
    <div v-if="loading" class="space-y-12">
      <!-- Breadcrumb Skeleton -->
      <div class="flex items-center space-x-2">
        <AppSkeleton width="60px" height="14px" />
        <span class="text-slate-500">/</span>
        <AppSkeleton width="100px" height="14px" />
        <span class="text-slate-500">/</span>
        <AppSkeleton width="140px" height="14px" />
      </div>

      <!-- Main Product Details Card Skeleton -->
      <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Gallery Skeleton -->
        <div class="space-y-4">
          <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327]">
            <AppSkeleton width="100%" height="100%" rounded="none" />
          </div>
          <div class="flex space-x-3">
            <AppSkeleton v-for="i in 4" :key="i" width="70px" height="70px" rounded="xl" />
          </div>
        </div>

        <!-- Info Skeleton -->
        <div class="space-y-6 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <AppSkeleton width="80px" height="24px" variant="badge" />
              <AppSkeleton width="100px" height="24px" variant="badge" />
            </div>
            <AppSkeleton width="90%" height="28px" />
            <AppSkeleton width="50%" height="20px" />
            <AppSkeleton width="120px" height="36px" />
            <div class="space-y-2 pt-4 border-t border-slate-100 dark:border-[#212327]">
              <AppSkeleton width="100%" height="14px" />
              <AppSkeleton width="95%" height="14px" />
              <AppSkeleton width="80%" height="14px" />
            </div>
          </div>
          <div class="space-y-3 pt-6 border-t border-slate-100 dark:border-[#212327]">
            <div class="flex gap-4">
              <AppSkeleton width="120px" height="48px" rounded="2xl" />
              <AppSkeleton width="100%" height="48px" rounded="2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="currentProduct" class="space-y-12">
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        <NuxtLink to="/" class="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1">
          <Icon name="lucide:home" class="w-3.5 h-3.5" />
          <span>หน้าหลัก</span>
        </NuxtLink>
        <span>/</span>
        <NuxtLink to="/products" class="hover:text-blue-600 dark:hover:text-blue-400 transition">รายการชุดทั้งหมด</NuxtLink>
        <span>/</span>
        <span class="text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{{ currentProduct.name }}</span>
      </div>

      <!-- Main Product Details Card -->
      <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl shadow-sm p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 transition-colors duration-300">
        
        <!-- Image Gallery -->
        <div class="space-y-4">
          <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] relative">
            <img :src="selectedImage" class="w-full h-full object-cover" alt="Main product display">
            <span class="absolute top-4 left-4 bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-xl shadow-md">
              {{ currentProduct.tag }}
            </span>
          </div>
          
          <div class="flex space-x-3 overflow-x-auto py-1">
            <button 
              v-for="(img, idx) in currentProduct.images" 
              :key="idx" 
              @click="selectedImage = img"
              :class="selectedImage === img ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-[#212327] bg-slate-50 dark:bg-[#0a0a0a]'"
              class="w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition duration-200"
            >
              <img :src="img" class="w-full h-full object-cover" alt="Thumbnail">
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="flex flex-col justify-between space-y-6">
          <div class="space-y-5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs font-bold px-3 py-1.5 rounded-xl inline-block">
                ● {{ currentProduct.status }}
              </span>
              <!-- Rating Pill -->
              <div v-if="reviewSummary.total > 0" class="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-3 py-1.5 rounded-xl text-xs font-black text-amber-600 dark:text-amber-400">
                <Icon name="lucide:star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{{ reviewSummary.average }}</span>
                <span class="text-amber-500/70 font-semibold">({{ reviewSummary.total }} รีวิว)</span>
              </div>
            </div>
            
            <h1 class="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 leading-snug">
              {{ currentProduct.name }}
            </h1>

            <!-- Promotion Banner -->
            <div v-if="currentProduct.has_promo" class="p-4 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-rose-500/10 border border-pink-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white text-base shadow-sm flex-shrink-0">
                  <Icon name="lucide:flame" class="w-5 h-5" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-black text-xs text-pink-600 dark:text-pink-400">{{ currentProduct.promo.badge }}</span>
                    <span class="text-xs font-black text-slate-800 dark:text-slate-200">{{ currentProduct.promo.title }}</span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">รับส่วนลด {{ currentProduct.promo.discount_text }} พิเศษทันทีเมื่อกดสั่งซื้อ</p>
                </div>
              </div>
              <span class="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md flex-shrink-0 animate-pulse">
                -{{ currentProduct.promo.discount_text }}
              </span>
            </div>

            <div class="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] p-4 rounded-2xl flex items-baseline justify-between flex-wrap gap-2">
              <div class="flex items-baseline space-x-3">
                <span class="text-2xl md:text-3xl font-black text-pink-600 dark:text-pink-400">฿{{ currentProduct.price }}</span>
                <span v-if="currentProduct.has_promo || currentProduct.original_price > currentProduct.price" class="text-slate-400 text-sm line-through font-bold">
                  ฿{{ currentProduct.original_price }}
                </span>
              </div>
              <span v-if="currentProduct.has_promo" class="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black text-xs px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-900/50">
                ประหยัด ฿{{ currentProduct.promo_discount }}
              </span>
            </div>

            <div class="space-y-2">
              <h3 class="text-sm font-black text-slate-800 dark:text-slate-200">รายละเอียดสินค้า</h3>
              <p class="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ currentProduct.description }}</p>
            </div>

            <div v-if="currentProduct.details && currentProduct.details.length > 0" class="border border-slate-200 dark:border-[#212327] rounded-2xl overflow-hidden text-xs md:text-sm">
              <div
                v-for="(spec, idx) in currentProduct.details"
                :key="idx"
                :class="Number(idx) % 2 === 0 ? 'bg-slate-50/80 dark:bg-[#0a0a0a]' : 'bg-white dark:bg-[#191919]'"
                class="px-4 py-3 border-b border-slate-200 dark:border-[#212327]/50 last:border-none font-semibold text-slate-700 dark:text-slate-200"
              >
                <template v-if="typeof spec === 'string'">{{ spec }}</template>
                <template v-else>
                  <span class="font-bold text-slate-500 dark:text-slate-400 mr-2">{{ spec.label }}</span>
                  <span>{{ spec.value }}</span>
                </template>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-200 dark:border-[#212327] pt-6 space-y-4">
            <!-- Size Selection with Individual Stock -->
            <div v-if="parsedSizes && parsedSizes.length > 0" class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-black text-slate-700 dark:text-slate-300">
                  Size
                  <span v-if="selectedSize" class="ml-2 text-blue-600 dark:text-blue-400 font-black">— {{ selectedSize }}</span>
                </h3>
              </div>
              <div class="flex flex-wrap gap-2.5">
                <button
                  v-for="s in parsedSizes" :key="s.name"
                  type="button"
                  :disabled="s.stock <= 0"
                  @click="selectSize(s.name)"
                  :class="[
                    selectedSize === s.name
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 scale-105'
                      : s.stock <= 0
                        ? 'bg-slate-100 dark:bg-[#191919] text-slate-400 dark:text-slate-600 border-slate-200 dark:border-[#212327] line-through cursor-not-allowed opacity-50'
                        : 'bg-white dark:bg-[#0a0a0a] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-750 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                  ]"
                  class="min-w-[54px] px-3.5 py-2 rounded-xl border-2 font-black text-xs transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{{ s.name }}</span>
                  <span v-if="s.stock > 0" class="text-[10px] font-bold opacity-80">({{ s.stock }})</span>
                  <span v-else class="text-[10px] text-rose-500 font-bold">(หมด)</span>
                </button>
              </div>
              <p v-if="!selectedSize" class="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5" />
                <span>กรุณาเลือกไซส์ก่อนเพิ่มลงตะกร้า</span>
              </p>
            </div>

            <!-- Quantity Stepper -->
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-sm font-black text-slate-700 dark:text-slate-300">จำนวนที่ต้องการสั่งซื้อ</span>
                <span v-if="currentStock > 0" class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  คงเหลือ {{ currentStock }} ชิ้น <span v-if="selectedSize" class="font-bold text-blue-600 dark:text-blue-400">(ไซส์ {{ selectedSize }})</span>
                </span>
                <span v-else class="text-[11px] text-rose-500 font-bold mt-0.5">
                  สินค้าไซส์นี้หมดชั่วคราว
                </span>
              </div>
              <div class="flex items-center space-x-1 p-1 rounded-2xl border border-slate-200 dark:border-[#212327] bg-slate-50 dark:bg-[#0a0a0a]">
                <button 
                  type="button"
                  @click="decreaseQty" 
                  :disabled="quantity <= 1 || currentStock <= 0"
                  class="w-9 h-9 font-black text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-[#212327] rounded-xl transition disabled:opacity-30 flex items-center justify-center"
                >
                  <Icon name="lucide:minus" class="w-4 h-4" />
                </button>
                <input
                  type="number"
                  v-model.number="quantity"
                  min="1"
                  :max="currentStock > 0 ? currentStock : 1"
                  :disabled="currentStock <= 0"
                  @change="() => {
                    if (!quantity || quantity < 1) quantity = 1
                    else if (quantity > currentStock) quantity = Math.max(1, currentStock)
                  }"
                  class="w-10 text-center text-sm font-black text-slate-800 dark:text-slate-200 bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-40"
                />
                <button 
                  type="button"
                  @click="increaseQty" 
                  :disabled="currentStock <= 0 || quantity >= currentStock"
                  class="w-9 h-9 font-black text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-[#212327] rounded-xl transition disabled:opacity-30 flex items-center justify-center"
                >
                  <Icon name="lucide:plus" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button 
                type="button"
                @click="handleAddToCart"
                :disabled="addingToCart || currentStock <= 0"
                class="bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-bold py-3.5 rounded-2xl text-xs md:text-sm transition duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon v-if="addingToCart" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                <template v-else>
                  <Icon name="lucide:shopping-cart" class="w-4 h-4" />
                  <span>เพิ่มลงตะกร้า</span>
                </template>
              </button>
              <button 
                type="button"
                @click="handleBuyNow"
                :disabled="buyingNow || currentStock <= 0"
                class="bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl text-xs md:text-sm transition duration-200 shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon v-if="buyingNow" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                <span>ซื้อสินค้าทันที</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ================= REVIEWS SECTION ================= -->
      <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl p-6 md:p-8 space-y-8 shadow-sm">
        
        <!-- Reviews Header & Overall Score -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[#212327]">
          <div>
            <div class="flex items-center gap-2">
              <Icon name="lucide:star" class="w-6 h-6 fill-amber-400 text-amber-400" />
              <h2 class="text-xl md:text-2xl font-black text-slate-800 dark:text-white">รีวิวและความคิดเห็น</h2>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">รีวิวจากลูกค้าที่สั่งซื้อสินค้าจริง</p>
          </div>

          <!-- Write Review Button -->
          <div>
            <template v-if="canReview">
              <button
                @click="openReviewModal"
                class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs md:text-sm font-black px-5 py-3 rounded-2xl transition shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
              >
                <Icon :name="userReview ? 'lucide:pencil-line' : 'lucide:pencil'" class="w-4 h-4" />
                <span>{{ userReview ? 'แก้ไขรีวิวของคุณ' : 'เขียนรีวิวสินค้า' }}</span>
              </button>
            </template>
            <template v-else-if="!authStore.isLoggedIn">
              <NuxtLink
                :to="`/login?redirect=${route.path}`"
                class="bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Icon name="lucide:log-in" class="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบเพื่อเขียนรีวิว</span>
              </NuxtLink>
            </template>
            <template v-else>
              <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl px-4 py-2 text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Icon name="lucide:info" class="w-4 h-4 flex-shrink-0" />
                <span>{{ purchaseStatusMessage || 'เฉพาะผู้ที่เคยสั่งซื้อสินค้านี้เท่านั้นจึงจะรีวิวได้' }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Rating Breakdown Summary -->
        <div v-if="reviewSummary.total > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-[#0a0a0a] p-6 rounded-2xl border border-slate-200 dark:border-[#212327]">
          <!-- Big Score -->
          <div class="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-[#212327] pb-4 md:pb-0 md:pr-6">
            <span class="text-4xl md:text-5xl font-black text-slate-800 dark:text-white">{{ reviewSummary.average }}</span>
            <div class="flex items-center gap-1 text-amber-400 my-2">
              <template v-for="star in 5" :key="star">
                <Icon
                  name="lucide:star"
                  class="w-4 h-4"
                  :class="star <= Math.round(Number(reviewSummary.average)) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'"
                />
              </template>
            </div>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-bold">จากทั้งหมด {{ reviewSummary.total }} รีวิว</span>
          </div>

          <!-- Rating Bars -->
          <div class="md:col-span-2 space-y-2 flex flex-col justify-center">
            <div
              v-for="star in [5, 4, 3, 2, 1]"
              :key="star"
              class="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              <span class="w-12 flex items-center gap-1">
                <span>{{ star }}</span>
                <Icon name="lucide:star" class="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
              <div class="flex-1 h-2 bg-slate-200 dark:bg-[#191919] rounded-full overflow-hidden">
                <div
                  class="h-full bg-amber-400 rounded-full transition-all duration-300"
                  :style="{ width: `${getRatingPercentage(star)}%` }"
                />
              </div>
              <span class="w-8 text-right text-[11px] text-slate-400">{{ reviewSummary.counts[star] || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <div v-if="loadingReviews" class="py-12 flex justify-center items-center">
          <Icon name="lucide:loader-2" class="w-6 h-6 text-blue-500 animate-spin" />
        </div>

        <div v-else-if="reviews.length === 0" class="text-center py-12 space-y-3">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#191919] flex items-center justify-center mx-auto text-slate-400">
            <Icon name="lucide:message-square" class="w-7 h-7" />
          </div>
          <p class="text-sm font-bold text-slate-600 dark:text-slate-400">ยังไม่มีรีวิวสำหรับสินค้านี้</p>
          <p class="text-xs text-slate-400 dark:text-slate-500">เป็นคนแรกที่แชร์ความคิดเห็นเกี่ยวกับสินค้านี้!</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="rev in reviews"
            :key="rev.id"
            class="bg-slate-50/60 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327]/70 rounded-2xl p-5 space-y-3 transition hover:border-slate-200 dark:hover:border-slate-700"
          >
            <!-- Review Header -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <!-- Avatar -->
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-800/60">
                  <img v-if="rev.user_avatar" :src="rev.user_avatar" :alt="rev.user_name" class="w-full h-full object-cover" />
                  <span v-else>{{ (rev.user_name || 'U').charAt(0).toUpperCase() }}</span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-black text-xs md:text-sm text-slate-800 dark:text-slate-200">{{ rev.user_name }}</span>
                    <span class="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-0.5">
                      <Icon name="lucide:check-check" class="w-2.5 h-2.5" />
                      ผู้ซื้อจริง
                    </span>
                  </div>
                  <span class="text-[10px] text-slate-400 dark:text-slate-500">{{ formatReviewDate(rev.created_at) }}</span>
                </div>
              </div>

              <!-- Delete / Edit actions if author or admin -->
              <div class="flex items-center gap-2">
                <!-- Stars -->
                <div class="flex items-center gap-0.5 bg-white dark:bg-[#191919] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-[#212327]">
                  <template v-for="star in 5" :key="star">
                    <Icon
                      name="lucide:star"
                      class="w-3.5 h-3.5"
                      :class="star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'"
                    />
                  </template>
                </div>
                <button
                  v-if="(authStore.isLoggedIn && authStore.user?.id === rev.user_id) || authStore.isAdmin"
                  @click="deleteReview(rev.id)"
                  title="ลบรีวิวนี้"
                  class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Review Title -->
            <h4 v-if="rev.title" class="font-black text-xs md:text-sm text-slate-800 dark:text-slate-200">
              {{ rev.title }}
            </h4>

            <!-- Review Body -->
            <p v-if="rev.body" class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {{ rev.body }}
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- ================= REVIEW MODAL ================= -->
    <div v-if="showReviewForm" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-[#191919] border border-slate-200 dark:border-[#212327] rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-6">
        
        <div class="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-[#212327]">
          <div class="flex items-center gap-2">
            <Icon name="lucide:pencil" class="w-5 h-5 text-blue-500" />
            <h2 class="text-base font-black text-slate-800 dark:text-white">
              {{ userReview ? 'แก้ไขรีวิวสินค้า' : 'เขียนรีวิวสินค้า' }}
            </h2>
          </div>
          <button @click="showReviewForm = false" class="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="submitReview" class="space-y-5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          
          <!-- Rating Star Selector -->
          <div class="space-y-3 text-center bg-slate-50 dark:bg-[#0a0a0a] p-5 rounded-2xl border border-slate-200 dark:border-[#212327]">
            <label class="block font-bold text-slate-600 dark:text-slate-400 text-xs">ให้คะแนนความพึงพอใจของคุณ *</label>
            
            <!-- Large Star Buttons -->
            <div class="flex items-center justify-center gap-2 py-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click.prevent="setRating(star)"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                class="p-2 transition-all transform hover:scale-125 focus:outline-none cursor-pointer rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                <Icon
                  name="lucide:star"
                  class="w-9 h-9 transition-colors pointer-events-none"
                  :class="star <= (hoverRating || reviewForm.rating) ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-slate-300 dark:text-slate-700'"
                />
              </button>
            </div>

            <!-- Quick Star Pills -->
            <div class="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <button
                v-for="star in [1, 2, 3, 4, 5]"
                :key="star"
                type="button"
                @click.prevent="setRating(star)"
                :class="reviewForm.rating === star
                  ? 'bg-amber-500 text-white font-black shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-white dark:bg-[#191919] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#212327] hover:border-amber-400 font-bold'"
                class="px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
              >
                <span>{{ star }}</span>
                <Icon name="lucide:star" class="w-3 h-3 fill-current" />
              </button>
            </div>

            <!-- Rating Label Description -->
            <p v-if="hoverRating || reviewForm.rating" class="text-xs font-black text-amber-500 pt-1 flex items-center justify-center gap-1.5">
              <span class="flex items-center gap-0.5">
                <Icon
                  v-for="n in (hoverRating || reviewForm.rating)"
                  :key="n"
                  name="lucide:star"
                  class="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                />
              </span>
              <span>{{
                (hoverRating || reviewForm.rating) === 5 ? 'ยอดเยี่ยมมาก!' :
                (hoverRating || reviewForm.rating) === 4 ? 'ดีมาก' :
                (hoverRating || reviewForm.rating) === 3 ? 'พอใช้ได้' :
                (hoverRating || reviewForm.rating) === 2 ? 'ควรปรับปรุง' : 'ไม่พอใจ'
              }}</span>
            </p>
          </div>

          <!-- Review Title -->
          <div class="space-y-1.5">
            <label class="block font-bold">หัวข้อรีวิว (ถ้ามี)</label>
            <input
              v-model="reviewForm.title"
              type="text"
              placeholder="เช่น เนื้อผ้าดีมาก ทรงสวยตรงปก คุ้มราคา"
              class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <!-- Review Body -->
          <div class="space-y-1.5">
            <label class="block font-bold">ความคิดเห็น / รายละเอียด *</label>
            <textarea
              v-model="reviewForm.body"
              rows="4"
              placeholder="บอกเล่าความรู้สึกและประสบการณ์หลังจากที่คุณได้รับสินค้า..."
              class="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#212327] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              @click="showReviewForm = false"
              class="px-5 py-2.5 bg-slate-100 dark:bg-[#191919] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              :disabled="submittingReview"
              class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-60 flex items-center gap-2"
            >
              <Icon v-if="submittingReview" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <span>{{ submittingReview ? 'กำลังบันทึก...' : userReview ? 'อัปเดตรีวิว' : 'ส่งรีวิว' }}</span>
            </button>
          </div>

        </form>

      </div>
    </div>

  </div>
</template>