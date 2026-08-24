export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const db = getDb()
  const tickets = await db.prepare(
    'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC'
  ).all(user.id)

  return { tickets }
})

