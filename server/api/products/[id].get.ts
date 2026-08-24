export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสสินค้า' })

  const db = getDb()
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id)) as any

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบสินค้านี้ในระบบ' })
  }

  const activePromos = await getActivePromotions(db)
  const basePrice = Number(product.price || 0)
  const promoCalc = applyBestPromotion(basePrice, activePromos, product.category)

  return {
    product: {
      ...product,
      images: JSON.parse(product.images),
      details: JSON.parse(product.details),
      sizes: JSON.parse(product.sizes || '[]'),
      base_price: basePrice,
      original_price: product.original_price || basePrice,
      price: promoCalc.finalPrice,
      promo_discount: promoCalc.promoDiscount,
      has_promo: promoCalc.hasPromo,
      promo: promoCalc.promo
    }
  }
})
