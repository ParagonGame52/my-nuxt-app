// Admin API — สร้างโปรโมชั่นใหม่
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || !user.is_admin) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง' })
  }

  const body = await readBody(event)
  const { title, description, image, badge, discount_text, start_date, end_date, is_active, target_category, promo_type, min_spend } = body

  if (!title || !description) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกหัวข้อและรายละเอียดโปรโมชั่น' })
  }

  const db = getDb()
  const result = await db.prepare(`
    INSERT INTO promotions (title, description, image, badge, discount_text, start_date, end_date, is_active, target_category, promo_type, min_spend)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description,
    image || '',
    badge || 'โปรโมชั่น',
    discount_text || '',
    start_date || new Date().toISOString().split('T')[0],
    end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active !== undefined ? (is_active ? 1 : 0) : 1,
    target_category || 'ALL',
    promo_type || 'product',
    Number(min_spend) || 0
  )

  const newPromo = await db.prepare('SELECT * FROM promotions WHERE id = ?').get(result.lastInsertRowid)
  return { success: true, promotion: newPromo }
})
