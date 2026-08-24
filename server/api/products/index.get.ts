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
      images: JSON.parse(p.images),
      details: JSON.parse(p.details),
      sizes: JSON.parse(p.sizes || '[]'),
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
