export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสตู้สุ่ม' })

  const body = await readBody(event)
  const { name, price, image = '', description = '', is_active = 1, items = [] } = body

  if (!name || price === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'ข้อมูลชื่อหรือราคาไม่ครบถ้วน' })
  }

  const db = getDb()
  const executeUpdate = db.transaction(async () => {
    // 1. Update chest details
    await db.prepare(`
      UPDATE gacha_chests
      SET name = ?, price = ?, image = ?, description = ?, is_active = ?
      WHERE id = ?
    `).run(name, Number(price), image, description, Number(is_active), Number(id))

    // 2. Delete old items
    await db.prepare('DELETE FROM gacha_chest_items WHERE chest_id = ?').run(Number(id))

    // 3. Insert new items
    if (items.length > 0) {
      const insertItem = db.prepare(`
        INSERT INTO gacha_chest_items (chest_id, name, image, price, tier, odds, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const item of items) {
        const stockVal = item.stock !== undefined && item.stock !== '' && item.stock !== null ? Number(item.stock) : null
        await insertItem.run(
          Number(id),
          item.name || 'ของรางวัล',
          item.image || '',
          Number(item.price || 0),
          item.tier || 'normal',
          Number(item.odds ?? 100),
          stockVal
        )
      }
    }
  })

  try {
    await executeUpdate()
    return { success: true }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: 'แก้ไขตู้สุ่มล้มเหลว: ' + err.message })
  }
})
