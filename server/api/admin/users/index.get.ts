export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const db = getDb()
  const users = await db.prepare('SELECT id, name, email, balance, is_admin, created_at, tier, total_spent, points FROM users ORDER BY created_at DESC').all()

  return { users }
})
