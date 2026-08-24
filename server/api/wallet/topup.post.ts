export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'กรุณาเข้าสู่ระบบก่อน' })

  const body = await readBody(event)
  const { amount } = body

  if (!amount || Number(amount) <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'จำนวนเงินไม่ถูกต้อง' })
  }

  const db = getDb()
  await db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(Number(amount), user.id)

  const updatedUser = await db.prepare('SELECT balance FROM users WHERE id = ?').get(user.id) as { balance: number }

  return { success: true, balance: updatedUser.balance }
})
