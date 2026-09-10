// Admin API — ลบรีวิวใดก็ได้
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || !user.is_admin) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ไม่พบ ID รีวิว' })

  const db = getDb()
  const existing = await db.prepare('SELECT id FROM product_reviews WHERE id = ?').get(id)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'ไม่พบรีวิวนี้' })

  await db.prepare('DELETE FROM product_reviews WHERE id = ?').run(id)

  return { success: true }
})
