export default defineEventHandler(async (event) => {
  const db = getDb()
  const chests = await db.prepare(`
    SELECT gc.*, 
      (
        SELECT COUNT(*) 
        FROM gacha_chest_items gci 
        WHERE gci.chest_id = gc.id AND (gci.stock IS NULL OR gci.stock > 0)
      ) as prize_count,
      (
        SELECT COUNT(*) 
        FROM gacha_chest_items gci 
        WHERE gci.chest_id = gc.id
      ) as total_prizes,
      (
        SELECT COALESCE(SUM(gci.stock), 0)
        FROM gacha_chest_items gci 
        WHERE gci.chest_id = gc.id AND gci.stock IS NOT NULL
      ) as total_stock,
      (
        SELECT COUNT(*)
        FROM gacha_chest_items gci
        WHERE gci.chest_id = gc.id AND gci.stock IS NULL
      ) as unlimited_count
    FROM gacha_chests gc
    WHERE gc.is_active = 1
    ORDER BY gc.id ASC
  `).all() as any[]

  return { 
    success: true, 
    chests: chests.map(c => ({
      ...c,
      prize_count: Number(c.prize_count || 0),
      total_prizes: Number(c.total_prizes || 0),
      total_stock: Number(c.total_stock || 0),
      unlimited_count: Number(c.unlimited_count || 0),
      is_out_of_stock: Number(c.prize_count || 0) === 0
    }))
  }
})
