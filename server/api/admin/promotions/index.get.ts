// Admin API — ดึงโปรโมชั่นทั้งหมด (รวม inactive)
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || !user.is_admin) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง' })
  }

  const db = getDb()
  const promotions = await db.prepare(`
    SELECT * FROM promotions
    ORDER BY created_at DESC
  `).all()

  return { promotions }
})
