export function parseDiscount(text: string): { type: 'percent' | 'fixed' | 'free_shipping'; value: number } | null {
  if (!text) return null
  const cleaned = text.trim().replace(/\s+/g, '')
  
  // Free shipping check: e.g. "ส่งฟรี", "ฟรีค่าส่ง", "ฟรีค่าจัดส่ง", "free shipping"
  if (/(?:ส่งฟรี|ฟรีค่าส่ง|ฟรีค่าจัดส่ง|freeshipping)/i.test(cleaned)) {
    return { type: 'free_shipping', value: 100 }
  }

  // Percent match: e.g. "99%", "ลด99%", "10%", "ลด10%"
  const percentMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*%/i) || cleaned.match(/ลด\s*(\d+(?:\.\d+)?)(?!บาท|บ)/i)
  if (percentMatch && percentMatch[1]) {
    const val = parseFloat(percentMatch[1])
    if (!isNaN(val) && val > 0 && val <= 100) {
      return { type: 'percent', value: val }
    }
  }

  // Fixed amount match: e.g. "ลด50บาท", "50บาท", "ลด50บ"
  const fixedMatch = cleaned.match(/ลด\s*(\d+(?:\.\d+)?)\s*(?:บาท|บ)?/i) || cleaned.match(/(\d+(?:\.\d+)?)\s*(?:บาท|บ)/i)
  if (fixedMatch && fixedMatch[1]) {
    const val = parseFloat(fixedMatch[1])
    if (!isNaN(val) && val > 0) {
      return { type: 'fixed', value: val }
    }
  }

  return null
}

export async function getActivePromotions(db: any) {
  const allPromos = await db.prepare(`
    SELECT * FROM promotions
    WHERE is_active = 1
    ORDER BY created_at DESC
  `).all() as any[]

  const now = new Date()
  return allPromos.filter(p => {
    if (p.start_date) {
      const start = new Date(p.start_date)
      if (start.getTime() > now.getTime()) return false
    }
    if (p.end_date) {
      const end = new Date(p.end_date)
      if (typeof p.end_date === 'string' && p.end_date.length === 10) {
        end.setHours(23, 59, 59, 999)
      }
      if (end.getTime() < now.getTime()) return false
    }
    return true
  })
}

export function applyBestPromotion(productPrice: number, activePromotions: any[], productCategory?: string) {
  if (!activePromotions || activePromotions.length === 0 || productPrice <= 0) {
    return {
      finalPrice: productPrice,
      originalPrice: productPrice,
      hasPromo: false,
      promoDiscount: 0,
      promo: null
    }
  }

  let bestPromo: any = null
  let bestDiscountAmount = 0
  let bestFinalPrice = productPrice

  const productPromos = activePromotions.filter(p => {
    // Exclude shipping-only promotions
    if (p.promo_type === 'shipping') return false
    
    // Check target category
    const targetCat = (p.target_category || 'ALL').toUpperCase()
    if (targetCat !== 'ALL') {
      const prodCat = (productCategory || '').toUpperCase()
      if (targetCat !== prodCat) return false
    }
    return true
  })

  for (const promo of productPromos) {
    const discount = parseDiscount(promo.discount_text || promo.title)
    if (!discount || discount.type === 'free_shipping') continue

    let discountAmount = 0
    if (discount.type === 'percent') {
      discountAmount = (productPrice * discount.value) / 100
    } else if (discount.type === 'fixed') {
      discountAmount = discount.value
    }

    if (discountAmount > bestDiscountAmount) {
      bestDiscountAmount = discountAmount
      bestFinalPrice = Math.max(1, Math.round(productPrice - discountAmount))
      bestPromo = {
        id: promo.id,
        title: promo.title,
        badge: promo.badge,
        discount_text: promo.discount_text,
        discount_value: discount.value,
        discount_type: discount.type,
        target_category: promo.target_category || 'ALL',
        promo_type: promo.promo_type || 'product',
        end_date: promo.end_date
      }
    }
  }

  return {
    finalPrice: bestFinalPrice,
    originalPrice: productPrice,
    hasPromo: !!bestPromo,
    promoDiscount: Math.round(bestDiscountAmount),
    promo: bestPromo
  }
}

export function calculateShippingFee(subtotal: number, activePromotions: any[], baseShippingFee = 50) {
  if (subtotal <= 0) {
    return {
      baseShippingFee: 0,
      shippingDiscount: 0,
      finalShippingFee: 0,
      promo: null
    }
  }

  const shippingPromos = (activePromotions || []).filter(p => {
    const isShippingType = p.promo_type === 'shipping'
    const isShippingText = /(?:ส่งฟรี|ฟรีค่าส่ง|ฟรีค่าจัดส่ง|ลดค่าส่ง)/i.test(p.discount_text || p.title || p.badge || '')
    if (!isShippingType && !isShippingText) return false

    // Check minimum spend if configured
    if (p.min_spend && Number(p.min_spend) > subtotal) {
      return false
    }
    return true
  })

  let bestPromo: any = null
  let bestDiscountAmount = 0

  for (const promo of shippingPromos) {
    const discount = parseDiscount(promo.discount_text || promo.title)
    let discountAmount = 0

    if (!discount || discount.type === 'free_shipping') {
      discountAmount = baseShippingFee
    } else if (discount.type === 'percent') {
      discountAmount = (baseShippingFee * discount.value) / 100
    } else if (discount.type === 'fixed') {
      discountAmount = Math.min(baseShippingFee, discount.value)
    }

    if (discountAmount > bestDiscountAmount) {
      bestDiscountAmount = discountAmount
      bestPromo = {
        id: promo.id,
        title: promo.title,
        badge: promo.badge,
        discount_text: promo.discount_text,
        promo_type: 'shipping',
        min_spend: promo.min_spend || 0
      }
    }
  }

  const finalShipping = Math.max(0, Math.round(baseShippingFee - bestDiscountAmount))

  return {
    baseShippingFee,
    shippingDiscount: Math.round(bestDiscountAmount),
    finalShippingFee: finalShipping,
    promo: bestPromo
  }
}
