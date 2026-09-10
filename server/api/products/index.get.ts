function safeJsonParse(value: any, fallback: any = []) {
  if (!value) return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return typeof fallback === 'string' ? value : [value]
  }
}

export default defineEventHandler(async (event) => {
  const db = getDb()
  const products = await db.prepare('SELECT * FROM products ORDER BY id DESC').all() as any[]
  const activePromos = await getActivePromotions(db)

  // Parse images, details and calculate active promotion discount
  const formattedProducts = products.map(p => {
    const basePrice = Number(p.price || 0)
    const promoCalc = applyBestPromotion(basePrice, activePromos, p.category)

    return {
      ...p,
      images: safeJsonParse(p.images, []),
      details: safeJsonParse(p.details, []),
      sizes: safeJsonParse(p.sizes, []),
      base_price: basePrice,
      original_price: p.original_price || basePrice,
      price: promoCalc.finalPrice,
      promo_discount: promoCalc.promoDiscount,
      has_promo: promoCalc.hasPromo,
      promo: promoCalc.promo
    }
  })

  return { products: formattedProducts, activePromos }
})
