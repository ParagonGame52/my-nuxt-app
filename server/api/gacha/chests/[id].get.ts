export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสตู้สุ่ม' })

  const db = getDb()
  const chest = await db.prepare('SELECT * FROM gacha_chests WHERE id = ? AND is_active = 1').get(Number(id)) as any
  if (!chest) {
    throw createError({ statusCode: 404, statusMessage: 'ไม่พบตู้สุ่มนี้ หรือตู้สุ่มยังไม่เปิดใช้งาน' })
  }

  // Get prizes pool - exclude out of stock items
  const items = await db.prepare(`
    SELECT gci.id, gci.name, gci.image, gci.price, gci.tier, gci.odds, gci.product_id, gci.stock
    FROM gacha_chest_items gci
    WHERE gci.chest_id = ? AND (gci.stock IS NULL OR gci.stock > 0)
    ORDER BY gci.id ASC
  `).all(Number(id)) as any[]

  const totalWeight = items.reduce((sum: number, item: any) => sum + (item.odds ?? 100), 0)

  const pool = items.map(item => ({
    id: item.id,
    name: item.name || 'ของรางวัล',
    img: item.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    tier: item.tier ? item.tier.toLowerCase() : 'normal',
    odds: item.odds ?? 100,
    chance: totalWeight > 0 ? Math.round(((item.odds ?? 100) / totalWeight) * 1000) / 10 : 0,
    stock: item.stock ?? null
  }))

  return { success: true, chest, pool }
})
