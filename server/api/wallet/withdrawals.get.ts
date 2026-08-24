export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const db = getDb()
  const withdrawals = await db.prepare(`
    SELECT id, amount, bank_name, bank_account, status, note, created_at
    FROM withdrawal_requests
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(user.id)

  return { withdrawals }
})
