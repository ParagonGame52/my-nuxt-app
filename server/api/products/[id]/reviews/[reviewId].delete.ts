// Auth API — ลบรีวิว (เจ้าของหรือ admin เท่านั้น)
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const productId = Number(getRouterParam(event, 'id'))
  const reviewId = Number(getRouterParam(event, 'reviewId'))
  if (!reviewId) throw createError({ statusCode: 400, statusMessage: 'ไม่พบ ID รีวิว' })

  const db = getDb()
  const review = await db.prepare(
    'SELECT id, user_id FROM product_reviews WHERE id = ? AND product_id = ?'
  ).get(reviewId, productId) as any

  if (!review) throw createError({ statusCode: 404, statusMessage: 'ไม่พบรีวิวนี้' })

  // เฉพาะเจ้าของหรือ admin
  if (review.user_id !== user.id && !user.is_admin) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์ลบรีวิวนี้' })
  }

  await db.prepare('DELETE FROM product_reviews WHERE id = ?').run(reviewId)

  return { success: true }
})
