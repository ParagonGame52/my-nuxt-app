// Admin API — แก้ไขโปรโมชั่น
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || !user.is_admin) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID ไม่ถูกต้อง' })

  const db = getDb()
  const existing = await db.prepare('SELECT id FROM promotions WHERE id = ?').get(id)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'ไม่พบโปรโมชั่น' })

  const body = await readBody(event)
  const { title, description, image, badge, discount_text, start_date, end_date, is_active, target_category, promo_type, min_spend } = body

  await db.prepare(`
    UPDATE promotions SET
      title = ?, description = ?, image = ?, badge = ?,
      discount_text = ?, start_date = ?, end_date = ?,
      is_active = ?, target_category = ?, promo_type = ?,
      min_spend = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title, description, image || '', badge || 'โปรโมชั่น',
    discount_text || '', start_date, end_date,
    is_active ? 1 : 0, target_category || 'ALL', promo_type || 'product',
    Number(min_spend) || 0, id
  )

  const updated = await db.prepare('SELECT * FROM promotions WHERE id = ?').get(id)
  return { success: true, promotion: updated }
})
