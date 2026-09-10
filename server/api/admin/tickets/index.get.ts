export default defineEventHandler(async (event) => {
  const adminUser = await getUserFromEvent(event)
  if (!adminUser || adminUser.is_admin < 1) {
    throw createError({ statusCode: 403, statusMessage: 'ไม่มีสิทธิ์เข้าถึง เฉพาะผู้ดูแลระบบเท่านั้น' })
  }

  const db = getDb()
  const tickets = await db.prepare(`
    SELECT st.*, u.name as user_name, u.email as user_email
    FROM support_tickets st
    JOIN users u ON u.id = st.user_id
    ORDER BY st.created_at DESC
  `).all()

  return { tickets }
})
