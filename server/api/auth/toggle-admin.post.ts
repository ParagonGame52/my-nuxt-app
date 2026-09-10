export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const db = getDb()
  const nextStatus = user.is_admin === 1 ? 0 : 1

  await db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(nextStatus, user.id)

  return { success: true, is_admin: nextStatus }
})
