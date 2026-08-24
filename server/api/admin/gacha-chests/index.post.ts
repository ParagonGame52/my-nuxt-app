export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const body = await readBody(event)
  const { name, price, image = '', description = '', is_active = 1, items = [] } = body

  if (!name || price === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'ข้อมูลชื่อหรือราคาไม่ครบถ้วน' })
  }

  const db = getDb()
  const executeCreate = db.transaction(async () => {
    const chestResult = await db.prepare(`
      INSERT INTO gacha_chests (name, price, image, description, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, Number(price), image, description, Number(is_active))
    
    const chestId = chestResult.lastInsertRowid as number

    if (items.length > 0) {
      const insertItem = db.prepare(`
        INSERT INTO gacha_chest_items (chest_id, name, image, price, tier, odds, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      for (const item of items) {
        const stockVal = item.stock !== undefined && item.stock !== '' && item.stock !== null ? Number(item.stock) : null
        await insertItem.run(
          chestId,
          item.name || 'ของรางวัล',
          item.image || '',
          Number(item.price || 0),
          item.tier || 'normal',
          Number(item.odds ?? 100),
          stockVal
        )
      }
    }

    return chestId
  })

  try {
    const id = await executeCreate()
    return { success: true, id }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: 'สร้างตู้สุ่มล้มเหลว: ' + err.message })
  }
})
