export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const db = getDb()
  const requests = await db.prepare(`
    SELECT t.id, t.user_id, t.amount, t.status, t.created_at, t.slip_url, u.name as user_name, u.email as user_email
    FROM topup_requests t
    JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC
  `).all()

  return { requests }
})
