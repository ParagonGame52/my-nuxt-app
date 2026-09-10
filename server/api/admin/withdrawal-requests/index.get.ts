export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user || user.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const db = getDb()
  const requests = await db.prepare(`
    SELECT w.id, w.user_id, w.amount, w.bank_name, w.bank_account, w.status, w.note, w.created_at,
           u.name as user_name, u.email as user_email
    FROM withdrawal_requests w
    JOIN users u ON u.id = w.user_id
    ORDER BY w.created_at DESC
  `).all()

  return { requests }
})
