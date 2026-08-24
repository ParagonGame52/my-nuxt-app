export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const db = getDb()
  const chests = await db.prepare('SELECT * FROM gacha_chests ORDER BY id DESC').all() as any[]

  for (const chest of chests) {
    const items = await db.prepare(`
      SELECT gci.id, gci.name, gci.image, gci.price, gci.tier, gci.odds, gci.product_id, gci.stock
      FROM gacha_chest_items gci
      WHERE gci.chest_id = ?
      ORDER BY gci.id ASC
    `).all(chest.id) as any[]

    chest.items = items.map(item => ({
      id: item.id,
      name: item.name || 'ของรางวัล',
      price: item.price || 0,
      image: item.image || '',
      tier: item.tier || 'normal',
      odds: item.odds ?? 100,
      product_id: item.product_id,
      stock: item.stock ?? null
    }))
  }

  return { success: true, chests }
})
