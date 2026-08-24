import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

interface CartItem {
  product_id: number
  product_name: string
  product_price: number
  product_img: string
  quantity: number
  stock_quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const loading = ref(false)
  const authStore = useAuthStore()

  const activePromos = ref<any[]>([])

  const totalItems = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const subtotal = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.product_price * item.quantity), 0)
  })

  // Tier Discount calculation (Platinum 15%, Gold 10%, Silver 5%)
  const userTier = computed(() => ((authStore.user as any)?.tier || 'bronze').toLowerCase())
  const tierDiscountRate = computed(() => {
    switch (userTier.value) {
      case 'platinum': return 0.15
      case 'gold': return 0.10
      case 'silver': return 0.05
      default: return 0
    }
  })

  const tierMultiplier = computed(() => {
    switch (userTier.value) {
      case 'platinum': return 5
      case 'gold': return 3
      case 'silver': return 2
      default: return 1
    }
  })

  const tierDiscountAmount = computed(() => {
    if (subtotal.value <= 0 || tierDiscountRate.value <= 0) return 0
    return Math.round(subtotal.value * tierDiscountRate.value)
  })

  const discountedSubtotal = computed(() => {
    return Math.max(0, subtotal.value - tierDiscountAmount.value)
  })

  // Shipping calculation (based on discountedSubtotal)
  const shippingCalculation = computed(() => {
    if (items.value.length === 0 || discountedSubtotal.value <= 0) {
      return {
        baseShippingFee: 0,
        shippingDiscount: 0,
        finalShippingFee: 0,
        promo: null
      }
    }

    const baseShippingFee = 50
    const shippingPromos = activePromos.value.filter(p => {
      const isShippingType = p.promo_type === 'shipping'
      const isShippingText = /(?:ส่งฟรี|ฟรีค่าส่ง|ฟรีค่าจัดส่ง|ลดค่าส่ง)/i.test(p.discount_text || p.title || p.badge || '')
      if (!isShippingType && !isShippingText) return false

      if (p.min_spend && Number(p.min_spend) > discountedSubtotal.value) {
        return false
      }
      return true
    })

    let bestPromo: any = null
    let bestDiscountAmount = 0

    for (const promo of shippingPromos) {
      const rawText = promo.discount_text || promo.title || ''
      const cleaned = rawText.trim().replace(/\s+/g, '')

      let discountAmount = 0
      if (/(?:ส่งฟรี|ฟรีค่าส่ง|ฟรีค่าจัดส่ง|freeshipping)/i.test(cleaned)) {
        discountAmount = baseShippingFee
      } else {
        const percentMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*%/i) || cleaned.match(/ลด\s*(\d+(?:\.\d+)?)(?!บาท|บ)/i)
        const fixedMatch = cleaned.match(/ลด\s*(\d+(?:\.\d+)?)\s*(?:บาท|บ)?/i) || cleaned.match(/(\d+(?:\.\d+)?)\s*(?:บาท|บ)/i)
        if (percentMatch && percentMatch[1]) {
          discountAmount = (baseShippingFee * parseFloat(percentMatch[1])) / 100
        } else if (fixedMatch && fixedMatch[1]) {
          discountAmount = Math.min(baseShippingFee, parseFloat(fixedMatch[1]))
        } else {
          discountAmount = baseShippingFee
        }
      }

      if (discountAmount > bestDiscountAmount) {
        bestDiscountAmount = discountAmount
        bestPromo = promo
      }
    }

    const finalShippingFee = Math.max(0, Math.round(baseShippingFee - bestDiscountAmount))

    return {
      baseShippingFee,
      shippingDiscount: Math.round(bestDiscountAmount),
      finalShippingFee,
      promo: bestPromo
    }
  })

  const shippingFee = computed(() => shippingCalculation.value.finalShippingFee)
  const shippingDiscount = computed(() => shippingCalculation.value.shippingDiscount)
  const baseShippingFee = computed(() => shippingCalculation.value.baseShippingFee)
  const activeShippingPromo = computed(() => shippingCalculation.value.promo)
  const totalPrice = computed(() => discountedSubtotal.value + shippingFee.value)

  const earnedPoints = computed(() => {
    return Math.floor(totalPrice.value / 100) * tierMultiplier.value
  })

  async function fetchCart() {
    if (!authStore.isLoggedIn) {
      items.value = []
      return
    }
    loading.value = true
    try {
      const fetch = useRequestFetch()
      const [cartData, promoData] = await Promise.all([
        fetch<{ items: CartItem[] }>('/api/cart'),
        fetch<{ promotions: any[] }>('/api/promotions').catch(() => ({ promotions: [] }))
      ])
      items.value = cartData.items
      activePromos.value = promoData.promotions || []
    } catch (e) {
      console.error('Failed to fetch cart', e)
    } finally {
      loading.value = false
    }
  }

  async function addToCart(product: { id: number; name: string; price: number; img: string }, qty = 1) {
    if (!authStore.isLoggedIn) {
      throw new Error('UNAUTHORIZED')
    }
    
    await $fetch('/api/cart', {
      method: 'POST',
      body: {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        product_img: product.img,
        quantity: qty
      }
    })
    await fetchCart()
  }

  async function updateQty(productId: number, qty: number) {
    if (!authStore.isLoggedIn) return
    if (qty < 1) return

    const item = items.value.find(i => i.product_id === productId)
    if (item && item.stock_quantity > 0) {
      qty = Math.min(qty, item.stock_quantity)
    }

    await $fetch(`/api/cart/${productId}`, {
      method: 'PATCH',
      body: { quantity: qty }
    })
    
    if (item) {
      item.quantity = qty
    }
  }

  async function removeItem(productId: number) {
    if (!authStore.isLoggedIn) return

    await $fetch(`/api/cart/${productId}`, {
      method: 'DELETE'
    })
    
    items.value = items.value.filter(i => i.product_id !== productId)
  }

  return {
    items,
    loading,
    totalItems,
    subtotal,
    userTier,
    tierDiscountRate,
    tierDiscountAmount,
    tierMultiplier,
    discountedSubtotal,
    baseShippingFee,
    shippingFee,
    shippingDiscount,
    activeShippingPromo,
    totalPrice,
    earnedPoints,
    fetchCart,
    addToCart,
    updateQty,
    removeItem
  }
})
