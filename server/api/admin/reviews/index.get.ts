// Admin API — ดึงรีวิวทั้งหมด (กรองตาม product ได้)
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || !user.is_admin) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง' })
  }

  const query = getQuery(event)
  const productId = query.product_id ? Number(query.product_id) : null

  const db = getDb()

  const reviews = await db.prepare(`
    SELECT
      r.id,
      r.product_id,
      r.user_id,
      r.rating,
      r.title,
      r.body,
      r.created_at,
      COALESCE(u.name, 'ผู้ใช้งาน') AS user_name,
      u.avatar AS user_avatar,
      COALESCE(p.name, 'สินค้าที่ถูกลบหรือไม่มีในระบบ') AS product_name
    FROM product_reviews r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN products p ON p.id = r.product_id
    ${productId ? 'WHERE r.product_id = ?' : ''}
    ORDER BY r.created_at DESC
  `).all(...(productId ? [productId] : []))

  return { reviews }
})
