// Admin API — ลบโปรโมชั่น
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

  await db.prepare('DELETE FROM promotions WHERE id = ?').run(id)
  return { success: true }
})
