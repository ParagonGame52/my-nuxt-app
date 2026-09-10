// Auth API — สร้างหรืออัปเดตรีวิว (เฉพาะผู้ที่เคยซื้อสินค้านี้)
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const productId = Number(getRouterParam(event, 'id'))
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบรหัสสินค้า' })

  const db = getDb()

  // ถ้าไม่ใช่ Admin ต้องตรวจสอบว่าเคยซื้อสินค้านี้หรือยัง (มี order ที่ชำระเงินแล้ว)
  if (!user.is_admin) {
    const hasPurchased = await db.prepare(`
      SELECT oi.id
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = ?
        AND oi.product_id = ?
        AND o.status NOT IN ('cancelled', 'pending_payment')
      LIMIT 1
    `).get(user.id, productId)

    if (!hasPurchased) {
      throw createError({ statusCode: 403, statusMessage: 'คุณสามารถรีวิวได้เฉพาะสินค้าที่คุณเคยสั่งซื้อและชำระเงินเรียบร้อยแล้วเท่านั้น' })
    }
  }

  const body = await readBody(event)
  const { rating, title, body: reviewBody } = body

  if (!rating || rating < 1 || rating > 5) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาให้คะแนน 1-5 ดาว' })
  }

  // Upsert: สร้างหรืออัปเดตรีวิวเดิม
  const existing = await db.prepare(
    'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?'
  ).get(productId, user.id)

  if (existing) {
    await db.prepare(`
      UPDATE product_reviews
      SET rating = ?, title = ?, body = ?, updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ? AND user_id = ?
    `).run(rating, title || '', reviewBody || '', productId, user.id)
  } else {
    await db.prepare(`
      INSERT INTO product_reviews (product_id, user_id, rating, title, body)
      VALUES (?, ?, ?, ?, ?)
    `).run(productId, user.id, rating, title || '', reviewBody || '')
  }

  const review = await db.prepare(`
    SELECT r.*, u.name AS user_name, u.avatar AS user_avatar
    FROM product_reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ? AND r.user_id = ?
  `).get(productId, user.id)

  return { success: true, review }
})
